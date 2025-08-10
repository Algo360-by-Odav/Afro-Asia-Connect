const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentService = require('../services/documentService');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// list documents
router.get('/', async (req, res) => {
  try {
    const { ownerId, category, q } = req.query;
    if (!ownerId) return res.status(400).json({ msg: 'ownerId required' });
    const docs = await documentService.list(ownerId, { category, q });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// replace document (new version)
router.post('/:id/replace', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, title, expiry } = req.body;
    if (!ownerId || !req.file) return res.status(400).json({ msg: 'ownerId & file required' });
    
    const newDoc = await documentService.replaceDocument(ownerId, id, {
      title,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      expiry,
    });
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// get version history
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ msg: 'ownerId required' });
    
    const versions = await documentService.getVersionHistory(ownerId, id);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

// upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { ownerId, title, category, expiry, visibility } = req.body;
    if (!ownerId || !req.file) return res.status(400).json({ msg: 'ownerId & file required' });
    const doc = await documentService.create(ownerId, {
      title: title || req.file.originalname,
      category,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      expiry: expiry ? new Date(expiry) : null,
      visibility: visibility || 'PRIVATE',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
