const express = require('express');
const path = require('path');
const { upload, getPublicUrl } = require('../services/fileUpload');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Serve uploaded files statically
// (ensure server.js uses this router before path so express.static works)
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// POST /api/upload - authenticated users only
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  const url = getPublicUrl(req.file.filename);
  res.status(201).json({ url });
});

// POST /api/upload/logo - logo upload for listings
router.post('/logo', auth, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No logo file uploaded' });
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ msg: 'Invalid file type. Please upload an image file.' });
  }
  
  const url = getPublicUrl(req.file.filename);
  res.status(201).json({ url, filename: req.file.filename });
});

module.exports = router;
