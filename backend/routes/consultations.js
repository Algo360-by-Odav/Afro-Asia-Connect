const express = require('express');
const router = express.Router();
const consultationService = require('../services/consultationService');

// GET list for provider
router.get('/', async (req, res) => {
  try {
    const { providerId } = req.query;
    if (!providerId) return res.status(400).json({ msg: 'providerId required' });
    const list = await consultationService.listForProvider(providerId);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch consultations', error: err.message });
  }
});

// POST create consultation
router.post('/', async (req, res) => {
  try {
    const {
      serviceType,
      date,
      time,
      name,
      email,
      company,
      topic,
      notes,
      timezone,
      companyName,
    } = req.body;

    const data = {
      providerId: 1, // TODO derive from companyName/provider mapping
      buyerId: req.user?.id || null, // if auth middleware adds user
      serviceType,
      start: new Date(`${date}T${time}:00`),
      end: new Date(new Date(`${date}T${time}:00`).getTime() + 30 * 60000),
      urgent: false,
      notes: { create: [{ authorId: req.user?.id || 0, text: notes || '' }] },
    };
    await consultationService.create(data);
    return res.status(201).json({ msg: 'Consultation booked.' });
  } catch (err) {
    console.error('Error booking consultation', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// RESCHEDULE
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.body;
    const updated = await consultationService.update(id, { start: new Date(start), end: new Date(end), status: 'PENDING' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to reschedule', error: err.message });
  }
});

// UPDATE status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, videoLink } = req.body;
    let link = videoLink;
    if (status === 'APPROVED' && !videoLink) {
      link = `https://meet.jit.si/afroasia-${id}`;
    }
    const updated = await consultationService.updateStatus(id, status, link);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update status', error: err.message });
  }
});

// Add note
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorId, text } = req.body;
    const note = await consultationService.addNote(id, authorId, text);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to add note', error: err.message });
  }
});

// history route
router.get('/history', async (req, res) => {
  try {
    const { providerId } = req.query;
    if (!providerId) return res.status(400).json({ msg: 'providerId required' });
    const list = await consultationService.listHistoryForProvider(providerId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// feedback submit
router.post('/:id/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ msg: 'rating required' });
    const fb = await consultationService.addFeedback(req.params.id, rating, comment);
    res.json(fb);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
