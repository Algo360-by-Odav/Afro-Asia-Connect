const securityAuditService = require('./securityAuditService');

class DataLossPreventionService {
  constructor() {
    // Sensitive data patterns
    this.patterns = {
      creditCard: {
        regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        name: 'Credit Card Number',
        severity: 'high'
      },
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        name: 'Social Security Number',
        severity: 'high'
      },
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        name: 'Email Address',
        severity: 'medium'
      },
      phone: {
        regex: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        name: 'Phone Number',
        severity: 'medium'
      },
      ipAddress: {
        regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        name: 'IP Address',
        severity: 'medium'
      },
      passport: {
        regex: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
        name: 'Passport Number',
        severity: 'high'
      },
      bankAccount: {
        regex: /\b\d{8,17}\b/g,
        name: 'Bank Account Number',
        severity: 'high'
      },
      apiKey: {
        regex: /\b[A-Za-z0-9]{32,}\b/g,
        name: 'API Key',
        severity: 'high'
      },
      confidential: {
        regex: /\b(confidential|secret|private|internal|restricted)\b/gi,
        name: 'Confidential Keywords',
        severity: 'medium'
      }
    };

    // File type restrictions
    this.restrictedFileTypes = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
      '.jar', '.vbs', '.js', '.ps1', '.sh'
    ];

    // Maximum file size (in bytes)
    this.maxFileSize = 50 * 1024 * 1024; // 50MB

    // Blocked domains
    this.blockedDomains = [
      'tempmail.org',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com'
    ];
  }

  // Scan message content for sensitive data
  async scanMessageContent(content, userId, conversationId) {
    const violations = [];
    const detectedPatterns = [];

    // Scan for sensitive patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        detectedPatterns.push({
          type: patternName,
          name: pattern.name,
          severity: pattern.severity,
          matches: matches.length,
          samples: matches.slice(0, 3) // First 3 matches for review
        });

        violations.push({
          type: 'SENSITIVE_DATA_DETECTED',
          severity: pattern.severity,
          description: `${pattern.name} detected in message content`,
          metadata: {
            patternType: patternName,
            matchCount: matches.length
          }
        });
      }
    }

    // Log violations
    for (const violation of violations) {
      await securityAuditService.logAuditEvent({
        userId,
        eventType: 'compliance_violation',
        resourceType: 'message',
        resourceId: conversationId,
        action: violation.type,
        riskLevel: violation.severity,
        metadata: {
          ...violation.metadata,
          detectedPatterns,
          originalContent: content.substring(0, 100) + '...' // Truncated for security
        }
      });
    }

    return {
      allowed: violations.filter(v => v.severity === 'high').length === 0,
      violations,
      detectedPatterns,
      sanitizedContent: this.sanitizeContent(content, detectedPatterns)
    };
  }

  // Sanitize content by masking sensitive data
  sanitizeContent(content, detectedPatterns) {
    let sanitized = content;

    for (const pattern of detectedPatterns) {
      const patternConfig = this.patterns[pattern.type];
      if (patternConfig && pattern.severity === 'high') {
        sanitized = sanitized.replace(patternConfig.regex, (match) => {
          // Mask all but last 4 characters
          if (match.length > 4) {
            return '*'.repeat(match.length - 4) + match.slice(-4);
          }
          return '*'.repeat(match.length);
        });
      }
    }

    return sanitized;
  }

  // Validate file upload
  async validateFileUpload(file, userId) {
    const violations = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      violations.push({
        type: 'FILE_SIZE_EXCEEDED',
        severity: 'medium',
        description: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${this.maxFileSize / 1024 / 1024}MB`
      });
    }

    // Check file extension
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (this.restrictedFileTypes.includes(fileExtension)) {
      violations.push({
        type: 'RESTRICTED_FILE_TYPE',
        severity: 'high',
        description: `File type ${fileExtension} is not allowed`
      });
    }

    // Scan filename for sensitive patterns
    const filenameScan = await this.scanMessageContent(file.originalname, userId, null);
    if (filenameScan.violations.length > 0) {
      violations.push(...filenameScan.violations.map(v => ({
        ...v,
        description: `Sensitive data detected in filename: ${v.description}`
      })));
    }

    // Log file upload attempt
    await securityAuditService.logAuditEvent({
      userId,
      eventType: 'file_uploaded',
      action: 'FILE_UPLOAD_VALIDATION',
      riskLevel: violations.length > 0 ? 'medium' : 'low',
      metadata: {
        filename: file.originalname,
        fileSize: file.size,
        fileType: fileExtension,
        violations: violations.length,
        allowed: violations.filter(v => v.severity === 'high').length === 0
      }
    });

    return {
      allowed: violations.filter(v => v.severity === 'high').length === 0,
      violations,
      sanitizedFilename: this.sanitizeContent(file.originalname, filenameScan.detectedPatterns)
    };
  }

  // Check email domain restrictions
  validateEmailDomain(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (this.blockedDomains.includes(domain)) {
      return {
        allowed: false,
        violation: {
          type: 'BLOCKED_EMAIL_DOMAIN',
          severity: 'medium',
          description: `Email domain ${domain} is blocked`
        }
      };
    }

    return { allowed: true };
  }

  // Generate DLP report
  async generateDLPReport(startDate, endDate, userId = null) {
    const auditEvents = await securityAuditService.getRecentAuditEvents(
      userId,
      'compliance_violation',
      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60)) // hours
    );

    const dlpEvents = auditEvents.filter(event => 
      event.action && (
        event.action.includes('SENSITIVE_DATA_DETECTED') ||
        event.action.includes('FILE_SIZE_EXCEEDED') ||
        event.action.includes('RESTRICTED_FILE_TYPE') ||
        event.action.includes('BLOCKED_EMAIL_DOMAIN')
      )
    );

    // Analyze patterns
    const analysis = {
      totalViolations: dlpEvents.length,
      violationsByType: {},
      violationsBySeverity: {},
      topUsers: {},
      trends: []
    };

    dlpEvents.forEach(event => {
      // Count by type
      const violationType = event.action;
      analysis.violationsByType[violationType] = (analysis.violationsByType[violationType] || 0) + 1;

      // Count by severity
      analysis.violationsBySeverity[event.riskLevel] = (analysis.violationsBySeverity[event.riskLevel] || 0) + 1;

      // Count by user
      if (event.userId) {
        analysis.topUsers[event.userId] = (analysis.topUsers[event.userId] || 0) + 1;
      }
    });

    return {
      events: dlpEvents,
      analysis,
      generatedAt: new Date(),
      period: { startDate, endDate }
    };
  }

  // Update DLP policies
  updatePolicies(newPolicies) {
    if (newPolicies.patterns) {
      Object.assign(this.patterns, newPolicies.patterns);
    }

    if (newPolicies.restrictedFileTypes) {
      this.restrictedFileTypes = [...new Set([...this.restrictedFileTypes, ...newPolicies.restrictedFileTypes])];
    }

    if (newPolicies.maxFileSize) {
      this.maxFileSize = newPolicies.maxFileSize;
    }

    if (newPolicies.blockedDomains) {
      this.blockedDomains = [...new Set([...this.blockedDomains, ...newPolicies.blockedDomains])];
    }

    return {
      success: true,
      updatedAt: new Date(),
      policies: {
        patterns: Object.keys(this.patterns).length,
        restrictedFileTypes: this.restrictedFileTypes.length,
        maxFileSize: this.maxFileSize,
        blockedDomains: this.blockedDomains.length
      }
    };
  }

  // Get current DLP policies
  getPolicies() {
    return {
      patterns: this.patterns,
      restrictedFileTypes: this.restrictedFileTypes,
      maxFileSize: this.maxFileSize,
      blockedDomains: this.blockedDomains
    };
  }
}

module.exports = new DataLossPreventionService();
