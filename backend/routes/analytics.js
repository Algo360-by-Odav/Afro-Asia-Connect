const express = require('express');
const businessAnalyticsService = require('../services/businessAnalyticsService');
const analyticsService = require('../services/analyticsService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Provider analytics dashboard
router.get('/provider/dashboard', authenticateToken, requireRole(['SERVICE_PROVIDER']), async (req, res) => {
  try {
    console.log('📊 Analytics dashboard request from user:', req.user.id, 'role:', req.user.role);
    const providerId = req.user.id;
    const { days = 30 } = req.query;
    console.log('📊 Fetching analytics for provider:', providerId, 'days:', days);
    
    const dashboard = await businessAnalyticsService.getProviderDashboard(providerId, parseInt(days));
    console.log('📊 Dashboard data fetched successfully:', dashboard ? 'Yes' : 'No');
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching provider dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch provider dashboard analytics' 
    });
  }
});

// Provider booking statistics
router.get('/provider/bookings', authenticateToken, requireRole(['SERVICE_PROVIDER']), async (req, res) => {
  try {
    const providerId = req.user.id;
    const { days = 30 } = req.query;
    
    // Get provider's services
    const services = await prisma.service.findMany({
      where: { userId: providerId },
      select: { id: true }
    });
    
    const serviceIds = services.map(s => s.id);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const bookingStats = await businessAnalyticsService.getBookingStatistics(serviceIds, startDate, endDate);
    
    res.json({
      success: true,
      data: bookingStats
    });
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch booking statistics' 
    });
  }
});

// Provider revenue analytics
router.get('/provider/revenue', authenticateToken, requireRole(['SERVICE_PROVIDER']), async (req, res) => {
  try {
    const providerId = req.user.id;
    const { days = 30 } = req.query;
    
    // Get provider's services
    const services = await prisma.service.findMany({
      where: { userId: providerId },
      select: { id: true }
    });
    
    const serviceIds = services.map(s => s.id);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const revenueStats = await businessAnalyticsService.getRevenueAnalytics(serviceIds, startDate, endDate);
    
    res.json({
      success: true,
      data: revenueStats
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch revenue analytics' 
    });
  }
});

// Provider review analytics
router.get('/provider/reviews', authenticateToken, requireRole(['SERVICE_PROVIDER']), async (req, res) => {
  try {
    const providerId = req.user.id;
    const { days = 30 } = req.query;
    
    // Get provider's services
    const services = await prisma.service.findMany({
      where: { userId: providerId },
      select: { id: true }
    });
    
    const serviceIds = services.map(s => s.id);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const reviewStats = await businessAnalyticsService.getReviewAnalytics(serviceIds, startDate, endDate);
    
    res.json({
      success: true,
      data: reviewStats
    });
  } catch (error) {
    console.error('Error fetching review analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch review analytics' 
    });
  }
});

// Platform analytics (admin only)
router.get('/platform/overview', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const platformStats = await businessAnalyticsService.getPlatformAnalytics(parseInt(days));
    
    res.json({
      success: true,
      data: platformStats
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch platform analytics' 
    });
  }
});

// Real-time analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let summary = {};
    
    if (userRole === 'SERVICE_PROVIDER') {
      // Get quick stats for providers
      const services = await prisma.service.findMany({
        where: { userId: userId },
        select: { id: true }
      });
      
      const serviceIds = services.map(s => s.id);
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [todayBookings, monthlyBookings, totalRevenue] = await Promise.all([
        prisma.booking.count({
          where: {
            serviceId: { in: serviceIds },
            createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.booking.count({
          where: {
            serviceId: { in: serviceIds },
            createdAt: { gte: thisMonth }
          }
        }),
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            booking: { serviceId: { in: serviceIds } }
          },
          _sum: { amount: true }
        })
      ]);
      
      summary = {
        todayBookings,
        monthlyBookings,
        totalRevenue: Math.round((totalRevenue._sum.amount || 0) * 100) / 100,
        serviceCount: services.length
      };
    } else if (userRole === 'ADMIN') {
      // Get platform summary for admins
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [totalUsers, monthlyBookings, monthlyRevenue, totalServices] = await Promise.all([
        prisma.user.count(),
        prisma.booking.count({
          where: { createdAt: { gte: thisMonth } }
        }),
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            paidAt: { gte: thisMonth }
          },
          _sum: { amount: true }
        }),
        prisma.service.count()
      ]);
      
      summary = {
        totalUsers,
        monthlyBookings,
        monthlyRevenue: Math.round((monthlyRevenue._sum.amount || 0) * 100) / 100,
        totalServices
      };
    }
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics summary' 
    });
  }
});

// Legacy messaging analytics routes (for backward compatibility)
// Get user analytics
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const analytics = await analyticsService.getUserAnalytics(userId, parseInt(days));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get conversation analytics
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { days = 30 } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    const analytics = await analyticsService.getConversationAnalytics(conversationId, parseInt(days));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch conversation analytics' });
  }
});

// Platform overview analytics for admin panel
router.get('/platform/overview', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    console.log('📊 Platform overview request from admin user:', req.user.id);
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Get new users in the specified period
    const newUsers = await prisma.user.count({
      where: {
        isActive: true,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get total bookings
    const totalBookings = await prisma.booking.count();

    // Get bookings in the specified period
    const recentBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get total revenue (sum of completed payments)
    const revenueData = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'COMPLETED'
      }
    });

    // Get recent revenue
    const recentRevenueData = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get total transactions
    const totalTransactions = await prisma.payment.count({
      where: { status: 'COMPLETED' }
    });

    const platformAnalytics = {
      users: {
        totalUsers,
        newUsers,
        growthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0.0'
      },
      bookings: {
        totalBookings,
        recentBookings,
        growthRate: totalBookings > 0 ? ((recentBookings / totalBookings) * 100).toFixed(1) : '0.0'
      },
      revenue: {
        totalRevenue: revenueData._sum.amount || 0,
        recentRevenue: recentRevenueData._sum.amount || 0,
        totalTransactions,
        recentTransactions: recentRevenueData._count.id || 0
      },
      period: {
        days: parseInt(days),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };

    console.log('📊 Platform analytics generated successfully:', platformAnalytics);
    
    res.json({
      success: true,
      data: platformAnalytics
    });

  } catch (error) {
    console.error('❌ Error fetching platform analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch platform analytics',
      details: error.message 
    });
  }
});

// Comprehensive dashboard analytics endpoint
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const analytics = await analyticsService.getDashboardAnalytics(userId, userRole, parseInt(days));

    res.json({
      success: true,
      data: analytics,
      period: { days: parseInt(days) }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard analytics' 
    });
  }
});

// Export analytics data (admin only)
router.get('/export', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { type = 'revenue', format = 'json', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let data = {};
    
    switch (type) {
      case 'revenue':
        data = await analyticsService.getRevenueAnalytics(startDate);
        break;
      case 'users':
        data = await analyticsService.getUserGrowthAnalytics(startDate);
        break;
      case 'bookings':
        data = await analyticsService.getBookingAnalytics(startDate);
        break;
      case 'services':
        data = await analyticsService.getServiceAnalytics(startDate);
        break;
      default:
        data = await analyticsService.getPlatformAnalytics(startDate);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        type,
        period: { days: parseInt(days) }
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to export analytics data' 
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || typeof data !== 'object') return '';
  
  const headers = Object.keys(data);
  const csvHeaders = headers.join(',');
  
  if (Array.isArray(data[headers[0]])) {
    const rows = data[headers[0]].map((_, index) => 
      headers.map(header => data[header][index] || '').join(',')
    );
    return [csvHeaders, ...rows].join('\n');
  }
  
  const values = headers.map(header => data[header] || '').join(',');
  return [csvHeaders, values].join('\n');
}

module.exports = router;
