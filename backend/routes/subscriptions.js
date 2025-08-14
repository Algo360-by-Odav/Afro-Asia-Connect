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
    // 1. Validate the planId and get plan details (especially duration_days)
    const planResult = await db.query('SELECT id, duration_days, name FROM subscription_plans WHERE id = $1 AND is_active = TRUE', [planId]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Subscription plan not found or is not active.' });
    }
    const plan = planResult.rows[0];

    // 2. Calculate subscription start and expiry dates
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(startedAt.getDate() + plan.duration_days);

    // 3. Update the user's subscription details in the database
    const updateUserQuery = `
      UPDATE users 
      SET 
        current_subscription_plan_id = $1,
        subscription_status = 'active',
        subscription_started_at = $2,
        subscription_expires_at = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, first_name, last_name, email, user_type, current_subscription_plan_id, subscription_status, subscription_started_at, subscription_expires_at;
    `; // Returning more fields to potentially update client state
    
    const updatedUserResult = await db.query(updateUserQuery, [
      plan.id,
      startedAt.toISOString(),
      expiresAt.toISOString(),
      userId
    ]);

    if (updatedUserResult.rows.length === 0) {
      // This should not happen if authMiddleware is working and user exists
      return res.status(404).json({ msg: 'User not found for update.' });
    }

    // Optionally, you might want to fetch the full user object with joined subscription details here
    // to return to the client, similar to /api/auth/me. For now, we'll keep it simpler.
    
    res.json({
      msg: `Successfully subscribed to ${plan.name}.`,
      subscriptionDetails: {
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      // updatedUser: updatedUserResult.rows[0] // Could return this if frontend needs immediate full update
    });

  } catch (error) {
    console.error('Error subscribing to plan:', error.message);
    res.status(500).json({ msg: 'Server error while subscribing to plan.' });
  }
});

module.exports = router;
