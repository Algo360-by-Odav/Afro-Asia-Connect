const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RealTimeNotificationService = require('../services/realTimeNotificationService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/messages/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, and archives are allowed!'));
    }
  }
});

// Get conversations for user with advanced features
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, search, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      participants: {
        some: { userId: userId }
      },
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { participants: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } }
                ]
              }
            }
          }}
        ]
      }),
      ...(unreadOnly === 'true' && {
        messages: {
          some: {
            senderId: { not: userId },
            readBy: { none: { userId: userId } }
          }
        }
      })
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true }
              },
              readBy: true
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: userId },
                  readBy: { none: { userId: userId } }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.conversation.count({ where: whereClause })
    ]);

    const formattedConversations = conversations.map(conv => {
      const otherParticipants = conv.participants.filter(p => p.userId !== userId);
      const lastMessage = conv.messages[0];
      
      return {
        id: conv.id,
        title: conv.title,
        type: conv.type,
        participants: otherParticipants.map(p => p.user),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.readBy.some(r => r.userId === userId)
        } : null,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Create or get conversation
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantIds, title, type = 'direct' } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'participantIds array is required'
      });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([userId, ...participantIds])];

    // For direct conversations, check if one already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'direct',
          participants: {
            every: {
              userId: { in: allParticipants }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        return res.json({
          success: true,
          conversation: existingConversation
        });
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: title || (type === 'direct' ? null : 'Group Chat'),
        type,
        participants: {
          create: allParticipants.map(participantId => ({
            userId: participantId,
            role: participantId === userId ? 'admin' : 'member'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// Get messages for conversation with advanced features
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { page = 1, limit = 50, search, messageType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: {
          some: { userId: userId }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
    }

    const whereClause = {
      conversationId: parseInt(id),
      ...(search && {
        content: { contains: search, mode: 'insensitive' }
      }),
      ...(messageType && { type: messageType })
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          readBy: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.message.count({ where: whereClause })
    ]);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== userId && !msg.readBy.some(r => r.userId === userId)
    );

    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map(msg => ({
          messageId: msg.id,
          userId: userId,
          readAt: new Date()
        })),
        skipDuplicates: true
      });
    }

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message with advanced features
router.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, type = 'text', replyToId, metadata } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: {
          some: { userId: userId }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: userId,
        content: content.trim(),
        type,
        ...(replyToId && { replyToId: parseInt(replyToId) }),
        ...(metadata && { metadata: JSON.stringify(metadata) })
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    // Update conversation's last activity
    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { updatedAt: new Date() }
    });

    // TODO: Emit socket event for real-time updates
    // io.to(`conversation_${id}`).emit('new_message', message);

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Upload file for message
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/messages/${req.file.filename}`;
    const fileInfo = {
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// Search messages across conversations
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, conversationId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const whereClause = {
      content: { contains: q.trim(), mode: 'insensitive' },
      conversation: {
        participants: {
          some: { userId: userId }
        }
      },
      ...(conversationId && { conversationId: parseInt(conversationId) })
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          conversation: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.message.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId: parseInt(messageId),
        userId: userId,
        emoji: emoji
      }
    });

    if (existingReaction) {
      // Remove reaction if it exists
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });
      
      res.json({
        success: true,
        action: 'removed'
      });
    } else {
      // Add new reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId: parseInt(messageId),
          userId: userId,
          emoji: emoji
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      res.json({
        success: true,
        action: 'added',
        reaction
      });
    }
  } catch (error) {
    console.error('Error managing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage reaction'
    });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    
    // Get unread messages in the conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: parseInt(conversationId),
        senderId: { not: userId },
        readBy: {
          none: { userId: userId }
        }
      },
      select: { id: true }
    });

    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map(msg => ({
          messageId: msg.id,
          userId: userId,
          readAt: new Date()
        })),
        skipDuplicates: true
      });
    }

    res.json({ 
      success: true,
      markedAsRead: unreadMessages.length
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// Delete message
router.delete('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to delete it'
      });
    }

    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        content: 'This message was deleted',
        type: 'deleted',
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Get conversation participants
router.get('/conversations/:id/participants', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: {
          some: { userId: userId }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
    }

    res.json({
      success: true,
      participants: conversation.participants.map(p => ({
        ...p.user,
        role: p.role,
        joinedAt: p.joinedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants'
    });
  }
});

module.exports = router;
