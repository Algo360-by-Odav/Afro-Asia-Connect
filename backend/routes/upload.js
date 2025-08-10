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

module.exports = router;
