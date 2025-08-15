const express = require('express');
const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // TODO: Integrate with email service (e.g., nodemailer, SendGrid) or store in DB.
    console.log('Contact form submission:', { name, email, subject, message });

    return res.status(200).json({ msg: 'Message received. Thank you for reaching out!' });
  } catch (err) {
    console.error('Error handling contact form:', err);
    return res.status(500).json({ msg: 'Server error while sending message.' });
  }
});

module.exports = router;
