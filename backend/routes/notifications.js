const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationsResult = await db.query(
      'SELECT id, user_id, type, message, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(notificationsResult.rows);
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

    const updateResult = await db.query(
      'UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id, is_read, updated_at',
      [notificationId, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Notification not found or user not authorized.' });
    }

    res.json({ 
      msg: 'Notification marked as read.', 
      notification: updateResult.rows[0] 
    });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    // Check for invalid UUID or integer format for notificationId if applicable
    if (err.message.includes('invalid input syntax for type integer')) { // Adjust if your ID is UUID
        return res.status(400).json({ msg: 'Invalid notification ID format.' });
    }
    res.status(500).json({ msg: 'Server error while marking notification as read.', error: err.message });
  }
});


// Placeholder for future: Mark all as read
// router.post('/mark-all-read', authMiddleware, async (req, res) => { ... });

module.exports = router;
