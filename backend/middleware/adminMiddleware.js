const adminMiddleware = (req, res, next) => {
  // This middleware should run AFTER authMiddleware, so req.user should be populated.
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ msg: 'FORBIDDEN: Administrator access required.' });
  }
  next();
};

module.exports = adminMiddleware;
