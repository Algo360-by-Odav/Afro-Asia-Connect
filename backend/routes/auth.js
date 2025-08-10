const express = require('express');
const bcrypt = require('bcryptjs'); // Already present, ensure it is
const jwt = require('jsonwebtoken');
// const db = require('../config/db'); // replaced by Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config({ path: '../.env' });
const { authenticateToken } = require('../middleware/authMiddleware'); // Added for /me route // Ensure .env is loaded relative to this file's execution if needed directly

const router = express.Router();

// Helper function to map Prisma role to legacy user_type
const mapRoleToUserType = (role) => {
  switch (role) {
    case 'SERVICE_PROVIDER':
      return 'service_provider';
    case 'CUSTOMER':
      return 'customer';
    case 'ADMIN':
      return 'admin';
    default:
      return 'customer';
  }
};




// ----- Prisma-based User Registration Route -----
router.post('/register', async (req, res) => {
  console.log('[/register] Raw request body:', req.body);
  // Accept either role or user_type from client; default to BUYER
  const { email, password, role: roleInput, user_type, firstName, lastName } = req.body;
  let normalizedRole = (user_type || roleInput || 'BUYER').toUpperCase();
  
  // Map mobile app roles to database enum values
  if (normalizedRole === 'CUSTOMER') normalizedRole = 'BUYER';
  if (normalizedRole === 'SELLER') normalizedRole = 'SUPPLIER';
  // SERVICE_PROVIDER remains as SERVICE_PROVIDER
  

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter both email and password.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ msg: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    console.log('[/register] Creating user with role:', normalizedRole);
    // Insert new user
    // create user via Prisma
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: normalizedRole,
        firstName,
        lastName,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    // Generate JWT token for immediate login after registration
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        user_type: mapRoleToUserType(user.role),
        is_admin: user.isAdmin
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    
    return res.status(201).json({
      success: true,
      data: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          user_type: mapRoleToUserType(user.role)
        }
      },
      message: 'User registered successfully.'
    });
  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ msg: 'Server error during registration.', error: err.message });
  }
});

// ----- Prisma-based User Login Route -----
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter both email and password.' });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isActive === false) {
      return res.status(400).json({ msg: 'Invalid credentials or user not found.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // User matched, create JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        user_type: mapRoleToUserType(user.role),
        is_admin: user.isAdmin // Added is_admin to JWT payload
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

        // Send response with user data in format expected by mobile app
        res.json({
          success: true,
          data: {
            token: token,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              firstName: user.firstName,
              lastName: user.lastName,
              user_type: mapRoleToUserType(user.role),
              first_name: user.firstName,
              last_name: user.lastName,
              is_verified: user.isActive,
              isAdmin: user.isAdmin
            }
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // authMiddleware has already populated req.user if token is valid
    // Fetch the latest user data from DB using Prisma
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ msg: 'User not found or not active.' });
    }

    // Return user data in expected format
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        user_type: mapRoleToUserType(user.role),
        first_name: user.firstName,
        last_name: user.lastName,
        is_verified: user.isActive,
        isAdmin: user.isAdmin,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me route:', error.message);
    res.status(500).json({ msg: 'Server error while fetching user data.' });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current logged-in user's profile (first_name, last_name)
// @access  Private (requires token)
router.put('/me', authenticateToken, async (req, res) => {
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
router.post('/change-password', authenticateToken, async (req, res) => {
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


// ----- Google OAuth 2.0 Callback -----
// Frontend initiates flow; Google redirects to `${GOOGLE_REDIRECT_URI}` which should point to this endpoint
// Example .env entries:
//   GOOGLE_CLIENT_ID=...
//   GOOGLE_CLIENT_SECRET=...
//   GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).json({ msg: 'Google OAuth error', error });
  if (!code) return res.status(400).json({ msg: 'Missing authorization code.' });

  const {
    GOOGLE_CLIENT_ID: client_id,
    GOOGLE_CLIENT_SECRET: client_secret,
    GOOGLE_REDIRECT_URI: redirect_uri,
    JWT_SECRET,
  } = process.env;

  if (!client_id || !client_secret || !redirect_uri) {
    return res.status(500).json({ msg: 'Google OAuth environment variables not configured.' });
  }

  try {
    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error('Google token exchange error', tokenData);
      return res.status(500).json({ msg: 'Failed to exchange code for token', error: tokenData });
    }

    const { access_token, id_token } = tokenData;

    // Fetch user info
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await userResp.json();
    if (!userResp.ok) {
      console.error('Google userinfo error', profile);
      return res.status(500).json({ msg: 'Failed to fetch user profile', error: profile });
    }

    const { email, given_name: firstName, family_name: lastName, picture } = profile;
    if (!email) return res.status(500).json({ msg: 'Email not provided by Google.' });

    // Upsert user in DB
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: '', // password not set for social login
          role: 'BUYER',
          firstName: firstName || '',
          lastName: lastName || '',
          avatarUrl: picture || null,
          isVerified: true,
        },
      });
    }

    // Sign JWT
    const payload = { user: { id: user.id, email: user.email, user_type: mapRoleToUserType(user.role) } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' });

    // Set cookie for session auth
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 60 * 1000,
      path: '/',
    });

    // Decide redirect
    const finalRedirect = process.env.OAUTH_SUCCESS_REDIRECT || '/';
    return res.redirect(finalRedirect);
  } catch (err) {
    console.error('Google OAuth callback error', err);
    return res.status(500).json({ msg: 'Google OAuth processing failed', error: err.message });
  }
});

// @route   GET /api/auth/config
// @desc    Get environment configuration for frontend
// @access  Public
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        apiUrl: process.env.API_URL || 'http://localhost:3001',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        features: {
          emailEnabled: !!process.env.EMAIL_USER,
          smsEnabled: !!process.env.TWILIO_ACCOUNT_SID,
          paymentsEnabled: !!process.env.STRIPE_SECRET_KEY,
          analyticsEnabled: true
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/config route:', error.message);
    res.status(500).json({ msg: 'Server error while fetching config.' });
  }
});

module.exports = router;
