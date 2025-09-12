const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, unreadOnly } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === 'true'
    };
    
    const notifications = await notificationService.listForUser(userId, options);
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching notifications.', 
      error: err.message 
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for the authenticated user
// @access  Private
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    console.error('Error fetching unread count:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching unread count.', 
      error: err.message 
    });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification (admin only)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        msg: 'Access denied. Admin privileges required.' 
      });
    }

    const {
      userId,
      type,
      title,
      message,
      data,
      priority,
      sendEmail,
      sendSMS,
      actionUrl
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        success: false,
        msg: 'Missing required fields: userId, type, title, message' 
      });
    }

    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      data: data || {},
      priority: priority || 'MEDIUM',
      sendEmail: sendEmail || false,
      sendSMS: sendSMS || false,
      actionUrl
    });

    res.status(201).json({
      success: true,
      notification,
      msg: 'Notification created successfully'
    });
  } catch (err) {
    console.error('Error creating notification:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while creating notification.', 
      error: err.message 
    });
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
      return res.status(404).json({ 
        success: false,
        msg: 'Notification not found or user not authorized.' 
      });
    }
    res.json({ 
      success: true,
      msg: 'Notification marked as read.' 
    });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while marking notification as read.', 
      error: err.message 
    });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read for the authenticated user
// @access  Private
router.post('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { count } = await notificationService.markAllRead(userId);
    res.json({ 
      success: true,
      msg: `${count} notifications marked as read.`,
      markedCount: count
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while marking all notifications as read.', 
      error: err.message 
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a specific notification
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const { count } = await notificationService.deleteNotification(notificationId, userId);
    if (count === 0) {
      return res.status(404).json({ 
        success: false,
        msg: 'Notification not found or user not authorized.' 
      });
    }
    res.json({ 
      success: true,
      msg: 'Notification deleted successfully.' 
    });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while deleting notification.', 
      error: err.message 
    });
  }
});

module.exports = router;
