const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming this is the correct path

// @route   GET /api/subscriptions/plans
// @desc    Get all active subscription plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    // Static subscription plans data
    const plans = [
      {
        id: 1,
        name: 'Basic Connect',
        price: '0',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Basic Company Profile',
          'Limited Directory Access',
          'Post up to 1 Request',
          'Community Forum Access'
        ],
        description: 'Perfect for getting started with AfroAsiaConnect'
      },
      {
        id: 2,
        name: 'Business Growth',
        price: '49',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Enhanced Company Profile',
          'Full Directory Access',
          'Post up to 10 Requests',
          'Verified Badge',
          'Priority Support',
          'Access to Exclusive Events'
        ],
        description: 'Ideal for growing businesses seeking expansion'
      },
      {
        id: 3,
        name: 'Enterprise Global',
        price: '199',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Premium Company Profile',
          'Unlimited Directory Access',
          'Unlimited Requests',
          'Premium Verified Badge',
          'Dedicated Account Manager',
          'Custom Integration Support',
          'Advanced Analytics Dashboard'
        ],
        description: 'Complete solution for enterprise-level operations'
      }
    ];
    
    res.json(plans);
  } catch (err) {
    console.error('Error fetching subscription plans:', err.message);
    res.status(500).json({ msg: 'Server error while fetching subscription plans.' });
  }
});

// @route   POST /api/subscriptions/subscribe
// @desc    Subscribe user to a chosen plan
// @access  Private
router.post('/subscribe', authMiddleware, async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.id;

  if (!planId) {
    return res.status(400).json({ msg: 'Plan ID is required.' });
  }

  try {
    // Static subscription plans data (same as in GET /plans)
    const plans = [
      { id: 1, name: 'Basic Connect', duration_days: 30 },
      { id: 2, name: 'Business Growth', duration_days: 30 },
      { id: 3, name: 'Enterprise Global', duration_days: 30 }
    ];

    // 1. Validate the planId and get plan details
    const plan = plans.find(p => p.id === parseInt(planId));
    if (!plan) {
      return res.status(404).json({ msg: 'Subscription plan not found.' });
    }

    // 2. Calculate subscription start and expiry dates
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(startedAt.getDate() + plan.duration_days);

    // For now, return success without database update (can be implemented later)
    // In a real implementation, you would update the user's subscription in the database
    console.log(`User ${userId} subscribed to plan ${plan.name} (${plan.id})`);
    
    res.json({
      success: true,
      msg: `Successfully subscribed to ${plan.name}.`,
      subscriptionDetails: {
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error subscribing to plan:', error.message);
    res.status(500).json({ msg: 'Server error while subscribing to plan.' });
  }
});

module.exports = router;
