const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const emailService = require('../services/emailService');
const reminderScheduler = require('../services/reminderScheduler');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test email configuration (admin only)
router.post('/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, type = 'test' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Create a test booking object
    const testBooking = {
      id: 'TEST-' + Date.now(),
      customerName: 'Test Customer',
      customerEmail: email,
      customerPhone: '+1234567890',
      bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      bookingTime: '10:00 AM',
      duration: 60,
      totalAmount: 99.99,
      specialRequests: 'This is a test booking for email verification',
      service: {
        serviceName: 'Test Service',
        description: 'This is a test service for email verification'
      },
      provider: {
        firstName: 'Test',
        lastName: 'Provider',
        email: 'provider@test.com'
      }
    };

    let result;
    switch (type) {
      case 'confirmation':
        result = await emailService.sendBookingConfirmation(testBooking);
        break;
      case 'reminder':
        result = await emailService.sendBookingReminder(testBooking, '24h');
        break;
      case 'status':
        result = await emailService.sendBookingStatusUpdate(testBooking, 'PENDING');
        break;
      case 'provider':
        result = await emailService.sendProviderNotification(testBooking);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use: confirmation, reminder, status, or provider'
        });
    }

    res.json({
      success: true,
      message: `Test ${type} email sent successfully`,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Get reminder scheduler status (admin only)
router.get('/scheduler/status', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const status = reminderScheduler.getStatus();
    res.json({
      success: true,
      scheduler: status
    });
  } catch (error) {
    console.error('❌ Scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

// Start reminder scheduler (admin only)
router.post('/scheduler/start', authMiddleware, adminMiddleware, (req, res) => {
  try {
    reminderScheduler.start();
    res.json({
      success: true,
      message: 'Reminder scheduler started successfully'
    });
  } catch (error) {
    console.error('❌ Scheduler start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
});

// Stop reminder scheduler (admin only)
router.post('/scheduler/stop', authMiddleware, adminMiddleware, (req, res) => {
  try {
    reminderScheduler.stop();
    res.json({
      success: true,
      message: 'Reminder scheduler stopped successfully'
    });
  } catch (error) {
    console.error('❌ Scheduler stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
});

// Test reminders manually (admin only)
router.post('/scheduler/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await reminderScheduler.testReminders();
    res.json({
      success: true,
      message: 'Reminder test completed successfully'
    });
  } catch (error) {
    console.error('❌ Reminder test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test reminders',
      error: error.message
    });
  }
});

// Get upcoming reminders (admin only)
router.get('/scheduler/upcoming', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const upcomingReminders = await reminderScheduler.getUpcomingReminders();
    res.json({
      success: true,
      upcomingReminders
    });
  } catch (error) {
    console.error('❌ Upcoming reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming reminders',
      error: error.message
    });
  }
});

// Resend booking confirmation email
router.post('/resend/confirmation/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Get the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        service: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization - only customer or provider can resend
    if (booking.customerId !== userId && booking.service.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to resend confirmation for this booking'
      });
    }

    // Format booking data for email service
    const emailBookingData = {
      id: booking.id,
      customerName: (booking.customer && booking.customer.firstName)
        ? `${booking.customer.firstName} ${booking.customer.lastName}`
        : booking.customerName,
      customerEmail: (booking.customer && booking.customer.email)
        ? booking.customer.email
        : booking.customerEmail,
      customerPhone: (booking.customer && booking.customer.phone)
        ? booking.customer.phone
        : booking.customerPhone,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      duration: booking.duration,
      totalAmount: booking.totalAmount,
      specialRequests: booking.specialRequests,
      service: booking.service,
      provider: booking.provider
    };

    // Send confirmation email
    const result = await emailService.sendBookingConfirmation(emailBookingData);

    res.json({
      success: true,
      message: 'Booking confirmation email resent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('❌ Resend confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend confirmation email',
      error: error.message
    });
  }
});

// Get email statistics (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get booking statistics for email context
    const stats = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: last7Days
        }
      }
    });

    // Get reminder statistics
    const reminderStats = await prisma.booking.aggregate({
      _count: {
        id: true
      },
      where: {
        OR: [
          { reminderSent24h: true },
          { reminderSent1h: true }
        ],
        createdAt: {
          gte: last7Days
        }
      }
    });

    // Get upcoming bookings that need reminders
    const upcomingBookings = await prisma.booking.count({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        bookingDate: {
          gte: now,
          lte: new Date(now.getTime() + 48 * 60 * 60 * 1000) // Next 48 hours
        }
      }
    });

    res.json({
      success: true,
      stats: {
        bookingsByStatus: stats,
        remindersSent: reminderStats._count.id,
        upcomingBookings,
        schedulerStatus: reminderScheduler.getStatus(),
        period: {
          last24Hours: last24Hours.toISOString(),
          last7Days: last7Days.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Email stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics',
      error: error.message
    });
  }
});

module.exports = router;
