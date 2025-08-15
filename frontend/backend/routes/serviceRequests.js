const express = require('express');
const multer = require('multer');
const router = express.Router();

// store uploads in memory for now – swap to disk or cloud as needed
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/service-requests
router.post('/', upload.array('attachments'), async (req, res) => {
  try {
    // Extract common fields – others will also be present in req.body
    const {
      fullName,
      companyName,
      email,
      phone,
      country,
      services = [],
      otherService,
      description,
      startDate,
      urgency,
    } = req.body;

    console.log('[service-requests] New request from', fullName, 'services:', services);
    // TODO: Persist to DB or send email/notification to provider.

    return res.status(201).json({ msg: 'Service request received.' });
  } catch (err) {
    console.error('Error handling service request', err);
    return res.status(500).json({ msg: 'Failed to process request', error: err.message });
  }
});

module.exports = router;
