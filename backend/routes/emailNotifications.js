const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const enhancedEmailService = require('../services/enhancedEmailService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Send welcome email (internal use)
router.post('/welcome', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await enhancedEmailService.sendWelcomeEmail(user);
    res.json(result);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// Send password reset email
router.post('/password-reset', async (req, res) => {
  try {
    const { email, resetToken } = req.body;
    
    if (!email || !resetToken) {
      return res.status(400).json({ error: 'Email and reset token are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    const result = await enhancedEmailService.sendPasswordResetEmail(user, resetToken);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

// Send email verification
router.post('/verify-email', authMiddleware, async (req, res) => {
  try {
    const { verificationToken } = req.body;
    const user = req.user;

    if (!verificationToken) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await enhancedEmailService.sendEmailVerification(user, verificationToken);
    res.json(result);
  } catch (error) {
    console.error('Error sending email verification:', error);
    res.status(500).json({ error: 'Failed to send email verification' });
  }
});

// Send payment confirmation email
router.post('/payment-confirmation', authMiddleware, async (req, res) => {
  try {
    const { paymentId, bookingId } = req.body;

    if (!paymentId || !bookingId) {
      return res.status(400).json({ error: 'Payment ID and booking ID are required' });
    }

    // Fetch payment and booking details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: true
      }
    });

    if (!payment || !booking) {
      return res.status(404).json({ error: 'Payment or booking not found' });
    }

    const result = await enhancedEmailService.sendPaymentConfirmationEmail(payment, booking);
    res.json(result);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    res.status(500).json({ error: 'Failed to send payment confirmation email' });
  }
});

// Send review request email
router.post('/review-request', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only send review request for completed bookings
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only request reviews for completed bookings' });
    }

    const result = await enhancedEmailService.sendReviewRequestEmail(booking);
    res.json(result);
  } catch (error) {
    console.error('Error sending review request email:', error);
    res.status(500).json({ error: 'Failed to send review request email' });
  }
});

// Send newsletter (admin only)
router.post('/newsletter', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subject, content, recipientType = 'all', recipientIds = [] } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    let recipients = [];

    if (recipientType === 'all') {
      recipients = await prisma.user.findMany({
        where: { emailNotifications: true },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    } else if (recipientType === 'specific' && recipientIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { 
          id: { in: recipientIds },
          emailNotifications: true 
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    } else if (recipientType === 'providers') {
      recipients = await prisma.user.findMany({
        where: { 
          role: 'PROVIDER',
          emailNotifications: true 
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    } else if (recipientType === 'customers') {
      recipients = await prisma.user.findMany({
        where: { 
          role: 'CUSTOMER',
          emailNotifications: true 
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    }

    const newsletter = { subject, content };
    const result = await enhancedEmailService.sendBulkEmail(recipients, subject, 'newsletter', { newsletter });

    // Log newsletter send
    await prisma.emailLog.create({
      data: {
        type: 'NEWSLETTER',
        subject,
        recipientCount: recipients.length,
        successCount: result.successful,
        failureCount: result.failed,
        sentBy: req.user.id
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// Send promotional email (admin only)
router.post('/promotional', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subject, content, promoCode, discount, recipientType = 'all' } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    let recipients = [];

    if (recipientType === 'all') {
      recipients = await prisma.user.findMany({
        where: { emailNotifications: true },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    } else if (recipientType === 'inactive') {
      // Users who haven't logged in for 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      recipients = await prisma.user.findMany({
        where: { 
          emailNotifications: true,
          lastLogin: { lt: thirtyDaysAgo }
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
    }

    const promotion = { subject, content, promoCode, discount };
    const result = await enhancedEmailService.sendBulkEmail(recipients, subject, 'promotional', { promotion });

    // Log promotional email send
    await prisma.emailLog.create({
      data: {
        type: 'PROMOTIONAL',
        subject,
        recipientCount: recipients.length,
        successCount: result.successful,
        failureCount: result.failed,
        sentBy: req.user.id
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending promotional email:', error);
    res.status(500).json({ error: 'Failed to send promotional email' });
  }
});

// Send service approval notification (admin only)
router.post('/service-approval', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { serviceId, approved, feedback } = req.body;

    if (!serviceId || typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Service ID and approval status are required' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update service status
    await prisma.service.update({
      where: { id: serviceId },
      data: { 
        status: approved ? 'ACTIVE' : 'PENDING',
        adminFeedback: feedback
      }
    });

    const result = await enhancedEmailService.sendServiceApprovalEmail(service.provider, service, approved);
    res.json(result);
  } catch (error) {
    console.error('Error sending service approval email:', error);
    res.status(500).json({ error: 'Failed to send service approval email' });
  }
});

// Get email statistics (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const stats = await prisma.emailLog.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: {
        recipientCount: true,
        successCount: true,
        failureCount: true
      },
      _count: {
        id: true
      }
    });

    const totalStats = await prisma.emailLog.aggregate({
      where: whereClause,
      _sum: {
        recipientCount: true,
        successCount: true,
        failureCount: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      byType: stats,
      total: totalStats
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email statistics' });
  }
});

// Get email logs (admin only)
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: whereClause,
        include: {
          sentByUser: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.emailLog.count({ where: whereClause })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// Test email configuration (admin only)
router.post('/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { testEmail } = req.body;
    const email = testEmail || req.user.email;

    const result = await enhancedEmailService.sendEmail({
      to: email,
      subject: 'AfroAsiaConnect Email Test',
      template: 'default',
      data: { user: req.user }
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

module.exports = router;
