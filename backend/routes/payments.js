const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const paymentService = require('../services/paymentService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Payment system health check
router.get('/health', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      message: 'Payment system is running'
    });
  } catch (error) {
    console.error('❌ Payment health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment system health check failed'
    });
  }
});

// Create payment intent for a booking
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(parseInt(bookingId), userId);

    res.json({
      success: true,
      paymentIntent
    });

  } catch (error) {
    console.error('❌ Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
});

// Confirm payment after successful Stripe payment
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and booking ID are required'
      });
    }

    const result = await paymentService.confirmPayment(paymentIntentId, parseInt(bookingId));

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment'
    });
  }
});

// Handle payment failure
router.post('/failure', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, bookingId, reason } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and booking ID are required'
      });
    }

    await paymentService.handlePaymentFailure(paymentIntentId, parseInt(bookingId), reason);

    res.json({
      success: true,
      message: 'Payment failure recorded'
    });

  } catch (error) {
    console.error('❌ Handle payment failure error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to handle payment failure'
    });
  }
});

// Process refund
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const result = await paymentService.processRefund(
      parseInt(bookingId),
      amount ? parseFloat(amount) : null,
      reason || 'Refund requested',
      userId
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: result
    });

  } catch (error) {
    console.error('❌ Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
});

// Get payment history for current user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'customer' } = req.query;

    const payments = await paymentService.getPaymentHistory(userId, type);

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('❌ Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history'
    });
  }
});

// Get payment analytics for providers
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await paymentService.getPaymentAnalytics(userId, start, end);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment analytics'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Extract booking ID from metadata
        const bookingId = paymentIntent.metadata.bookingId;
        if (bookingId) {
          await paymentService.confirmPayment(paymentIntent.id, parseInt(bookingId));
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', failedPayment.id);
        
        const failedBookingId = failedPayment.metadata.bookingId;
        if (failedBookingId) {
          await paymentService.handlePaymentFailure(
            failedPayment.id,
            parseInt(failedBookingId),
            failedPayment.last_payment_error?.message || 'Payment failed'
          );
        }
        break;

      case 'refund.created':
        const refund = event.data.object;
        console.log('💰 Refund created:', refund.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Get Stripe publishable key (for frontend)
router.get('/config', authMiddleware, (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Admin: Get all payments with pagination
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              service: {
                select: {
                  serviceName: true,
                  provider: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          refunds: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Admin get payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payments'
    });
  }
});

// Admin: Get payment statistics
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalPayments,
      completedPayments,
      failedPayments,
      totalRefunds,
      revenueStats
    ] = await Promise.all([
      prisma.payment.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.refund.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        _sum: {
          amount: true
        },
        _avg: {
          amount: true
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        completedPayments,
        failedPayments,
        totalRefunds,
        totalRevenue: revenueStats._sum.amount || 0,
        averagePayment: revenueStats._avg.amount || 0,
        successRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });

  } catch (error) {
    console.error('❌ Admin payment stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment statistics'
    });
  }
});

module.exports = router;
