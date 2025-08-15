const express = require('express');
const router = express.Router();
const encryptionService = require('../services/encryptionService');
const securityAuditService = require('../services/securityAuditService');
const dlpService = require('../services/dlpService');
const authenticateToken = require('../middleware/authMiddleware');

// Middleware to log security events
const logSecurityEvent = (eventType, action) => {
  return async (req, res, next) => {
    try {
      await securityAuditService.logAuditEvent({
        userId: req.user?.id,
        eventType,
        action,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
    next();
  };
};

// Encryption endpoints
router.post('/encrypt-message', 
  authenticateToken, 
  logSecurityEvent('message_encryption', 'ENCRYPT_MESSAGE'),
  async (req, res) => {
    try {
      const { conversationId, content } = req.body;

      if (!conversationId || !content) {
        return res.status(400).json({ 
          error: 'Conversation ID and content are required' 
        });
      }

      // Get or create conversation key
      let conversationKey = await encryptionService.getConversationKey(conversationId);
      if (!conversationKey) {
        conversationKey = await encryptionService.createConversationKey(conversationId);
      }

      // Encrypt the message
      const encryptedData = await encryptionService.encryptMessage(content, conversationKey.key);

      res.json({
        success: true,
        encryptedData,
        keyVersion: conversationKey.version
      });
    } catch (error) {
      console.error('Message encryption failed:', error);
      res.status(500).json({ error: 'Encryption failed' });
    }
  }
);

router.post('/decrypt-message', 
  authenticateToken, 
  logSecurityEvent('message_decryption', 'DECRYPT_MESSAGE'),
  async (req, res) => {
    try {
      const { conversationId, encryptedData } = req.body;

      if (!conversationId || !encryptedData) {
        return res.status(400).json({ 
          error: 'Conversation ID and encrypted data are required' 
        });
      }

      // Get conversation key
      const conversationKey = await encryptionService.getConversationKey(conversationId);
      if (!conversationKey) {
        return res.status(404).json({ error: 'Conversation key not found' });
      }

      // Decrypt the message
      const decryptedContent = await encryptionService.decryptMessage(encryptedData, conversationKey.key);

      res.json({
        success: true,
        content: decryptedContent
      });
    } catch (error) {
      console.error('Message decryption failed:', error);
      res.status(500).json({ error: 'Decryption failed' });
    }
  }
);

// Key management endpoints
router.post('/rotate-key/:conversationId', 
  authenticateToken, 
  logSecurityEvent('encryption_key_rotation', 'ROTATE_CONVERSATION_KEY'),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const newKey = await encryptionService.rotateConversationKey(conversationId);

      res.json({
        success: true,
        message: 'Conversation key rotated successfully',
        keyVersion: newKey.version
      });
    } catch (error) {
      console.error('Key rotation failed:', error);
      res.status(500).json({ error: 'Key rotation failed' });
    }
  }
);

// DLP endpoints
router.post('/scan-content', 
  authenticateToken, 
  logSecurityEvent('dlp_scan', 'SCAN_MESSAGE_CONTENT'),
  async (req, res) => {
    try {
      const { content, conversationId } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const scanResult = await dlpService.scanMessageContent(
        content, 
        req.user.id, 
        conversationId
      );

      res.json({
        success: true,
        ...scanResult
      });
    } catch (error) {
      console.error('Content scan failed:', error);
      res.status(500).json({ error: 'Content scan failed' });
    }
  }
);

router.post('/validate-file', 
  authenticateToken, 
  logSecurityEvent('dlp_file_validation', 'VALIDATE_FILE_UPLOAD'),
  async (req, res) => {
    try {
      const { filename, fileSize, fileType } = req.body;

      if (!filename || !fileSize) {
        return res.status(400).json({ error: 'Filename and file size are required' });
      }

      // Create mock file object for validation
      const mockFile = {
        originalname: filename,
        size: fileSize,
        mimetype: fileType
      };

      const validationResult = await dlpService.validateFileUpload(mockFile, req.user.id);

      res.json({
        success: true,
        ...validationResult
      });
    } catch (error) {
      console.error('File validation failed:', error);
      res.status(500).json({ error: 'File validation failed' });
    }
  }
);

router.get('/dlp-policies', 
  authenticateToken, 
  logSecurityEvent('dlp_policy_access', 'GET_DLP_POLICIES'),
  async (req, res) => {
    try {
      const policies = dlpService.getPolicies();
      res.json({
        success: true,
        policies
      });
    } catch (error) {
      console.error('Failed to get DLP policies:', error);
      res.status(500).json({ error: 'Failed to get DLP policies' });
    }
  }
);

// Audit and compliance endpoints
router.get('/audit-logs', 
  authenticateToken, 
  logSecurityEvent('audit_log_access', 'GET_AUDIT_LOGS'),
  async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        eventType, 
        riskLevel, 
        userId,
        limit = 50 
      } = req.query;

      const filters = {};
      if (eventType) filters.eventType = eventType;
      if (riskLevel) filters.riskLevel = riskLevel;
      if (userId) filters.userId = userId;

      const report = await securityAuditService.generateSecurityReport(
        startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: last 7 days
        endDate || new Date(),
        filters
      );

      res.json({
        success: true,
        ...report
      });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }
);

router.get('/security-alerts', 
  authenticateToken, 
  logSecurityEvent('security_alert_access', 'GET_SECURITY_ALERTS'),
  async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const alerts = await securityAuditService.getActiveAlerts(parseInt(limit));

      res.json({
        success: true,
        alerts
      });
    } catch (error) {
      console.error('Failed to get security alerts:', error);
      res.status(500).json({ error: 'Failed to get security alerts' });
    }
  }
);

router.put('/security-alerts/:alertId/resolve', 
  authenticateToken, 
  logSecurityEvent('security_alert_resolution', 'RESOLVE_SECURITY_ALERT'),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({ error: 'Resolution is required' });
      }

      const resolvedAlert = await securityAuditService.resolveAlert(
        alertId, 
        req.user.id, 
        resolution
      );

      res.json({
        success: true,
        alert: resolvedAlert
      });
    } catch (error) {
      console.error('Failed to resolve security alert:', error);
      res.status(500).json({ error: 'Failed to resolve security alert' });
    }
  }
);

// DLP report endpoint
router.get('/dlp-report', 
  authenticateToken, 
  logSecurityEvent('dlp_report_access', 'GET_DLP_REPORT'),
  async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        userId 
      } = req.query;

      const report = await dlpService.generateDLPReport(
        startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: last 7 days
        endDate || new Date(),
        userId
      );

      res.json({
        success: true,
        ...report
      });
    } catch (error) {
      console.error('Failed to generate DLP report:', error);
      res.status(500).json({ error: 'Failed to generate DLP report' });
    }
  }
);

// Data retention endpoint
router.post('/enforce-retention', 
  authenticateToken, 
  logSecurityEvent('data_retention', 'ENFORCE_DATA_RETENTION'),
  async (req, res) => {
    try {
      const results = await securityAuditService.enforceDataRetention();

      res.json({
        success: true,
        message: 'Data retention policies enforced',
        results
      });
    } catch (error) {
      console.error('Failed to enforce data retention:', error);
      res.status(500).json({ error: 'Failed to enforce data retention' });
    }
  }
);

module.exports = router;
