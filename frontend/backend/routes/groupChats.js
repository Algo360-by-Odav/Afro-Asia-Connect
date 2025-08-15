const express = require('express');
const messagingService = require('../services/messagingService');
const router = express.Router();

// Create group conversation
router.post('/', async (req, res) => {
  try {
    const { creatorId, title, description, participantIds } = req.body;
    
    if (!creatorId || !title || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'creatorId, title, and participantIds array are required' });
    }
    
    const groupConversation = await messagingService.createGroupConversation(
      creatorId, title, description, participantIds
    );
    
    res.status(201).json(groupConversation);
  } catch (error) {
    console.error('Error creating group conversation:', error);
    res.status(500).json({ error: 'Failed to create group conversation' });
  }
});

// Add participants to group
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { participantIds, requesterId } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds) || !requesterId) {
      return res.status(400).json({ error: 'participantIds array and requesterId are required' });
    }
    
    const updatedConversation = await messagingService.addParticipantsToGroup(
      id, participantIds, requesterId
    );
    
    res.json(updatedConversation);
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ error: error.message || 'Failed to add participants' });
  }
});

// Remove participant from group
router.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { requesterId } = req.body;
    
    if (!requesterId) {
      return res.status(400).json({ error: 'requesterId is required' });
    }
    
    const updatedConversation = await messagingService.removeParticipantFromGroup(
      id, participantId, requesterId
    );
    
    res.json(updatedConversation);
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: error.message || 'Failed to remove participant' });
  }
});

// Update group details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requesterId } = req.body;
    
    if (!requesterId) {
      return res.status(400).json({ error: 'requesterId is required' });
    }
    
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    
    const updatedConversation = await messagingService.updateGroupConversation(
      id, updates, requesterId
    );
    
    res.json(updatedConversation);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: error.message || 'Failed to update group' });
  }
});

module.exports = router;
