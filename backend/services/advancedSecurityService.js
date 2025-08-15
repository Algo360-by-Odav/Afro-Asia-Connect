const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdvancedSecurityService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  /**
   * End-to-end message encryption
   */
  async encryptMessage(messageContent, conversationId, senderId) {
    try {
      // Generate or retrieve conversation encryption key
      const encryptionKey = await this.getOrCreateConversationKey(conversationId);
      
      // Encrypt the message
      const encrypted = this.encryptData(messageContent, encryptionKey);
      
      // Store encryption metadata
      await this.storeEncryptionMetadata(conversationId, senderId, encrypted.keyId);
      
      return {
        success: true,
        encryptedContent: encrypted.data,
        encryptionMetadata: {
          keyId: encrypted.keyId,
          algorithm: this.algorithm,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt message for authorized users
   */
  async decryptMessage(encryptedContent, conversationId, userId) {
    try {
      // Verify user has access to conversation
      const hasAccess = await this.verifyConversationAccess(conversationId, userId);
      if (!hasAccess) {
        throw new Error('Unauthorized access to encrypted conversation');
      }

      // Get encryption key
      const encryptionKey = await this.getConversationKey(conversationId);
      
      // Decrypt the message
      const decryptedContent = this.decryptData(encryptedContent, encryptionKey);
      
      // Log access for audit trail
      await this.logDecryptionAccess(conversationId, userId);
      
      return {
        success: true,
        content: decryptedContent
      };
    } catch (error) {
      console.error('Error decrypting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Message retention policies
   */
  async applyRetentionPolicy(conversationId, policyType = 'standard') {
    try {
      const policies = {
        standard: { days: 365 },
        compliance: { days: 2555 }, // 7 years
        temporary: { days: 30 },
        permanent: { days: null } // Never delete
      };

      const policy = policies[policyType];
      if (!policy) {
        throw new Error('Invalid retention policy type');
      }

      // Apply retention policy to conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          retentionPolicy: policyType,
          retentionDays: policy.days,
          retentionAppliedAt: new Date()
        }
      });

      // Schedule cleanup if applicable
      if (policy.days) {
        await this.scheduleMessageCleanup(conversationId, policy.days);
      }

      return {
        success: true,
        policy: {
          type: policyType,
          retentionDays: policy.days,
          appliedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error applying retention policy:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Data Loss Prevention (DLP)
   */
  async scanMessageForSensitiveData(messageContent, userId) {
    try {
      const sensitivePatterns = {
        creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        bankAccount: /\b\d{8,17}\b/g,
        passport: /\b[A-Z]{1,2}\d{6,9}\b/g
      };

      const detectedSensitiveData = [];
      
      for (const [type, pattern] of Object.entries(sensitivePatterns)) {
        const matches = messageContent.match(pattern);
        if (matches) {
          detectedSensitiveData.push({
            type,
            matches: matches.length,
            severity: this.getSeverityLevel(type)
          });
        }
      }

      // Log DLP scan results
      await this.logDLPScan(userId, detectedSensitiveData);

      const shouldBlock = detectedSensitiveData.some(data => data.severity === 'high');

      return {
        success: true,
        sensitiveDataDetected: detectedSensitiveData.length > 0,
        detectedData: detectedSensitiveData,
        shouldBlock,
        recommendation: shouldBlock ? 'block' : 'allow',
        sanitizedContent: this.sanitizeContent(messageContent, sensitivePatterns)
      };
    } catch (error) {
      console.error('Error scanning message for sensitive data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Audit trail and compliance logging
   */
  async createAuditLog(action, userId, resourceId, details = {}) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action,
          userId,
          resourceId,
          resourceType: details.resourceType || 'message',
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          timestamp: new Date(),
          details: JSON.stringify(details),
          severity: details.severity || 'info'
        }
      });

      return {
        success: true,
        auditLogId: auditLog.id
      };
    } catch (error) {
      console.error('Error creating audit log:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Role-based access controls
   */
  async enforceRoleBasedAccess(userId, action, resourceId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const permissions = await this.getUserPermissions(user.roles);
      const hasPermission = this.checkPermission(permissions, action, resourceId);

      if (!hasPermission) {
        // Log unauthorized access attempt
        await this.createAuditLog('unauthorized_access_attempt', userId, resourceId, {
          action,
          severity: 'warning'
        });
        
        return {
          success: false,
          error: 'Insufficient permissions',
          requiredPermission: action
        };
      }

      return {
        success: true,
        permissions: permissions.map(p => p.name)
      };
    } catch (error) {
      console.error('Error enforcing role-based access:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate, complianceType = 'gdpr') {
    try {
      const report = {
        period: { startDate, endDate },
        complianceType,
        generatedAt: new Date().toISOString(),
        metrics: {}
      };

      // Data processing activities
      report.metrics.dataProcessing = await this.getDataProcessingMetrics(startDate, endDate);
      
      // Access logs
      report.metrics.accessLogs = await this.getAccessLogMetrics(startDate, endDate);
      
      // Data retention compliance
      report.metrics.dataRetention = await this.getDataRetentionMetrics(startDate, endDate);
      
      // Security incidents
      report.metrics.securityIncidents = await this.getSecurityIncidentMetrics(startDate, endDate);
      
      // User consent tracking
      report.metrics.userConsent = await this.getUserConsentMetrics(startDate, endDate);

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  encryptData(data, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex'),
      keyId: crypto.createHash('sha256').update(key).digest('hex').substring(0, 8)
    };
  }

  decryptData(encryptedData, key) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async getOrCreateConversationKey(conversationId) {
    let keyRecord = await prisma.encryptionKey.findUnique({
      where: { conversationId }
    });

    if (!keyRecord) {
      const key = crypto.randomBytes(this.keyLength);
      keyRecord = await prisma.encryptionKey.create({
        data: {
          conversationId,
          keyData: key.toString('base64'),
          algorithm: this.algorithm,
          createdAt: new Date()
        }
      });
    }

    return Buffer.from(keyRecord.keyData, 'base64');
  }

  async getConversationKey(conversationId) {
    const keyRecord = await prisma.encryptionKey.findUnique({
      where: { conversationId }
    });

    if (!keyRecord) {
      throw new Error('Encryption key not found for conversation');
    }

    return Buffer.from(keyRecord.keyData, 'base64');
  }

  async verifyConversationAccess(conversationId, userId) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        status: 'active'
      }
    });

    return !!participant;
  }

  getSeverityLevel(dataType) {
    const severityMap = {
      creditCard: 'high',
      ssn: 'high',
      bankAccount: 'high',
      passport: 'high',
      email: 'medium',
      phone: 'low'
    };

    return severityMap[dataType] || 'low';
  }

  sanitizeContent(content, patterns) {
    let sanitized = content;
    
    for (const [type, pattern] of Object.entries(patterns)) {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    }
    
    return sanitized;
  }

  async scheduleMessageCleanup(conversationId, retentionDays) {
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() + retentionDays);

    await prisma.scheduledTask.create({
      data: {
        type: 'message_cleanup',
        resourceId: conversationId,
        scheduledFor: cleanupDate,
        status: 'pending',
        parameters: JSON.stringify({ conversationId, retentionDays })
      }
    });
  }

  async getUserPermissions(roles) {
    const permissions = [];
    
    for (const role of roles) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });
      
      permissions.push(...rolePermissions.map(rp => rp.permission));
    }
    
    return permissions;
  }

  checkPermission(permissions, action, resourceId) {
    return permissions.some(permission => 
      permission.name === action || permission.name === 'admin'
    );
  }

  async storeEncryptionMetadata(conversationId, userId, keyId) {
    await prisma.encryptionMetadata.create({
      data: {
        conversationId,
        userId,
        keyId,
        algorithm: this.algorithm,
        createdAt: new Date()
      }
    });
  }

  async logDecryptionAccess(conversationId, userId) {
    await this.createAuditLog('message_decrypt', userId, conversationId, {
      resourceType: 'conversation',
      severity: 'info'
    });
  }

  async logDLPScan(userId, detectedData) {
    await this.createAuditLog('dlp_scan', userId, null, {
      resourceType: 'message',
      detectedSensitiveData: detectedData,
      severity: detectedData.length > 0 ? 'warning' : 'info'
    });
  }

  // Compliance metrics methods
  async getDataProcessingMetrics(startDate, endDate) {
    const messageCount = await prisma.message.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const encryptedMessageCount = await prisma.message.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isEncrypted: true
      }
    });

    return {
      totalMessages: messageCount,
      encryptedMessages: encryptedMessageCount,
      encryptionRate: messageCount > 0 ? (encryptedMessageCount / messageCount) * 100 : 0
    };
  }

  async getAccessLogMetrics(startDate, endDate) {
    const totalAccess = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      }
    });

    const unauthorizedAttempts = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        action: 'unauthorized_access_attempt'
      }
    });

    return {
      totalAccessEvents: totalAccess,
      unauthorizedAttempts,
      securityScore: totalAccess > 0 ? ((totalAccess - unauthorizedAttempts) / totalAccess) * 100 : 100
    };
  }

  async getDataRetentionMetrics(startDate, endDate) {
    const conversationsWithPolicy = await prisma.conversation.count({
      where: {
        retentionAppliedAt: { gte: startDate, lte: endDate }
      }
    });

    const totalConversations = await prisma.conversation.count();

    return {
      conversationsWithRetentionPolicy: conversationsWithPolicy,
      totalConversations,
      complianceRate: totalConversations > 0 ? (conversationsWithPolicy / totalConversations) * 100 : 0
    };
  }

  async getSecurityIncidentMetrics(startDate, endDate) {
    const incidents = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        severity: { in: ['warning', 'error', 'critical'] }
      }
    });

    return {
      totalIncidents: incidents,
      averageIncidentsPerDay: incidents / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    };
  }

  async getUserConsentMetrics(startDate, endDate) {
    const consentRecords = await prisma.userConsent.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: { gte: startDate, lte: endDate }
      }
    });

    return {
      consentRecords,
      activeUsers,
      consentRate: activeUsers > 0 ? (consentRecords / activeUsers) * 100 : 0
    };
  }
}

module.exports = new AdvancedSecurityService();
