const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SecurityAuditService {
  constructor() {
    this.auditTypes = {
      MESSAGE_SENT: 'message_sent',
      MESSAGE_READ: 'message_read',
      MESSAGE_DELETED: 'message_deleted',
      MESSAGE_EDITED: 'message_edited',
      CONVERSATION_CREATED: 'conversation_created',
      CONVERSATION_JOINED: 'conversation_joined',
      CONVERSATION_LEFT: 'conversation_left',
      FILE_UPLOADED: 'file_uploaded',
      FILE_DOWNLOADED: 'file_downloaded',
      LOGIN_ATTEMPT: 'login_attempt',
      LOGIN_SUCCESS: 'login_success',
      LOGIN_FAILURE: 'login_failure',
      PERMISSION_DENIED: 'permission_denied',
      DATA_EXPORT: 'data_export',
      ENCRYPTION_KEY_ROTATION: 'encryption_key_rotation',
      COMPLIANCE_VIOLATION: 'compliance_violation'
    };

    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  // Log security audit event
  async logAuditEvent(eventData) {
    try {
      const auditLog = await prisma.securityAuditLog.create({
        data: {
          userId: eventData.userId ? parseInt(eventData.userId) : null,
          eventType: eventData.eventType,
          resourceType: eventData.resourceType || 'message',
          resourceId: eventData.resourceId ? parseInt(eventData.resourceId) : null,
          action: eventData.action,
          riskLevel: eventData.riskLevel || this.riskLevels.LOW,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          metadata: eventData.metadata || {},
          success: eventData.success !== false,
          errorMessage: eventData.errorMessage,
          timestamp: new Date()
        }
      });

      // Check for compliance violations
      await this.checkComplianceViolations(auditLog);

      return auditLog;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw error;
    }
  }

  // Check for compliance violations
  async checkComplianceViolations(auditLog) {
    const violations = [];

    // GDPR Compliance Checks
    if (auditLog.eventType === this.auditTypes.DATA_EXPORT) {
      const recentExports = await this.getRecentAuditEvents(
        auditLog.userId,
        this.auditTypes.DATA_EXPORT,
        24 // hours
      );

      if (recentExports.length > 5) {
        violations.push({
          type: 'GDPR_EXCESSIVE_DATA_EXPORT',
          description: 'User has exported data more than 5 times in 24 hours',
          severity: this.riskLevels.HIGH
        });
      }
    }

    // Failed login attempts
    if (auditLog.eventType === this.auditTypes.LOGIN_FAILURE) {
      const recentFailures = await this.getRecentAuditEvents(
        auditLog.userId,
        this.auditTypes.LOGIN_FAILURE,
        1 // hour
      );

      if (recentFailures.length >= 5) {
        violations.push({
          type: 'BRUTE_FORCE_ATTEMPT',
          description: 'Multiple failed login attempts detected',
          severity: this.riskLevels.CRITICAL
        });
      }
    }

    // Unusual file access patterns
    if (auditLog.eventType === this.auditTypes.FILE_DOWNLOADED) {
      const recentDownloads = await this.getRecentAuditEvents(
        auditLog.userId,
        this.auditTypes.FILE_DOWNLOADED,
        1 // hour
      );

      if (recentDownloads.length > 20) {
        violations.push({
          type: 'SUSPICIOUS_FILE_ACCESS',
          description: 'Unusual file download pattern detected',
          severity: this.riskLevels.HIGH
        });
      }
    }

    // Log violations
    for (const violation of violations) {
      await this.logComplianceViolation(auditLog.userId, violation);
    }
  }

  // Log compliance violation
  async logComplianceViolation(userId, violation) {
    await this.logAuditEvent({
      userId,
      eventType: this.auditTypes.COMPLIANCE_VIOLATION,
      action: violation.type,
      riskLevel: violation.severity,
      metadata: {
        description: violation.description,
        violationType: violation.type,
        detectedAt: new Date().toISOString()
      }
    });

    // Send alert to security team
    await this.sendSecurityAlert(violation, userId);
  }

  // Get recent audit events
  async getRecentAuditEvents(userId, eventType, hoursBack) {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    return await prisma.securityAuditLog.findMany({
      where: {
        userId: userId ? parseInt(userId) : undefined,
        eventType,
        timestamp: {
          gte: since
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  // Generate security report
  async generateSecurityReport(startDate, endDate, filters = {}) {
    const whereClause = {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (filters.userId) {
      whereClause.userId = parseInt(filters.userId);
    }

    if (filters.eventType) {
      whereClause.eventType = filters.eventType;
    }

    if (filters.riskLevel) {
      whereClause.riskLevel = filters.riskLevel;
    }

    const events = await prisma.securityAuditLog.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Generate statistics
    const stats = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByRiskLevel: {},
      topUsers: {},
      timelineData: []
    };

    events.forEach(event => {
      // Count by type
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      
      // Count by risk level
      stats.eventsByRiskLevel[event.riskLevel] = (stats.eventsByRiskLevel[event.riskLevel] || 0) + 1;
      
      // Count by user
      if (event.userId) {
        const userKey = `${event.user?.firstName} ${event.user?.lastName}`;
        stats.topUsers[userKey] = (stats.topUsers[userKey] || 0) + 1;
      }
    });

    return {
      events,
      statistics: stats,
      generatedAt: new Date(),
      period: { startDate, endDate }
    };
  }

  // Send security alert
  async sendSecurityAlert(violation, userId) {
    // In production, integrate with email service, Slack, etc.
    console.log(`🚨 SECURITY ALERT: ${violation.type}`, {
      userId,
      description: violation.description,
      severity: violation.severity,
      timestamp: new Date().toISOString()
    });

    // Store alert for dashboard
    await prisma.securityAlert.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        alertType: violation.type,
        severity: violation.severity,
        description: violation.description,
        status: 'active',
        metadata: {
          detectedAt: new Date().toISOString(),
          autoGenerated: true
        }
      }
    });
  }

  // Get active security alerts
  async getActiveAlerts(limit = 50) {
    return await prisma.securityAlert.findMany({
      where: {
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  // Resolve security alert
  async resolveAlert(alertId, resolvedBy, resolution) {
    return await prisma.securityAlert.update({
      where: {
        id: parseInt(alertId)
      },
      data: {
        status: 'resolved',
        resolvedBy: parseInt(resolvedBy),
        resolution,
        resolvedAt: new Date()
      }
    });
  }

  // Data retention compliance
  async enforceDataRetention() {
    const retentionPolicies = {
      auditLogs: 2555, // 7 years in days (compliance requirement)
      messages: 365,   // 1 year
      files: 365       // 1 year
    };

    const results = {};

    // Clean old audit logs
    const auditCutoff = new Date();
    auditCutoff.setDate(auditCutoff.getDate() - retentionPolicies.auditLogs);
    
    const deletedAuditLogs = await prisma.securityAuditLog.deleteMany({
      where: {
        timestamp: {
          lt: auditCutoff
        }
      }
    });
    results.deletedAuditLogs = deletedAuditLogs.count;

    // Archive old messages (don't delete, just mark for archival)
    const messageCutoff = new Date();
    messageCutoff.setDate(messageCutoff.getDate() - retentionPolicies.messages);
    
    const archivedMessages = await prisma.message.updateMany({
      where: {
        createdAt: {
          lt: messageCutoff
        },
        archived: false
      },
      data: {
        archived: true,
        archivedAt: new Date()
      }
    });
    results.archivedMessages = archivedMessages.count;

    return results;
  }
}

module.exports = new SecurityAuditService();
