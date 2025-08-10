const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Ensure .env is loaded relative to backend root

// Authentication middleware
const authenticateToken = function(req, res, next) {
  // Get token from cookie or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied. Please log in.' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Add user from payload to request object
    next(); // Call next middleware
  } catch (err) {
    console.error('Token verification error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token is not valid (expired). Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Token is not valid. Please log in again.' });
    }
    // For other errors during verification, send a generic server error
    res.status(500).json({ msg: 'Server Error during token verification.' });
  }
};

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    const userRole = req.user.user_type || req.user.role;
    // Make role comparison case-insensitive
    const userRoleUpper = userRole ? userRole.toUpperCase() : '';
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());
    
    if (!allowedRolesUpper.includes(userRoleUpper)) {
      return res.status(403).json({ 
        msg: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Export authenticateToken as the main export for backward compatibility
module.exports = authenticateToken;

// Also export named functions
module.exports.authenticateToken = authenticateToken;
module.exports.requireRole = requireRole;
