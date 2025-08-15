const express = require('express');
const router = express.Router();
const workingHoursService = require('../services/workingHoursService');

// GET provider working hours
router.get('/:id/working-hours', async (req, res) => {
  try {
    const { id } = req.params;
    const hours = await workingHoursService.getForProvider(id);
    res.json(hours);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch working hours', error: err.message });
  }
});

// PUT update working hours (replace all)
router.put('/:id/working-hours', async (req, res) => {
  try {
    const { id } = req.params;
    const { entries } = req.body; // [{ weekday, startTime, endTime }]
    if (!Array.isArray(entries)) return res.status(400).json({ msg: 'entries array required' });
    await workingHoursService.upsertMany(id, entries);
    res.json({ msg: 'Working hours updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update working hours', error: err.message });
  }
});

// Provider config (allow urgent + unavailable)
const providerConfigService = require('../services/providerConfigService');

router.get('/:id/config', async (req, res) => {
  try {
    const cfg = await providerConfigService.get(req.params.id);
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

router.put('/:id/config', async (req, res) => {
  try {
    const updated = await providerConfigService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
