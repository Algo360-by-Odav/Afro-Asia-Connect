const express = require('express');
const router = express.Router();
const aiMessageService = require('../services/aiMessageService');
const advancedSecurityService = require('../services/advancedSecurityService');
const businessAutomationService = require('../services/businessAutomationService');
const auth = require('../middleware/authMiddleware');

// AI-Powered Features Routes

/**
 * GET /api/advanced-messaging/suggestions
 * Generate smart message suggestions
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { conversationId, context } = req.query;
    const userId = req.user.id;

    const result = await aiMessageService.generateMessageSuggestions(
      userId, 
      conversationId, 
      JSON.parse(context || '{}')
    );

    if (result.success) {
      res.json({
        success: true,
        suggestions: result.suggestions,
        context: result.context
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting message suggestions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/autocomplete
 * Get auto-complete suggestions for message input
 */
router.post('/autocomplete', auth, async (req, res) => {
  try {
    const { partialText, context } = req.body;
    const userId = req.user.id;

    const result = await aiMessageService.getAutoCompleteOptions(userId, partialText, context);

    if (result.success) {
      res.json({
        success: true,
        suggestions: result.suggestions
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/analyze-sentiment
 * Analyze message sentiment
 */
router.post('/analyze-sentiment', auth, async (req, res) => {
  try {
    const { messageText } = req.body;

    const result = await aiMessageService.analyzeSentiment(messageText);

    if (result.success) {
      res.json({
        success: true,
        sentiment: result.sentiment
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/translate
 * Translate message to different language
 */
router.post('/translate', auth, async (req, res) => {
  try {
    const { messageText, fromLanguage, toLanguage } = req.body;

    const result = await aiMessageService.translateMessage(messageText, fromLanguage, toLanguage);

    if (result.success) {
      res.json({
        success: true,
        translation: result.translation
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error translating message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/chatbot
 * Generate AI chatbot response
 */
router.post('/chatbot', auth, async (req, res) => {
  try {
    const { userMessage, context } = req.body;

    const result = await aiMessageService.generateChatbotResponse(userMessage, context);

    if (result.success) {
      res.json({
        success: true,
        response: result.response
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Advanced Security Routes

/**
 * POST /api/advanced-messaging/encrypt
 * Encrypt message content
 */
router.post('/encrypt', auth, async (req, res) => {
  try {
    const { messageContent, conversationId } = req.body;
    const userId = req.user.id;

    const result = await advancedSecurityService.encryptMessage(messageContent, conversationId, userId);

    if (result.success) {
      res.json({
        success: true,
        encryptedContent: result.encryptedContent,
        metadata: result.encryptionMetadata
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error encrypting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/decrypt
 * Decrypt message content
 */
router.post('/decrypt', auth, async (req, res) => {
  try {
    const { encryptedContent, conversationId } = req.body;
    const userId = req.user.id;

    const result = await advancedSecurityService.decryptMessage(encryptedContent, conversationId, userId);

    if (result.success) {
      res.json({
        success: true,
        content: result.content
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error decrypting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/scan-sensitive-data
 * Scan message for sensitive data (DLP)
 */
router.post('/scan-sensitive-data', auth, async (req, res) => {
  try {
    const { messageContent } = req.body;
    const userId = req.user.id;

    const result = await advancedSecurityService.scanMessageForSensitiveData(messageContent, userId);

    if (result.success) {
      res.json({
        success: true,
        sensitiveDataDetected: result.sensitiveDataDetected,
        detectedData: result.detectedData,
        shouldBlock: result.shouldBlock,
        recommendation: result.recommendation,
        sanitizedContent: result.sanitizedContent
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error scanning for sensitive data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/retention-policy
 * Apply data retention policy to conversation
 */
router.post('/retention-policy', auth, async (req, res) => {
  try {
    const { conversationId, policyType } = req.body;

    const result = await advancedSecurityService.applyRetentionPolicy(conversationId, policyType);

    if (result.success) {
      res.json({
        success: true,
        policy: result.policy
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error applying retention policy:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/advanced-messaging/compliance-report
 * Generate compliance report
 */
router.get('/compliance-report', auth, async (req, res) => {
  try {
    const { startDate, endDate, complianceType } = req.query;

    const result = await advancedSecurityService.generateComplianceReport(
      new Date(startDate),
      new Date(endDate),
      complianceType
    );

    if (result.success) {
      res.json({
        success: true,
        report: result.report
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Business Automation Routes

/**
 * POST /api/advanced-messaging/schedule-followup
 * Schedule automated follow-up
 */
router.post('/schedule-followup', auth, async (req, res) => {
  try {
    const { conversationId, followUpType, delay } = req.body;
    const userId = req.user.id;

    const result = await businessAutomationService.scheduleFollowUp(
      conversationId,
      userId,
      followUpType,
      delay
    );

    if (result.success) {
      res.json({
        success: true,
        followUpId: result.followUpId,
        scheduledFor: result.scheduledFor,
        template: result.template
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/calculate-lead-score
 * Calculate lead score for conversation
 */
router.post('/calculate-lead-score', auth, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    const result = await businessAutomationService.calculateLeadScore(conversationId, userId);

    if (result.success) {
      res.json({
        success: true,
        leadScore: result.leadScore
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error calculating lead score:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/advanced-messaging/business-matches
 * Find smart business matches
 */
router.get('/business-matches', auth, async (req, res) => {
  try {
    const { industry, location, businessSize, interests } = req.query;
    const userId = req.user.id;

    const criteria = {
      industry,
      location,
      businessSize,
      interests: interests ? interests.split(',') : []
    };

    const result = await businessAutomationService.findBusinessMatches(userId, criteria);

    if (result.success) {
      res.json({
        success: true,
        matches: result.matches,
        criteria: result.criteria,
        totalFound: result.totalFound
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error finding business matches:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/advanced-messaging/business-insights
 * Generate business insights and analytics
 */
router.get('/business-insights', auth, async (req, res) => {
  try {
    const { timeframe } = req.query;
    const userId = req.user.id;

    const result = await businessAutomationService.generateBusinessInsights(userId, timeframe);

    if (result.success) {
      res.json({
        success: true,
        insights: result.insights
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error generating business insights:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/audit-log
 * Create audit log entry
 */
router.post('/audit-log', auth, async (req, res) => {
  try {
    const { action, resourceId, details } = req.body;
    const userId = req.user.id;

    const result = await advancedSecurityService.createAuditLog(action, userId, resourceId, details);

    if (result.success) {
      res.json({
        success: true,
        auditLogId: result.auditLogId
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/advanced-messaging/check-permissions
 * Check role-based access permissions
 */
router.post('/check-permissions', auth, async (req, res) => {
  try {
    const { action, resourceId } = req.body;
    const userId = req.user.id;

    const result = await advancedSecurityService.enforceRoleBasedAccess(userId, action, resourceId);

    if (result.success) {
      res.json({
        success: true,
        permissions: result.permissions
      });
    } else {
      res.status(403).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
