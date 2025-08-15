const prisma = require('../prismaClient');
const analyticsService = require('./analyticsService');
const encryptionService = require('./encryptionService');
const dlpService = require('./dlpService');
const securityAuditService = require('./securityAuditService');
const automationService = require('./automationService');

// Create or get existing conversation between users
async function getOrCreateConversation(userId1, userId2, serviceRequestId = null, consultationId = null) {
  // Check if conversation already exists between these users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: {
        every: {
          id: { in: [Number(userId1), Number(userId2)] }
        }
      },
      serviceRequestId: serviceRequestId ? Number(serviceRequestId) : null,
      consultationId: consultationId ? Number(consultationId) : null,
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true, email: true } },
      lastMessage: true,
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        connect: [{ id: Number(userId1) }, { id: Number(userId2) }]
      },
      serviceRequestId: serviceRequestId ? Number(serviceRequestId) : null,
      consultationId: consultationId ? Number(consultationId) : null,
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true, email: true } },
      lastMessage: true,
    }
  });

  return conversation;
}

// Create group conversation
async function createGroupConversation(creatorId, title, description, participantIds) {
  const allParticipants = [Number(creatorId), ...participantIds.map(id => Number(id))];
  
  const groupConversation = await prisma.conversation.create({
    data: {
      title,
      description,
      isGroup: true,
      createdById: Number(creatorId),
      participants: {
        connect: allParticipants.map(id => ({ id }))
      }
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      lastMessage: true
    }
  });

  return groupConversation;
}

// Add participants to group conversation
async function addParticipantsToGroup(conversationId, participantIds, requesterId) {
  // Verify the conversation is a group and requester is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: Number(conversationId),
      isGroup: true,
      participants: {
        some: { id: Number(requesterId) }
      }
    },
    include: {
      participants: { select: { id: true } }
    }
  });

  if (!conversation) {
    throw new Error('Group conversation not found or access denied');
  }

  // Filter out participants who are already in the group
  const existingParticipantIds = conversation.participants.map(p => p.id);
  const newParticipantIds = participantIds
    .map(id => Number(id))
    .filter(id => !existingParticipantIds.includes(id));

  if (newParticipantIds.length === 0) {
    return conversation;
  }

  // Add new participants
  const updatedConversation = await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: {
      participants: {
        connect: newParticipantIds.map(id => ({ id }))
      }
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      lastMessage: true
    }
  });

  return updatedConversation;
}

// Remove participant from group conversation
async function removeParticipantFromGroup(conversationId, participantId, requesterId) {
  // Verify the conversation is a group and requester is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: Number(conversationId),
      isGroup: true,
      participants: {
        some: { id: Number(requesterId) }
      }
    },
    include: {
      createdBy: { select: { id: true } }
    }
  });

  if (!conversation) {
    throw new Error('Group conversation not found or access denied');
  }

  // Only group creator or the participant themselves can remove
  if (conversation.createdBy?.id !== Number(requesterId) && Number(participantId) !== Number(requesterId)) {
    throw new Error('Only group creator or the participant can remove from group');
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: {
      participants: {
        disconnect: { id: Number(participantId) }
      }
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      lastMessage: true
    }
  });

  return updatedConversation;
}

// Update group conversation details
async function updateGroupConversation(conversationId, updates, requesterId) {
  // Verify the conversation is a group and requester is the creator
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: Number(conversationId),
      isGroup: true,
      createdById: Number(requesterId)
    }
  });

  if (!conversation) {
    throw new Error('Group conversation not found or access denied');
  }

  const allowedUpdates = {};
  if (updates.title !== undefined) allowedUpdates.title = updates.title;
  if (updates.description !== undefined) allowedUpdates.description = updates.description;

  const updatedConversation = await prisma.conversation.update({
    where: { id: Number(conversationId) },
    data: allowedUpdates,
    include: {
      participants: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      lastMessage: true
    }
  });

  return updatedConversation;
}

// Send a message with security features
async function sendMessage(conversationId, senderId, content, messageType = 'TEXT', fileUrl = null, fileName = null, ipAddress = null, userAgent = null) {
  try {
    // Step 1: DLP Content Scanning
    const dlpScanResult = await dlpService.scanMessageContent(content, senderId, conversationId);
    
    // Log DLP scan attempt
    await securityAuditService.logAuditEvent({
      userId: senderId,
      eventType: 'message_sent',
      resourceType: 'message',
      resourceId: conversationId,
      action: 'DLP_CONTENT_SCAN',
      riskLevel: dlpScanResult.violations.length > 0 ? 'medium' : 'low',
      ipAddress,
      userAgent,
      metadata: {
        violationsCount: dlpScanResult.violations.length,
        detectedPatterns: dlpScanResult.detectedPatterns.length,
        contentLength: content.length
      }
    });

    // Block message if high-risk violations found
    if (!dlpScanResult.allowed) {
      throw new Error('Message blocked due to security policy violations');
    }

    // Use sanitized content if DLP found issues
    const finalContent = dlpScanResult.sanitizedContent || content;

    // Step 2: Get or create conversation encryption key
    let conversationKey = await encryptionService.getConversationKey(conversationId);
    if (!conversationKey) {
      conversationKey = await encryptionService.createConversationKey(conversationId);
      
      // Log key generation
      await securityAuditService.logAuditEvent({
        userId: senderId,
        eventType: 'encryption_key_generation',
        resourceType: 'conversation',
        resourceId: conversationId,
        action: 'GENERATE_CONVERSATION_KEY',
        riskLevel: 'low',
        ipAddress,
        userAgent,
        metadata: {
          keyVersion: conversationKey.version
        }
      });
    }

    // Step 3: Encrypt message content
    const encryptedData = await encryptionService.encryptMessage(finalContent, conversationKey.key);

    // Step 4: Create message record
    const message = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: Number(senderId),
        content: finalContent, // Store sanitized plaintext for search/display
        messageType,
        fileUrl,
        fileName,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    // Step 5: Store encrypted version
    await prisma.encryptedMessage.create({
      data: {
        messageId: message.id,
        encryptedContent: encryptedData.encryptedContent,
        iv: encryptedData.iv,
        tag: encryptedData.tag,
        aad: encryptedData.aad,
        fingerprint: encryptedData.fingerprint,
        keyVersion: conversationKey.version
      }
    });

    // Step 6: Update conversation's last message
    await prisma.conversation.update({
      where: { id: Number(conversationId) },
      data: { 
        lastMessageId: message.id,
        updatedAt: new Date(),
      }
    });

    // Step 7: Update analytics
    await analyticsService.updateMessageAnalytics(
      senderId, 
      conversationId, 
      messageType, 
      false, // isTemplate
      false  // isScheduled
    );

    // Step 8: Log successful message send
    await securityAuditService.logAuditEvent({
      userId: senderId,
      eventType: 'message_sent',
      resourceType: 'message',
      resourceId: message.id,
      action: 'SEND_MESSAGE_SUCCESS',
      riskLevel: 'low',
      ipAddress,
      userAgent,
      metadata: {
        conversationId,
        messageType,
        encrypted: true,
        dlpViolations: dlpScanResult.violations.length
      }
    });

    // Step 9: Process automation triggers
    try {
      await automationService.processIncomingMessage({
        messageId: message.id,
        conversationId: Number(conversationId),
        senderId: Number(senderId),
        content: finalContent,
        messageType,
        timestamp: new Date()
      });
    } catch (automationError) {
      // Log automation error but don't fail the message send
      console.error('Automation processing failed:', automationError);
      await securityAuditService.logAuditEvent({
        userId: senderId,
        eventType: 'automation_error',
        resourceType: 'message',
        resourceId: message.id,
        action: 'AUTOMATION_PROCESSING_FAILED',
        riskLevel: 'medium',
        ipAddress,
        userAgent,
        success: false,
        errorMessage: automationError.message
      });
    }

    return {
      ...message,
      dlpScanResult: {
        violations: dlpScanResult.violations,
        sanitized: dlpScanResult.sanitizedContent !== content
      }
    };

  } catch (error) {
    // Log failed message send
    await securityAuditService.logAuditEvent({
      userId: senderId,
      eventType: 'message_sent',
      resourceType: 'message',
      resourceId: conversationId,
      action: 'SEND_MESSAGE_FAILED',
      riskLevel: 'high',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: error.message,
      metadata: {
        conversationId,
        messageType,
        contentLength: content?.length || 0
      }
    });

    throw error;
  }
}

// Get messages for a conversation
async function getConversationMessages(conversationId, limit = 50, offset = 0) {
  return prisma.message.findMany({
    where: { conversationId: Number(conversationId) },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// Get conversations for a user
async function getUserConversations(userId) {
  return prisma.conversation.findMany({
    where: {
      participants: {
        some: { id: Number(userId) }
      }
    },
    include: {
      participants: { select: { id: true, firstName: true, lastName: true, email: true } },
      lastMessage: {
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } }
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: Number(userId) }
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// Search messages across all conversations for a user
async function searchMessages(userId, query, limit = 50) {
  return prisma.message.findMany({
    where: {
      AND: [
        {
          conversation: {
            participants: {
              some: { id: Number(userId) }
            }
          }
        },
        {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { fileName: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      conversation: {
        include: {
          participants: { 
            select: { id: true, firstName: true, lastName: true },
            where: { id: { not: Number(userId) } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

// Mark messages as read
async function markMessagesAsRead(conversationId, userId) {
  return prisma.message.updateMany({
    where: {
      conversationId: Number(conversationId),
      senderId: { not: Number(userId) },
      isRead: false,
    },
    data: { isRead: true }
  });
}

module.exports = {
  getOrCreateConversation,
  createGroupConversation,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  updateGroupConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  searchMessages,
  markMessagesAsRead,
};
