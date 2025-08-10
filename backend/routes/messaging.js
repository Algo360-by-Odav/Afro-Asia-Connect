const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get conversations for user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    // Use authenticated user's ID from token
    const userId = req.user.id;
    
    const conversations = await messagingService.getUserConversations(userId);
    res.json({
      success: true,
      data: conversations || []
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to fetch conversations', 
      error: err.message 
    });
  }
});

// Get or create conversation
router.post('/conversations', async (req, res) => {
  try {
    const { userId1, userId2, serviceRequestId, consultationId } = req.body;
    if (!userId1 || !userId2) return res.status(400).json({ msg: 'userId1 and userId2 required' });
    
    const conversation = await messagingService.getOrCreateConversation(
      userId1, userId2, serviceRequestId, consultationId
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await messagingService.getConversationMessages(id, Number(limit), Number(offset));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// Send message (also handled via WebSocket)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, content, messageType = 'TEXT', fileUrl, fileName } = req.body;
    
    if (!senderId || !content) return res.status(400).json({ msg: 'senderId and content required' });
    
    // Pass security context for audit logging
    const message = await messagingService.sendMessage(
      id, 
      senderId, 
      content, 
      messageType, 
      fileUrl, 
      fileName,
      req.ip, // IP address for security audit
      req.get('User-Agent') // User agent for security audit
    );
    
    res.status(201).json(message);
  } catch (err) {
    // Check if it's a DLP violation
    if (err.message.includes('security policy violations')) {
      return res.status(403).json({ 
        msg: 'Message blocked by security policy', 
        error: err.message,
        type: 'DLP_VIOLATION'
      });
    }
    
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { userId, q, limit } = req.query;
    
    if (!userId || !q) {
      return res.status(400).json({ error: 'userId and query (q) are required' });
    }
    
    const messages = await messagingService.searchMessages(userId, q, limit ? parseInt(limit) : 50);
    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    await messagingService.markMessagesAsRead(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;
