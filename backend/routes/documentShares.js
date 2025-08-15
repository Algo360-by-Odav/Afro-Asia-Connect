const express = require('express');
const router = express.Router();
const shareService = require('../services/documentShareService');

// create share
router.post('/:documentId/share', async (req, res) => {
  try {
    const { targetUserId, expiresAt, ownerId } = req.body;
    const { documentId } = req.params;
    if (!ownerId) return res.status(400).json({ msg: 'ownerId required' });
    const share = await shareService.createShare(ownerId, documentId, targetUserId, expiresAt);
    res.status(201).json(share);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// list shares for a document
router.get('/:documentId/shares', async (req, res) => {
  try {
    const { documentId } = req.params;
    const ownerId = req.user.id;
    const shares = await shareService.listSharesForDocument(ownerId, documentId);
    res.json(shares);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// revoke
router.delete('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const ownerId = req.user.id;
    await shareService.revokeShare(ownerId, shareId);
    res.json({ msg: 'revoked' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// list shares for logged in user (received)
router.get('/received/list', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'userId required' });
    const shares = await shareService.listSharesForTarget(userId);
    res.json(shares);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
