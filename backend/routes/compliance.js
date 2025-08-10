const express = require('express');
const router = express.Router();
const complianceService = require('../services/complianceService');

// Get compliance score for user
router.get('/score', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'userId required' });
    
    const score = await complianceService.calculateComplianceScore(userId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// Get required documents list
router.get('/requirements', async (req, res) => {
  try {
    res.json(complianceService.REQUIRED_DOCUMENTS);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
