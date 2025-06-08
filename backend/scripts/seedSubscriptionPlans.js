const db = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load backend/.env

const plans = [
  {
    name: 'Free Tier',
    price: 0.00,
    currency: 'USD',
    duration_days: 99999, // Represents a very long time for a free tier
    features: ['Up to 3 business listings', 'Basic support', 'Limited lead views'],
    description: 'Get started with our basic features at no cost.',
    is_active: true,
  },
  {
    name: 'Basic Connect',
    price: 9.99,
    currency: 'USD',
    duration_days: 30,
    features: ['Up to 10 business listings', 'Email support', 'Standard lead views', 'Access to community forum'],
    description: 'Ideal for individuals and small businesses getting started.',
    is_active: true,
  },
  {
    name: 'Premium Connect',
    price: 24.99,
    currency: 'USD',
    duration_days: 30,
    features: ['Up to 50 business listings', 'Priority email support', 'Advanced lead insights', 'Featured listing option (1 per month)', 'API Access (limited)'],
    description: 'For growing businesses looking for more features and support.',
    is_active: true,
  },
  {
    name: 'Business Pro',
    price: 49.99,
    currency: 'USD',
    duration_days: 30,
    features: ['Unlimited business listings', 'Dedicated account manager', 'Full lead management tools', 'Featured listing option (5 per month)', 'Full API Access', 'Early access to new features'],
    description: 'Comprehensive solution for established businesses and enterprises.',
    is_active: true,
  },
];

const seedPlans = async () => {
  try {
    console.log('Starting to seed subscription plans...');
    let plansCreated = 0;
    let plansSkipped = 0;

    for (const plan of plans) {
      // Check if plan already exists by name
      const existingPlanResult = await db.query('SELECT id FROM subscription_plans WHERE name = $1', [plan.name]);
      
      if (existingPlanResult.rows.length > 0) {
        console.log(`Plan "${plan.name}" already exists. Skipping.`);
        plansSkipped++;
        continue;
      }

      const queryText = `
        INSERT INTO subscription_plans (name, price, currency, duration_days, features, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
      const values = [
        plan.name,
        plan.price,
        plan.currency,
        plan.duration_days,
        plan.features,
        plan.description,
        plan.is_active,
      ];
      
      await db.query(queryText, values);
      console.log(`Created plan: ${plan.name}`);
      plansCreated++;
    }

    console.log('----------------------------------------');
    console.log('Subscription plan seeding completed.');
    console.log(`${plansCreated} plans created.`);
    console.log(`${plansSkipped} plans skipped (already existed).`);
    console.log('----------------------------------------');

  } catch (err) {
    console.error('Error seeding subscription plans:', err.stack);
  } finally {
    if (require.main === module) {
      await db.pool.end();
      console.log('Database pool connection ended.');
    }
  }
};

if (require.main === module) {
  seedPlans();
}

module.exports = seedPlans;
