const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp_random_original.ext
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${base}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * Returns the public URL for a stored file.
 * In production, you should serve /uploads as static.
 */
function getPublicUrl(filename) {
  return `/uploads/${filename}`;
}

module.exports = {
  upload,
  getPublicUrl,
};
