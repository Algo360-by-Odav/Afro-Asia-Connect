const express = require('express');
const router = express.Router();
// const db = require('../config/db'); // replaced by Prisma service
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.listForUser(userId);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ msg: 'Server error while fetching notifications.', error: err.message });
  }
});

// @route   POST /api/notifications/:id/mark-read
// @desc    Mark a specific notification as read
// @access  Private
router.post('/:id/mark-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const { count } = await notificationService.markRead(notificationId, userId);
    if (count === 0) {
      return res.status(404).json({ msg: 'Notification not found or user not authorized.' });
    }
    res.json({ msg: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ msg: 'Server error while marking notification as read.', error: err.message });
  }
});


// Placeholder for future: Mark all as read
// router.post('/mark-all-read', authMiddleware, async (req, res) => { ... });

module.exports = router;
