const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Admin stats endpoint
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await prisma.user.count();
    const buyers = await prisma.user.count({ where: { role: 'BUYER' } });
    const sellers = await prisma.user.count({ where: { role: 'SELLER' } });
    const serviceProviders = await prisma.user.count({ where: { role: 'SERVICE_PROVIDER' } });

    // Get listing counts
    const activeListings = await prisma.service.count({ where: { isActive: true } });
    
    // Get booking counts
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    
    // Get new signups in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newSignups = await prisma.user.count({
      where: { createdAt: { gte: yesterday } }
    });

    // Get pending reviews
    const pendingReviews = await prisma.serviceReview.count({
      where: { status: 'PENDING' }
    });

    // Calculate average response time (mock for now)
    const avgResponseTime = '3.2 hours';

    // Get daily visits (mock for now - would need analytics service)
    const dailyVisits = Math.floor(Math.random() * 1000) + 5000;

    res.json({
      totalUsers,
      activeListings,
      dailyVisits,
      newSignups,
      pendingReviews,
      avgResponseTime,
      buyers,
      sellers,
      serviceProviders,
      totalBookings,
      pendingBookings
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get all users with pagination
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (role && role !== 'all') {
      where.role = role.toUpperCase();
    }
    
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookingsAsCustomer: true,
            servicesProvided: true,
            sentMessages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// User management actions
router.post('/users/:userId/activate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });
    
    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

router.post('/users/:userId/deactivate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

router.post('/users/:userId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
    
    res.json({ message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Get verification requests
router.get('/verification-requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ error: 'Failed to fetch verification requests' });
  }
});

// Handle verification requests
router.post('/verification-requests/:requestId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    // Update verification request
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: { 
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      }
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: request.userId },
      data: { isVerified: true }
    });

    res.json({ message: 'Verification request approved successfully' });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ error: 'Failed to approve verification request' });
  }
});

router.post('/verification-requests/:requestId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: { 
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        rejectionReason: reason
      }
    });

    res.json({ message: 'Verification request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ error: 'Failed to reject verification request' });
  }
});

// Get platform analytics
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // User growth analytics
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Revenue analytics
    const revenueData = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    // Booking analytics
    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Service category analytics
    const categoryStats = await prisma.service.groupBy({
      by: ['category'],
      where: {
        isActive: true
      },
      _count: true
    });

    res.json({
      userGrowth,
      revenueData,
      bookingStats,
      categoryStats,
      period
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get system health metrics
router.get('/system-health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Database connection check
    const dbHealth = await prisma.$queryRaw`SELECT 1`;
    
    // Get database size and performance metrics
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    const bookingCount = await prisma.booking.count();
    const messageCount = await prisma.message.count();

    // System metrics (mock data - would integrate with actual monitoring)
    const systemMetrics = {
      database: {
        status: 'healthy',
        responseTime: '12ms',
        connections: 15,
        maxConnections: 100
      },
      server: {
        uptime: '15 days, 3 hours',
        memoryUsage: '2.1GB / 8GB',
        cpuUsage: '23%',
        diskSpace: '45GB / 100GB'
      },
      api: {
        requestsPerMinute: 145,
        averageResponseTime: '89ms',
        errorRate: '0.2%'
      },
      counts: {
        users: userCount,
        services: serviceCount,
        bookings: bookingCount,
        messages: messageCount
      }
    };

    res.json(systemMetrics);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health metrics' });
  }
});

// Export platform data
router.get('/export/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        });
        filename = `users-export-${Date.now()}`;
        break;
      
      case 'services':
        data = await prisma.service.findMany({
          include: {
            provider: {
              select: { name: true, email: true }
            }
          }
        });
        filename = `services-export-${Date.now()}`;
        break;
      
      case 'bookings':
        data = await prisma.booking.findMany({
          include: {
            customer: {
              select: { name: true, email: true }
            },
            service: {
              select: { title: true }
            }
          }
        });
        filename = `bookings-export-${Date.now()}`;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;
