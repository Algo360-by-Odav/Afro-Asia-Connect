const prisma = require('../prismaClient');

/**
 * Admin authentication middleware
 * Checks if the authenticated user has admin privileges
 */
const adminAuth = async (req, res, next) => {
  try {
    // User should already be authenticated by the auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user has admin privileges using the simple isAdmin field
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      console.log(`Non-admin user ${user.email} attempted to access admin endpoint: ${req.originalUrl}`);
      
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    // User has admin privileges, proceed
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

/**
 * Super admin authentication middleware
 * Checks if the authenticated user has super admin privileges
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // First check if user is admin
    await adminAuth(req, res, () => {});

    if (!req.admin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin privileges required' 
      });
    }

    // Check for super admin role
    const hasSuperAdminRole = req.admin.roles.includes('super_admin');
    const hasSuperAdminPermission = req.admin.permissions.includes('super_admin_access');

    if (!hasSuperAdminRole && !hasSuperAdminPermission) {
      return res.status(403).json({ 
        success: false, 
        error: 'Super admin privileges required' 
      });
    }

    next();
  } catch (error) {
    console.error('Super admin auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

/**
 * Permission-based authorization middleware
 * Checks if the authenticated admin has specific permissions
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // First check if user is admin
      await adminAuth(req, res, () => {});

      if (!req.admin) {
        return res.status(403).json({ 
          success: false, 
          error: 'Admin privileges required' 
        });
      }

      // Check for specific permission
      const hasPermission = req.admin.permissions.includes(requiredPermission) ||
                           req.admin.permissions.includes('super_admin_access');

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: `Permission required: ${requiredPermission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };
};

module.exports = {
  adminAuth,
  superAdminAuth,
  requirePermission
};
