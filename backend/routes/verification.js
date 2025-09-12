const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `verification-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// Get verification status for current user
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get latest verification request
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: { companyId: user.company.id },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true
      }
    });

    if (!verificationRequest) {
      return res.status(404).json({ error: 'No verification request found' });
    }

    res.json(verificationRequest);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit verification request
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documents } = req.body;

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if there's already a pending verification request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        companyId: user.company.id,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'A verification request is already pending' });
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        companyId: user.company.id,
        status: 'PENDING',
        documents: documents || [],
        submittedAt: new Date()
      }
    });

    res.json({
      message: 'Verification request submitted successfully',
      requestId: verificationRequest.id
    });
  } catch (error) {
    console.error('Error submitting verification request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload verification document
router.post('/upload-document', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: title || req.file.originalname,
        filename: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: category || 'GENERAL_BUSINESS',
        companyId: user.company.id,
        uploadedById: userId,
        status: 'ACTIVE'
      }
    });

    res.json({
      id: document.id,
      filename: document.filename,
      title: document.title,
      category: document.category
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all verification requests (Admin only)
router.get('/admin/requests', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const verificationRequests = await prisma.verificationRequest.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        documents: true
      }
    });

    const total = await prisma.verificationRequest.count({ where });

    res.json({
      requests: verificationRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update verification request status (Admin only)
router.put('/admin/requests/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const verificationRequest = await prisma.verificationRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedById: req.user.id
      },
      include: {
        company: {
          include: {
            user: true,
            businessListings: true
          }
        }
      }
    });

    // If approved, update all company listings to verified
    if (status === 'APPROVED') {
      await prisma.businessListing.updateMany({
        where: { companyId: verificationRequest.companyId },
        data: { isVerified: true }
      });
    }

    res.json({
      message: 'Verification request updated successfully',
      request: verificationRequest
    });
  } catch (error) {
    console.error('Error updating verification request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get verification statistics (Admin only)
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await prisma.verificationRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalRequests = await prisma.verificationRequest.count();
    const verifiedCompanies = await prisma.businessListing.count({
      where: { isVerified: true }
    });

    const recentRequests = await prisma.verificationRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      stats: stats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status;
        return acc;
      }, {}),
      totalRequests,
      verifiedCompanies,
      recentRequests
    });
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
