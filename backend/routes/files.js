const express = require('express');
const router = express.Router();
const fileUploadService = require('../services/fileUploadService');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/files/upload/:category
// @desc    Upload single or multiple files
// @access  Private
router.post('/upload/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.id;
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    // Configure multer for this category
    const upload = fileUploadService.getMulterConfig(category);
    
    // Handle multiple files
    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          msg: 'File upload error',
          error: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          msg: 'No files uploaded'
        });
      }

      try {
        let result;
        
        if (req.files.length === 1) {
          // Single file upload
          result = await fileUploadService.uploadFile(req.files[0], userId, category, metadata);
        } else {
          // Multiple files upload
          result = await fileUploadService.uploadMultipleFiles(req.files, userId, category, metadata);
        }

        res.json({
          success: true,
          msg: 'Files uploaded successfully',
          data: result
        });

      } catch (uploadError) {
        console.error('❌ Upload processing error:', uploadError);
        res.status(500).json({
          success: false,
          msg: 'Error processing uploaded files',
          error: uploadError.message
        });
      }
    });

  } catch (error) {
    console.error('❌ File upload route error:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error during file upload',
      error: error.message
    });
  }
});

// @route   GET /api/files
// @desc    Get user's files with pagination and filtering
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, page, limit, sortBy } = req.query;

    const options = {
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'newest'
    };

    const result = await fileUploadService.getUserFiles(userId, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error getting user files:', error);
    res.status(500).json({
      success: false,
      msg: 'Error retrieving files',
      error: error.message
    });
  }
});

// @route   GET /api/files/:fileId
// @desc    Get file details
// @access  Private
router.get('/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await fileUploadService.getFile(fileId, userId);

    res.json({
      success: true,
      file
    });

  } catch (error) {
    console.error('❌ Error getting file:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      msg: error.message
    });
  }
});

// @route   GET /api/files/download/:fileId/:filename
// @desc    Download file
// @access  Private
router.get('/download/:fileId/:filename', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const { stream, filename, mimeType, size } = await fileUploadService.getFileStream(fileId, userId);

    // Set headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe file stream to response
    stream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading file:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      msg: error.message
    });
  }
});

// @route   DELETE /api/files/:fileId
// @desc    Delete file
// @access  Private
router.delete('/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const result = await fileUploadService.deleteFile(fileId, userId);

    res.json({
      success: true,
      msg: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting file:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      msg: error.message
    });
  }
});

// @route   POST /api/files/:fileId/share
// @desc    Share file with other users
// @access  Private
router.post('/:fileId/share', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { userIds, permissions = ['view'] } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'User IDs array is required'
      });
    }

    const result = await fileUploadService.shareFile(fileId, userId, userIds, permissions);

    res.json({
      success: true,
      msg: `File shared with ${userIds.length} users`
    });

  } catch (error) {
    console.error('❌ Error sharing file:', error);
    res.status(500).json({
      success: false,
      msg: 'Error sharing file',
      error: error.message
    });
  }
});

// @route   GET /api/files/analytics/overview
// @desc    Get file analytics for user
// @access  Private
router.get('/analytics/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const analytics = await fileUploadService.getFileAnalytics(userId);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Error getting file analytics:', error);
    res.status(500).json({
      success: false,
      msg: 'Error retrieving file analytics',
      error: error.message
    });
  }
});

// @route   POST /api/files/cleanup/temp
// @desc    Clean up temporary files (admin only)
// @access  Private
router.post('/cleanup/temp', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: 'Access denied. Admin privileges required.'
      });
    }

    await fileUploadService.cleanupTempFiles();

    res.json({
      success: true,
      msg: 'Temporary files cleaned up successfully'
    });

  } catch (error) {
    console.error('❌ Error cleaning up temp files:', error);
    res.status(500).json({
      success: false,
      msg: 'Error cleaning up temporary files',
      error: error.message
    });
  }
});

// @route   GET /api/files/types/allowed
// @desc    Get allowed file types
// @access  Public
router.get('/types/allowed', async (req, res) => {
  try {
    const allowedTypes = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      presentations: ['ppt', 'pptx'],
      archives: ['zip', 'rar', '7z'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
    };

    res.json({
      success: true,
      allowedTypes,
      maxFileSize: '50MB',
      maxFiles: 10
    });

  } catch (error) {
    console.error('❌ Error getting allowed types:', error);
    res.status(500).json({
      success: false,
      msg: 'Error retrieving allowed file types'
    });
  }
});

module.exports = router;
