const express = require('express');
const router = express.Router();
const adminPanelService = require('../services/adminPanelService');
const auth = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminAuth'); // Middleware to check admin privileges
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Admin Panel Overview Routes

/**
 * GET /api/admin/overview
 * Get comprehensive platform overview for admin dashboard
 */
router.get('/overview', auth, adminAuth, async (req, res) => {
  try {
    const result = await adminPanelService.getPlatformOverview();

    if (result.success) {
      res.json({
        success: true,
        overview: result.overview,
        generatedAt: result.generatedAt
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting platform overview:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users
 * Get user management data with filtering and pagination
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, role, search, dateStart, dateEnd } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (role) filters.role = role;
    if (search) filters.searchTerm = search;
    if (dateStart && dateEnd) {
      filters.dateRange = { start: dateStart, end: dateEnd };
    }

    const result = await adminPanelService.getUserManagement(
      parseInt(page), 
      parseInt(limit), 
      filters
    );

    if (result.success) {
      res.json({
        success: true,
        users: result.users,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting user management data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users/:userId/action
 * Perform user management actions (suspend, activate, delete, verify)
 */
router.post('/users/:userId/action', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    const result = await adminPanelService.performUserAction(userId, action, reason, adminId);

    if (result.success) {
      res.json({
        success: true,
        user: result.user,
        action: result.action
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error performing user action:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/moderation
 * Get content moderation queue
 */
router.get('/moderation', auth, adminAuth, async (req, res) => {
  try {
    const { contentType = 'all', status = 'pending' } = req.query;

    const result = await adminPanelService.getContentModeration(contentType, status);

    if (result.success) {
      res.json({
        success: true,
        items: result.items,
        summary: result.summary
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting content moderation data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/moderation/:itemId/action
 * Perform moderation actions (approve, reject, dismiss)
 */
router.post('/moderation/:itemId/action', auth, adminAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType, action, reason } = req.body;
    const adminId = req.user.id;

    const result = await adminPanelService.performModerationAction(
      itemId, 
      itemType, 
      action, 
      reason, 
      adminId
    );

    if (result.success) {
      res.json({
        success: true,
        result: result.result,
        action: result.action
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error performing moderation action:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/configuration
 * Get system configuration settings
 */
router.get('/configuration', auth, adminAuth, async (req, res) => {
  try {
    const result = await adminPanelService.getSystemConfiguration();

    if (result.success) {
      res.json({
        success: true,
        configuration: result.configuration,
        categories: result.categories
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting system configuration:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/configuration
 * Update system configuration settings
 */
router.put('/configuration', auth, adminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    const adminId = req.user.id;

    // Add adminId to each update for audit logging
    const updatesWithAdmin = updates.map(update => ({ ...update, adminId }));

    const result = await adminPanelService.updateSystemConfiguration(updatesWithAdmin);

    if (result.success) {
      res.json({
        success: true,
        updatedConfigurations: result.updatedConfigurations
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error updating system configuration:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/health
 * Perform system health check
 */
router.get('/health', auth, adminAuth, async (req, res) => {
  try {
    const result = await adminPanelService.performHealthCheck();

    if (result.success) {
      res.json({
        success: true,
        overallStatus: result.overallStatus,
        checks: result.checks,
        timestamp: result.timestamp
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/analytics/advanced
 * Get advanced analytics for admin dashboard
 */
router.get('/analytics/advanced', auth, adminAuth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const advancedAnalyticsService = require('../services/advancedAnalyticsService');

    const result = await advancedAnalyticsService.generateDashboardMetrics(req.user.id, timeframe);

    if (result.success) {
      res.json({
        success: true,
        metrics: result.metrics,
        generatedAt: result.generatedAt
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting advanced analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/analytics/realtime
 * Get real-time metrics for admin dashboard
 */
router.get('/analytics/realtime', auth, adminAuth, async (req, res) => {
  try {
    const advancedAnalyticsService = require('../services/advancedAnalyticsService');
    const result = await advancedAnalyticsService.getRealTimeMetrics(req.user.id);

    if (result.success) {
      res.json({
        success: true,
        realTimeData: result.realTimeData
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/payments/analytics
 * Get payment analytics for admin dashboard
 */
router.get('/payments/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const advancedPaymentService = require('../services/advancedPaymentService');

    const result = await advancedPaymentService.generatePaymentAnalytics(req.user.id, timeframe);

    if (result.success) {
      res.json({
        success: true,
        analytics: result.analytics,
        period: result.period
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/bulk-actions
 * Perform bulk actions on multiple items
 */
router.post('/bulk-actions', auth, adminAuth, async (req, res) => {
  try {
    const { action, itemType, itemIds, reason } = req.body;
    const adminId = req.user.id;
    const results = [];

    for (const itemId of itemIds) {
      let result;
      
      if (itemType === 'users') {
        result = await adminPanelService.performUserAction(itemId, action, reason, adminId);
      } else {
        result = await adminPanelService.performModerationAction(itemId, itemType, action, reason, adminId);
      }
      
      results.push({ itemId, success: result.success, error: result.error });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Error performing bulk actions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/reports/export
 * Export various admin reports
 */
router.get('/reports/export', auth, adminAuth, async (req, res) => {
  try {
    const { reportType, format = 'json', startDate, endDate } = req.query;
    
    let reportData;
    
    switch (reportType) {
      case 'users':
        const userResult = await adminPanelService.getUserManagement(1, 10000, {
          dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
        });
        reportData = userResult.users;
        break;
        
      case 'moderation':
        const moderationResult = await adminPanelService.getContentModeration('all', 'all');
        reportData = moderationResult.items;
        break;
        
      case 'analytics':
        const advancedAnalyticsService = require('../services/advancedAnalyticsService');
        const analyticsResult = await advancedAnalyticsService.generateDashboardMetrics(req.user.id, '90d');
        reportData = analyticsResult.metrics;
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        reportType,
        data: reportData,
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * GET /api/admin/users
 * Get all users for admin management
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});

module.exports = router;
