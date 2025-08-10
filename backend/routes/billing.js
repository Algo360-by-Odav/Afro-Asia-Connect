const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// Get current subscription details
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // In production, this would query actual subscription data
    // For now, we'll simulate subscription data
    const subscriptionData = {
      plan: 'Basic Plan',
      status: 'active',
      billingCycle: 'monthly',
      price: 29.99,
      currency: 'USD',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      features: [
        'Up to 100 service listings',
        'Basic analytics',
        'Email support',
        'Standard messaging',
        'Profile customization'
      ],
      usage: {
        servicesUsed: 12,
        servicesLimit: 100,
        storageUsed: 2.4, // GB
        storageLimit: 10, // GB
        messagesUsed: 1247,
        messagesLimit: 5000
      }
    };

    res.json({ subscription: subscriptionData });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
});

// Get payment history
router.get('/payments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    
    // Simulate payment history
    const payments = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const paymentDate = new Date(currentDate);
      paymentDate.setMonth(currentDate.getMonth() - i);
      
      payments.push({
        id: `pay_${Date.now()}_${i}`,
        amount: 29.99,
        currency: 'USD',
        status: i === 0 && Math.random() > 0.8 ? 'pending' : 'completed',
        date: paymentDate,
        description: 'Basic Plan - Monthly Subscription',
        paymentMethod: 'Visa ending in 4242',
        invoiceId: `inv_${Date.now()}_${i}`,
        receiptUrl: `https://billing.afroasiaconnect.com/receipts/pay_${Date.now()}_${i}`
      });
    }

    const startIndex = (page - 1) * limit;
    const paginatedPayments = payments.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      payments: paginatedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(payments.length / limit),
        totalItems: payments.length,
        hasNext: startIndex + parseInt(limit) < payments.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get invoices
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, year } = req.query;
    
    // Simulate invoice data
    const invoices = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const invoiceDate = new Date(currentDate);
      invoiceDate.setMonth(currentDate.getMonth() - i);
      
      const invoiceStatus = i === 0 ? 'pending' : 
                           i === 1 && Math.random() > 0.7 ? 'overdue' : 'paid';
      
      invoices.push({
        id: `inv_${Date.now()}_${i}`,
        number: `INV-${new Date().getFullYear()}-${String(1000 + i).padStart(4, '0')}`,
        amount: 29.99,
        currency: 'USD',
        status: invoiceStatus,
        issueDate: invoiceDate,
        dueDate: new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        paidDate: invoiceStatus === 'paid' ? new Date(invoiceDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        description: 'Basic Plan - Monthly Subscription',
        items: [
          {
            description: 'Basic Plan Subscription',
            quantity: 1,
            unitPrice: 29.99,
            total: 29.99
          }
        ],
        downloadUrl: `https://billing.afroasiaconnect.com/invoices/inv_${Date.now()}_${i}.pdf`
      });
    }

    // Filter by status if provided
    let filteredInvoices = invoices;
    if (status) {
      filteredInvoices = invoices.filter(inv => inv.status === status);
    }

    res.json({ invoices: filteredInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get billing analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeRange = '12m' } = req.query;
    
    // Simulate billing analytics
    const analytics = {
      totalSpent: {
        amount: 359.88,
        currency: 'USD',
        period: 'Last 12 months'
      },
      averageMonthly: {
        amount: 29.99,
        currency: 'USD'
      },
      paymentSuccess: {
        rate: 98.5,
        total: 12,
        successful: 12,
        failed: 0
      },
      upcomingCharges: [
        {
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          amount: 29.99,
          description: 'Basic Plan - Monthly Subscription'
        }
      ],
      monthlySpending: []
    };

    // Generate monthly spending data
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate);
      month.setMonth(currentDate.getMonth() - i);
      
      analytics.monthlySpending.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: 29.99,
        currency: 'USD'
      });
    }

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching billing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch billing analytics' });
  }
});

// Get available plans
router.get('/plans', authMiddleware, async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'Up to 100 service listings',
          'Basic analytics',
          'Email support',
          'Standard messaging',
          'Profile customization'
        ],
        limits: {
          services: 100,
          storage: 10, // GB
          messages: 5000
        },
        popular: false
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        price: 79.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'Unlimited service listings',
          'Advanced analytics & insights',
          'Priority support',
          'Advanced messaging features',
          'Custom branding',
          'API access',
          'Team collaboration'
        ],
        limits: {
          services: -1, // unlimited
          storage: 100, // GB
          messages: -1 // unlimited
        },
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 199.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'Everything in Professional',
          'White-label solution',
          'Dedicated account manager',
          'Custom integrations',
          'Advanced security features',
          'SLA guarantee',
          'Custom reporting'
        ],
        limits: {
          services: -1,
          storage: 500, // GB
          messages: -1
        },
        popular: false
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Update payment method
router.put('/payment-method', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { paymentMethodId, isDefault } = req.body;
    
    // In production, this would integrate with payment processor (Stripe, etc.)
    // For now, simulate successful update
    
    res.json({ 
      success: true, 
      message: 'Payment method updated successfully',
      paymentMethod: {
        id: paymentMethodId,
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: isDefault
      }
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

// Cancel subscription
router.post('/subscription/cancel', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason, feedback } = req.body;
    
    // In production, this would cancel the actual subscription
    // For now, simulate successful cancellation
    
    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      cancellation: {
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End of current billing period
        reason: reason,
        refundAmount: 0 // No refund for monthly plans
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
