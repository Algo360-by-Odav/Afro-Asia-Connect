const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test SMS functionality
router.post('/test', authenticateToken, requireRole(['ADMIN', 'SERVICE_PROVIDER']), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const result = await smsService.testSMS(phoneNumber);
    
    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test SMS'
    });
  }
});

// Send manual SMS (admin only)
router.post('/send', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { phoneNumber, message, type = 'manual' } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await smsService.sendSMS(phoneNumber, message, {
      type,
      adminId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending manual SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

// Resend booking confirmation SMS
router.post('/resend/booking-confirmation/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get booking with proper authorization
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        service: {
          select: { providerId: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isAuthorized = userRole === 'ADMIN' || 
                        booking.customerId === userId || 
                        booking.service.providerId === userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to resend SMS for this booking'
      });
    }

    const result = await smsService.sendBookingConfirmationSMS(booking);
    
    res.json({
      success: true,
      message: 'Booking confirmation SMS resent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error resending booking confirmation SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend booking confirmation SMS'
    });
  }
});

// Send booking reminder SMS manually
router.post('/send/booking-reminder/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reminderType = '24h' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get booking with proper authorization
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        service: {
          select: { providerId: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isAuthorized = userRole === 'ADMIN' || 
                        booking.service.providerId === userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send reminder for this booking'
      });
    }

    const result = await smsService.sendBookingReminderSMS(booking, reminderType);
    
    res.json({
      success: true,
      message: 'Booking reminder SMS sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending booking reminder SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send booking reminder SMS'
    });
  }
});

// Update user SMS preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      smsEnabled = true,
      bookingConfirmations = true,
      bookingReminders = true,
      statusUpdates = true,
      paymentConfirmations = true,
      marketingMessages = false
    } = req.body;

    // Update user SMS preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        smsPreferences: {
          smsEnabled,
          bookingConfirmations,
          bookingReminders,
          statusUpdates,
          paymentConfirmations,
          marketingMessages,
          updatedAt: new Date()
        }
      },
      select: {
        id: true,
        smsPreferences: true
      }
    });

    res.json({
      success: true,
      message: 'SMS preferences updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating SMS preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SMS preferences'
    });
  }
});

// Get user SMS preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        smsPreferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Default preferences if not set
    const defaultPreferences = {
      smsEnabled: true,
      bookingConfirmations: true,
      bookingReminders: true,
      statusUpdates: true,
      paymentConfirmations: true,
      marketingMessages: false
    };

    res.json({
      success: true,
      data: {
        userId: user.id,
        phoneNumber: user.phone,
        preferences: user.smsPreferences || defaultPreferences
      }
    });

  } catch (error) {
    console.error('Error getting SMS preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS preferences'
    });
  }
});

// Get SMS delivery status
router.get('/status/:sid', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { sid } = req.params;
    
    const result = await smsService.getSMSStatus(sid);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting SMS status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS status'
    });
  }
});

// Send bulk SMS (admin only)
router.post('/bulk', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { message, userIds, phoneNumbers, type = 'bulk_announcement' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    let recipients = [];

    // If userIds provided, get users from database
    if (userIds && userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          phone: { not: null }
        },
        select: {
          id: true,
          phone: true,
          firstName: true,
          smsPreferences: true
        }
      });

      recipients = users.filter(user => {
        const prefs = user.smsPreferences || {};
        return prefs.smsEnabled !== false && prefs.marketingMessages !== false;
      });
    }

    // If phone numbers provided directly
    if (phoneNumbers && phoneNumbers.length > 0) {
      const phoneRecipients = phoneNumbers.map((phone, index) => ({
        id: `phone_${index}`,
        phone: phone
      }));
      recipients = [...recipients, ...phoneRecipients];
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid recipients found'
      });
    }

    const results = await smsService.sendBulkSMS(recipients, message, {
      type,
      adminId: req.user.id
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk SMS sent to ${successCount} recipients`,
      data: {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results
      }
    });

  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk SMS'
    });
  }
});

// SMS analytics (admin only)
router.get('/analytics', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // This would typically query an SMS logs table
    // For now, we'll return mock analytics data
    const mockAnalytics = {
      dateRange: { startDate, endDate, days: parseInt(days) },
      totalSMSSent: 1250,
      deliveryRate: 98.5,
      messageTypes: {
        booking_confirmation: 450,
        booking_reminder_24h: 320,
        booking_reminder_1h: 280,
        status_update: 150,
        payment_confirmation: 50
      },
      dailyVolume: {
        // Mock daily data
      },
      costs: {
        totalCost: 62.50,
        averageCostPerSMS: 0.05
      }
    };

    res.json({
      success: true,
      data: mockAnalytics
    });

  } catch (error) {
    console.error('Error getting SMS analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS analytics'
    });
  }
});

// Validate phone number
router.post('/validate-phone', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const formatted = smsService.formatPhoneNumber(phoneNumber);
    const isValid = smsService.isValidPhoneNumber(phoneNumber);

    res.json({
      success: true,
      data: {
        original: phoneNumber,
        formatted,
        isValid
      }
    });

  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate phone number'
    });
  }
});

// Send two-factor authentication SMS
router.post('/send-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: 'User ID and code are required'
      });
    }

    const result = await smsService.sendTwoFactorSMS(userId, code);
    
    res.json({
      success: true,
      message: '2FA SMS sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending 2FA SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send 2FA SMS'
    });
  }
});

// Send SMS verification code
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const result = await smsService.sendVerificationCode(userId, phone);
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        verificationId: result.verificationId,
        expiresAt: result.expiresAt
      }
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification code'
    });
  }
});

// Verify SMS code
router.post('/verify-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and verification code are required'
      });
    }

    const result = await smsService.verifyCode(userId, phone, code);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code'
    });
  }
});

// Verify phone (alias for verify-code to match frontend expectations)
router.post('/verify-phone', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and verification code are required'
      });
    }

    const result = await smsService.verifyCode(userId, phone, code);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify phone number'
    });
  }
});

// Check if phone is verified
router.get('/verify-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const isVerified = await smsService.isPhoneVerified(userId, phone);
    
    res.json({
      success: true,
      isVerified: isVerified
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check verification status'
    });
  }
});

module.exports = router;
