const express = require('express');
const scheduledMessageService = require('../services/scheduledMessageService');
const router = express.Router();

// Create scheduled message
router.post('/', async (req, res) => {
  try {
    const { senderId, conversationId, content, scheduledFor, messageType, fileUrl, fileName } = req.body;
    
    if (!senderId || !conversationId || !content || !scheduledFor) {
      return res.status(400).json({ error: 'senderId, conversationId, content, and scheduledFor are required' });
    }
    
    // Validate scheduledFor is in the future
    const scheduleDate = new Date(scheduledFor);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    
    const scheduledMessage = await scheduledMessageService.createScheduledMessage(
      senderId, conversationId, content, scheduledFor, messageType, fileUrl, fileName
    );
    
    res.status(201).json(scheduledMessage);
  } catch (error) {
    console.error('Error creating scheduled message:', error);
    res.status(500).json({ error: 'Failed to create scheduled message' });
  }
});

// Get user's scheduled messages
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const scheduledMessages = await scheduledMessageService.getUserScheduledMessages(userId, status);
    res.json(scheduledMessages);
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
});

// Update scheduled message
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, scheduledFor } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Validate scheduledFor if provided
    if (scheduledFor) {
      const scheduleDate = new Date(scheduledFor);
      if (scheduleDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
    }
    
    const updates = {};
    if (content !== undefined) updates.content = content;
    if (scheduledFor !== undefined) updates.scheduledFor = scheduledFor;
    
    const scheduledMessage = await scheduledMessageService.updateScheduledMessage(id, userId, updates);
    res.json(scheduledMessage);
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    res.status(500).json({ error: 'Failed to update scheduled message' });
  }
});

// Cancel scheduled message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    await scheduledMessageService.cancelScheduledMessage(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled message' });
  }
});

// Get pending messages (for cron job)
router.get('/pending', async (req, res) => {
  try {
    const pendingMessages = await scheduledMessageService.getPendingMessages();
    res.json(pendingMessages);
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    res.status(500).json({ error: 'Failed to fetch pending messages' });
  }
});

// Send scheduled message (for cron job)
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await scheduledMessageService.sendScheduledMessage(id);
    res.json(result);
  } catch (error) {
    console.error('Error sending scheduled message:', error);
    res.status(500).json({ error: 'Failed to send scheduled message' });
  }
});

module.exports = router;
