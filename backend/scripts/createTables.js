const { pool } = require('../config/db');

const createUsersTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('buyer', 'seller', 'agent', 'admin')),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log('"users" table created successfully or already exists.');
  } catch (err) {
    console.error('Error creating "users" table:', err.stack);
  } finally {
    await pool.end(); // Close the connection pool
    console.log('Database connection closed.');
  }
};

createUsersTable();
