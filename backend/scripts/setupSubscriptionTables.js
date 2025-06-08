const db = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Ensure DB environment variables are loaded from backend/.env

const createSubscriptionPlansTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        duration_days INTEGER NOT NULL, -- e.g., 30 for monthly, 365 for yearly
        features TEXT[] DEFAULT '{}', -- Array of text strings describing features
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE, -- To easily enable/disable plans
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(queryText);
    console.log('Subscription_plans table created or already exists.');
  } catch (err) {
    console.error('Error creating subscription_plans table:', err.stack);
    throw err; // Re-throw to stop execution if this fails
  }
};

const alterUsersTableForSubscriptions = async () => {
  const queryText = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS current_subscription_plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive', -- e.g., 'active', 'inactive', 'pending', 'cancelled', 'past_due'
    ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
  `;
  const indexQuery = `
    CREATE INDEX IF NOT EXISTS idx_users_current_subscription_plan_id ON users(current_subscription_plan_id);
  `;
  try {
    await db.query(queryText);
    console.log('Users table altered for subscriptions or columns already exist.');
    await db.query(indexQuery);
    console.log('Index on users(current_subscription_plan_id) created or already exists.');
  } catch (err) {
    console.error('Error altering users table for subscriptions:', err.stack);
    throw err; // Re-throw to stop execution if this fails
  }
};

const setupTables = async () => {
  try {
    console.log('Starting database table setup for subscriptions...');
    await createSubscriptionPlansTable();
    await alterUsersTableForSubscriptions();
    console.log('Subscription table setup completed successfully.');
  } catch (err) {
    console.error('Failed to set up subscription tables:', err.message);
  } finally {
    // End the pool connection if this script is run directly and not imported
    // Check if this script is the main module
    if (require.main === module) {
      await db.pool.end();
      console.log('Database pool connection ended.');
    }
  }
};

// If run directly from command line
if (require.main === module) {
  setupTables();
}

module.exports = setupTables; // Export if needed elsewhere, though typically run as a script
