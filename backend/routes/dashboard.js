const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics for authenticated user
// @access  Private
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Initialize metrics object with safe defaults
    const metrics = {
      profileViews: Math.floor(Math.random() * 100) + 50, // Mock data for now
      inquiriesReceived: Math.floor(Math.random() * 20) + 5,
      unreadMessages: Math.floor(Math.random() * 10) + 2,
      subscription: {
        plan: 'Basic Plan',
        renewsIn: 22,
        status: 'active'
      }
    };

    // Try to get real data, but don't fail if tables don't exist
    try {
      const businessListingsCount = await prisma.businessListing.count({
        where: { userId: userId }
      }).catch(() => 0);

      const servicesCount = await prisma.service.count({
        where: { userId: userId }
      }).catch(() => 0);

      if (businessListingsCount > 0 || servicesCount > 0) {
        metrics.profileViews = (businessListingsCount * 15) + (servicesCount * 25);
      }
    } catch (error) {
      console.log('Using mock data for profile views');
    }

    // Get user subscription info (using available User fields)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (user) {
      metrics.subscription.plan = 'Basic Plan'; // Mock data since subscription fields don't exist
      metrics.subscription.status = 'active';
      
      // Mock renewal date (30 days from now)
      const mockExpiryDate = new Date();
      mockExpiryDate.setDate(mockExpiryDate.getDate() + 30);
      const today = new Date();
      const diffTime = mockExpiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      metrics.subscription.renewsIn = Math.max(0, diffDays);
    }

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/notifications
// @desc    Get notifications for authenticated user
// @access  Private
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // If no notifications exist, create some sample ones
    if (notifications.length === 0) {
      const sampleNotifications = [
        {
          userId: userId,
          type: 'info',
          message: 'Complete your profile to get more visibility.',
          isRead: false
        },
        {
          userId: userId,
          type: 'success',
          message: 'Your profile has been successfully updated.',
          isRead: false
        }
      ];

      // Create sample notifications
      await prisma.notification.createMany({
        data: sampleNotifications
      });

      // Fetch the newly created notifications
      const newNotifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return res.json({
        success: true,
        data: newNotifications
      });
    }

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @route   PUT /api/dashboard/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        isRead: true
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity for authenticated user
// @access  Private
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent activities (bookings, messages, leads)
    const recentBookings = await prisma.booking.findMany({
      where: { 
        OR: [
          { userId: userId },
          { service: { userId: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        service: true,
        user: true
      }
    });

    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: true,
        recipient: true
      }
    });

    const recentLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { providerId: userId },
          { recipientId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Format activities
    const activities = [];

    recentBookings.forEach(booking => {
      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        text: `New booking for ${booking.service.serviceName}`,
        timestamp: booking.createdAt,
        link: `/dashboard/bookings`
      });
    });

    recentMessages.forEach(message => {
      const isReceived = message.recipientId === userId;
      activities.push({
        id: `message-${message.id}`,
        type: 'message',
        text: isReceived ? 
          `New message from ${message.sender.firstName || message.sender.email}` :
          `Message sent to ${message.recipient.firstName || message.recipient.email}`,
        timestamp: message.createdAt,
        link: `/dashboard/messages`
      });
    });

    recentLeads.forEach(lead => {
      activities.push({
        id: `lead-${lead.id}`,
        type: 'lead',
        text: `New inquiry: ${lead.subject}`,
        timestamp: lead.createdAt,
        link: `/dashboard/leads`
      });
    });

    // Sort by timestamp and take top 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topActivities = activities.slice(0, 10);

    res.json({
      success: true,
      data: topActivities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

module.exports = router;
