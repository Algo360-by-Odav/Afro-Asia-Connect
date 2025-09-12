const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const prisma = require('../prismaClient');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      presentations: ['ppt', 'pptx'],
      archives: ['zip', 'rar', '7z'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
    };
    
    this.initializeDirectories();
  }

  // Initialize upload directories
  async initializeDirectories() {
    try {
      const directories = [
        'profiles',
        'services',
        'messages',
        'documents',
        'portfolios',
        'temp'
      ];

      for (const dir of directories) {
        const dirPath = path.join(this.uploadDir, dir);
        try {
          await fs.access(dirPath);
        } catch {
          await fs.mkdir(dirPath, { recursive: true });
          console.log(`📁 Created directory: ${dir}`);
        }
      }

    } catch (error) {
      console.error('❌ Error initializing directories:', error);
    }
  }

  // Configure multer storage
  getMulterConfig(category = 'general') {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, category);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Max 10 files per upload
      },
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const isAllowed = Object.values(this.allowedTypes).flat().includes(ext);
        
        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new Error(`File type .${ext} is not allowed`), false);
        }
      }
    });
  }

  // Upload single file
  async uploadFile(file, userId, category = 'general', metadata = {}) {
    try {
      const fileHash = await this.generateFileHash(file.path);
      const fileSize = file.size;
      const mimeType = file.mimetype;
      const extension = path.extname(file.originalname).toLowerCase().slice(1);
      
      // Check file type category
      const fileTypeCategory = this.getFileTypeCategory(extension);
      
      // Create file record in database
      const fileRecord = await prisma.uploadedFile.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: fileSize,
          mimeType,
          extension,
          category: fileTypeCategory,
          uploadCategory: category,
          hash: fileHash,
          uploadedBy: parseInt(userId),
          metadata: JSON.stringify(metadata),
          isActive: true,
          createdAt: new Date()
        }
      });

      // Generate secure URL
      const secureUrl = this.generateSecureUrl(fileRecord.id, fileRecord.filename);

      console.log(`📁 File uploaded: ${file.originalname} by user ${userId}`);

      return {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        extension: fileRecord.extension,
        category: fileRecord.category,
        url: secureUrl,
        uploadedAt: fileRecord.createdAt,
        metadata: JSON.parse(fileRecord.metadata)
      };

    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('❌ Error cleaning up file:', unlinkError);
      }
      
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files, userId, category = 'general', metadata = {}) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file, userId, category, metadata)
      );
      
      const results = await Promise.allSettled(uploadPromises);
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            filename: files[index].originalname,
            error: result.reason.message
          });
        }
      });

      return {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      };

    } catch (error) {
      console.error('❌ Error uploading multiple files:', error);
      throw error;
    }
  }

  // Get file by ID
  async getFile(fileId, userId = null) {
    try {
      const file = await prisma.uploadedFile.findUnique({
        where: { id: parseInt(fileId) },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Check access permissions
      if (userId && file.uploadedBy !== parseInt(userId)) {
        // Check if file is shared or public
        const hasAccess = await this.checkFileAccess(fileId, userId);
        if (!hasAccess) {
          throw new Error('Access denied');
        }
      }

      return {
        ...file,
        metadata: JSON.parse(file.metadata || '{}'),
        url: this.generateSecureUrl(file.id, file.filename)
      };

    } catch (error) {
      console.error('❌ Error getting file:', error);
      throw error;
    }
  }

  // Get user files
  async getUserFiles(userId, { category = null, page = 1, limit = 20, sortBy = 'newest' } = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = {
        uploadedBy: parseInt(userId),
        isActive: true
      };

      if (category) {
        whereClause.uploadCategory = category;
      }

      let orderBy = [];
      switch (sortBy) {
        case 'name':
          orderBy = [{ originalName: 'asc' }];
          break;
        case 'size':
          orderBy = [{ size: 'desc' }];
          break;
        case 'type':
          orderBy = [{ extension: 'asc' }];
          break;
        default: // newest
          orderBy = [{ createdAt: 'desc' }];
      }

      const files = await prisma.uploadedFile.findMany({
        where: whereClause,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          originalName: true,
          filename: true,
          size: true,
          mimeType: true,
          extension: true,
          category: true,
          uploadCategory: true,
          metadata: true,
          createdAt: true
        }
      });

      const totalCount = await prisma.uploadedFile.count({
        where: whereClause
      });

      const filesWithUrls = files.map(file => ({
        ...file,
        metadata: JSON.parse(file.metadata || '{}'),
        url: this.generateSecureUrl(file.id, file.filename)
      }));

      return {
        files: filesWithUrls,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error getting user files:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId, userId) {
    try {
      const file = await prisma.uploadedFile.findUnique({
        where: { id: parseInt(fileId) }
      });

      if (!file) {
        throw new Error('File not found');
      }

      if (file.uploadedBy !== parseInt(userId)) {
        throw new Error('Access denied');
      }

      // Mark as inactive instead of deleting
      await prisma.uploadedFile.update({
        where: { id: parseInt(fileId) },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      // Optionally delete physical file after some time
      // For now, keep the file for recovery purposes

      console.log(`🗑️ File deleted: ${file.originalName} by user ${userId}`);
      return { success: true, message: 'File deleted successfully' };

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  // Share file with users
  async shareFile(fileId, userId, shareWithUserIds, permissions = ['view']) {
    try {
      const file = await prisma.uploadedFile.findUnique({
        where: { id: parseInt(fileId) }
      });

      if (!file || file.uploadedBy !== parseInt(userId)) {
        throw new Error('File not found or access denied');
      }

      const sharePromises = shareWithUserIds.map(shareUserId => 
        prisma.fileShare.create({
          data: {
            fileId: parseInt(fileId),
            sharedBy: parseInt(userId),
            sharedWith: parseInt(shareUserId),
            permissions: JSON.stringify(permissions),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: new Date()
          }
        })
      );

      await Promise.all(sharePromises);

      console.log(`📤 File shared: ${file.originalName} with ${shareWithUserIds.length} users`);
      return { success: true, message: 'File shared successfully' };

    } catch (error) {
      console.error('❌ Error sharing file:', error);
      throw error;
    }
  }

  // Get file analytics
  async getFileAnalytics(userId) {
    try {
      const stats = await prisma.uploadedFile.aggregate({
        where: {
          uploadedBy: parseInt(userId),
          isActive: true
        },
        _count: { id: true },
        _sum: { size: true }
      });

      // Get files by category
      const categoryStats = await prisma.uploadedFile.groupBy({
        by: ['category'],
        where: {
          uploadedBy: parseInt(userId),
          isActive: true
        },
        _count: { category: true },
        _sum: { size: true }
      });

      // Get recent uploads
      const recentUploads = await prisma.uploadedFile.findMany({
        where: {
          uploadedBy: parseInt(userId),
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          originalName: true,
          size: true,
          category: true,
          createdAt: true
        }
      });

      return {
        totalFiles: stats._count.id || 0,
        totalSize: stats._sum.size || 0,
        categoryBreakdown: categoryStats.map(cat => ({
          category: cat.category,
          count: cat._count.category,
          size: cat._sum.size
        })),
        recentUploads
      };

    } catch (error) {
      console.error('❌ Error getting file analytics:', error);
      throw error;
    }
  }

  // Helper methods
  async generateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.error('❌ Error generating file hash:', error);
      return null;
    }
  }

  getFileTypeCategory(extension) {
    for (const [category, extensions] of Object.entries(this.allowedTypes)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }
    return 'other';
  }

  generateSecureUrl(fileId, filename) {
    // Generate a secure URL that includes file ID for access control
    return `/api/files/download/${fileId}/${filename}`;
  }

  async checkFileAccess(fileId, userId) {
    try {
      // Check if file is shared with user
      const share = await prisma.fileShare.findFirst({
        where: {
          fileId: parseInt(fileId),
          sharedWith: parseInt(userId),
          expiresAt: {
            gt: new Date()
          }
        }
      });

      return !!share;

    } catch (error) {
      console.error('❌ Error checking file access:', error);
      return false;
    }
  }

  // Clean up old temporary files
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`🧹 Cleaned up temp file: ${file}`);
        }
      }

    } catch (error) {
      console.error('❌ Error cleaning up temp files:', error);
    }
  }

  // Get file stream for download
  async getFileStream(fileId, userId = null) {
    try {
      const file = await this.getFile(fileId, userId);
      
      // Check if file exists on disk
      try {
        await fs.access(file.path);
      } catch {
        throw new Error('File not found on disk');
      }

      return {
        stream: require('fs').createReadStream(file.path),
        filename: file.originalName,
        mimeType: file.mimeType,
        size: file.size
      };

    } catch (error) {
      console.error('❌ Error getting file stream:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();
