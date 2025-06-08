const express = require('express');
const bcrypt = require('bcryptjs'); // Already present, ensure it is
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config({ path: '../.env' });
const authMiddleware = require('../middleware/authMiddleware'); // Added for /me route // Ensure .env is loaded relative to this file's execution if needed directly

const router = express.Router();

// User Registration Route
router.post('/register', async (req, res) => {
  const { email, password, user_type, first_name, last_name } = req.body;

  // Basic validation
  if (!email || !password || !user_type) {
    return res.status(400).json({ msg: 'Please enter email, password, and user type.' });
  }

  // Check for existing user
  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const newUserQuery = `
      INSERT INTO users (email, password_hash, user_type, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, user_type, created_at;
    `;
    const newUser = await db.query(newUserQuery, [email, password_hash, user_type, first_name, last_name]);

    // For now, just return success and user info (excluding password)
    // We will add JWT generation in the next step for login
    res.status(201).json({
      msg: 'User registered successfully.',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ msg: 'Server error during registration.', error: err.message });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter both email and password.' });
  }

  try {
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials or user not found.' });
    }

    const user = userResult.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // User matched, create JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        is_admin: user.is_admin // Added is_admin to JWT payload
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours (adjust as needed)
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ msg: 'Error signing token.' });
        }

        // Set cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
          maxAge: 5 * 60 * 60 * 1000, // 5 hours in milliseconds, matches JWT expiry
          path: '/' // Cookie is accessible from all paths
        });

        // Send response with user data (token can also be included here if frontend needs it directly)
        res.json({
          // We can still send the token in the body if the client needs to access it immediately 
          // for non-HTTP-only purposes, or for easier state management without re-fetching user. 
          // However, the primary auth mechanism for subsequent requests protected by middleware will be the cookie.
          token: token, 
          user: {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            first_name: user.first_name,
            last_name: user.last_name,
            is_verified: user.is_verified,
            is_admin: user.is_admin // Added is_admin to user object in response
          }
        });
      }
    );

  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ msg: 'Server error during login.', error: err.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Log out user and clear cookie
// @access  Public (requires cookie to be cleared, but route itself is public)
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0), // Set expiry to a past date
    path: '/'
  });
  res.status(200).json({ msg: 'Logged out successfully.' });
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user's data (verify token)
// @access  Private (requires token)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // authMiddleware has already populated req.user if token is valid
    // We might want to fetch the latest user data from DB to ensure it's fresh
    // Attempt to fetch user details along with subscription information
    // This assumes 'users' table has 'current_subscription_plan_id', 'subscription_status', 'subscription_expires_at'
    // And a 'subscription_plans' table has 'id', 'name', 'features' (e.g., JSON array of strings)
    const userQuery = `
      SELECT 
        u.id, u.email, u.user_type, u.first_name, u.last_name, u.is_verified, 
        u.created_at, u.updated_at,
        sp.name AS subscription_plan_name,
        u.subscription_status,
        sp.features AS subscription_plan_features,
        u.subscription_expires_at
      FROM users u
      LEFT JOIN subscription_plans sp ON u.current_subscription_plan_id = sp.id
      WHERE u.id = $1;
    `;
    const userResult = await db.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      // This case should ideally not happen if authMiddleware passed and user ID is from a valid token,
      // but it's a good safeguard (e.g., user deleted/deactivated after token issuance)
      return res.status(404).json({ msg: 'User not found or not active.' });
    }

    const userData = userResult.rows[0];
    // Ensure features are parsed if stored as JSON string, default to empty array if null/undefined
    if (userData && userData.subscription_plan_features && typeof userData.subscription_plan_features === 'string') {
      try {
        userData.subscription_plan_features = JSON.parse(userData.subscription_plan_features);
      } catch (e) {
        console.error('Failed to parse subscription_plan_features JSON:', e);
        userData.subscription_plan_features = []; // Default to empty array on parse error
      }
    } else if (userData && !userData.subscription_plan_features) {
        userData.subscription_plan_features = []; // Default if null/undefined
    }

    res.json(userData);
  } catch (error) {
    console.error('Error in /api/auth/me route:', error.message);
    res.status(500).json({ msg: 'Server error while fetching user data.' });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current logged-in user's profile (first_name, last_name)
// @access  Private (requires token)
router.put('/me', authMiddleware, async (req, res) => {
  const { first_name, last_name } = req.body;
  const userId = req.user.id; // From authMiddleware

  // Basic validation (can be more extensive)
  if (typeof first_name !== 'string' || typeof last_name !== 'string') {
    return res.status(400).json({ msg: 'First name and last name must be strings.' });
  }

  try {
    const updateQuery = `
      UPDATE users
      SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, user_type, first_name, last_name, is_verified, created_at, updated_at;
    `;
    const updatedUserResult = await db.query(updateQuery, [first_name, last_name, userId]);

    if (updatedUserResult.rows.length === 0) {
      // This should not happen if authMiddleware ensures user exists
      return res.status(404).json({ msg: 'User not found or unable to update.' });
    }

    res.json(updatedUserResult.rows[0]);
  } catch (error) {
    console.error('Error in PUT /api/auth/me route:', error.message);
    res.status(500).json({ msg: 'Server error while updating user profile.' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ msg: 'Please provide current password, new password, and confirm new password.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: 'New password and confirm new password do not match.' });
  }

  // Add password complexity requirements if needed (e.g., length, character types)
  if (newPassword.length < 8) {
    return res.status(400).json({ msg: 'New password must be at least 8 characters long.' });
  }

  try {
    // 1. Fetch current user's hashed password
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found.' }); // Should not happen if authMiddleware works
    }
    const hashedPasswordFromDB = userResult.rows[0].password_hash;

    // 2. Compare currentPassword with the one in DB
    const isMatch = await bcrypt.compare(currentPassword, hashedPasswordFromDB);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password.' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the password in the database
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHashedPassword, userId]);

    res.json({ msg: 'Password changed successfully.' });

  } catch (error) {
    console.error('Error changing password:', error.message);
    res.status(500).json({ msg: 'Server error while changing password.' });
  }
});

module.exports = router;
