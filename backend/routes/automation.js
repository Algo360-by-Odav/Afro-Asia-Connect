const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const automationService = require('../services/automationService');
const securityAuditService = require('../services/securityAuditService');

// Security audit middleware for automation routes
const auditAutomationEvent = (action) => {
  return async (req, res, next) => {
    try {
      await securityAuditService.logAuditEvent({
        userId: req.user?.id,
        eventType: 'automation_access',
        resourceType: 'automation',
        resourceId: req.params.id || null,
        action,
        riskLevel: 'low',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query
        }
      });
      next();
    } catch (error) {
      console.error('Automation audit logging failed:', error);
      next(); // Continue even if audit fails
    }
  };
};

// Get automation workflows for user
router.get('/workflows', authMiddleware, auditAutomationEvent('GET_WORKFLOWS'), async (req, res) => {
  try {
    const workflows = await automationService.getUserWorkflows(req.user.id);
    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automation workflows',
      error: error.message
    });
  }
});

// Create new automation workflow
router.post('/workflows', authMiddleware, auditAutomationEvent('CREATE_WORKFLOW'), async (req, res) => {
  try {
    const { name, description, triggers, actions, isActive } = req.body;
    
    if (!name || !triggers || !actions) {
      return res.status(400).json({
        success: false,
        message: 'Name, triggers, and actions are required'
      });
    }

    const workflow = await automationService.createWorkflow({
      userId: req.user.id,
      name,
      description,
      triggers,
      actions,
      isActive: isActive !== false // Default to true
    });

    res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create automation workflow',
      error: error.message
    });
  }
});

// Update automation workflow
router.put('/workflows/:id', authMiddleware, auditAutomationEvent('UPDATE_WORKFLOW'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const workflow = await automationService.updateWorkflow(id, req.user.id, updates);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or access denied'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation workflow',
      error: error.message
    });
  }
});

// Delete automation workflow
router.delete('/workflows/:id', authMiddleware, auditAutomationEvent('DELETE_WORKFLOW'), async (req, res) => {
  try {
    const { id } = req.params;

    const success = await automationService.deleteWorkflow(id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete automation workflow',
      error: error.message
    });
  }
});

// Get automation analytics
router.get('/analytics', authMiddleware, auditAutomationEvent('GET_ANALYTICS'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await automationService.getAutomationAnalytics(req.user.id, parseInt(days));
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get automation analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automation analytics',
      error: error.message
    });
  }
});

// Get automation logs
router.get('/logs', authMiddleware, auditAutomationEvent('GET_LOGS'), async (req, res) => {
  try {
    const { page = 1, limit = 50, workflowId } = req.query;
    const logs = await automationService.getAutomationLogs(
      req.user.id, 
      parseInt(page), 
      parseInt(limit),
      workflowId
    );
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get automation logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automation logs',
      error: error.message
    });
  }
});

// Test automation workflow
router.post('/workflows/:id/test', authMiddleware, auditAutomationEvent('TEST_WORKFLOW'), async (req, res) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;

    const result = await automationService.testWorkflow(id, req.user.id, testData);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or access denied'
      });
    }

    res.json({
      success: true,
      testResult: result
    });
  } catch (error) {
    console.error('Test workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test automation workflow',
      error: error.message
    });
  }
});

// Get available trigger types
router.get('/trigger-types', authMiddleware, auditAutomationEvent('GET_TRIGGER_TYPES'), async (req, res) => {
  try {
    const triggerTypes = await automationService.getAvailableTriggerTypes();
    
    res.json({
      success: true,
      triggerTypes
    });
  } catch (error) {
    console.error('Get trigger types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trigger types',
      error: error.message
    });
  }
});

// Get available action types
router.get('/action-types', authMiddleware, auditAutomationEvent('GET_ACTION_TYPES'), async (req, res) => {
  try {
    const actionTypes = await automationService.getAvailableActionTypes();
    
    res.json({
      success: true,
      actionTypes
    });
  } catch (error) {
    console.error('Get action types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve action types',
      error: error.message
    });
  }
});

// Get auto-response templates
router.get('/templates', authMiddleware, auditAutomationEvent('GET_TEMPLATES'), async (req, res) => {
  try {
    const templates = await automationService.getAutoResponseTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve auto-response templates',
      error: error.message
    });
  }
});

module.exports = router;
