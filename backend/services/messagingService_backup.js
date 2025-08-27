const prisma = require('../prismaClient');

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
    // Simplified message sending without DLP/security for now
    const finalContent = content;

    // Create the message directly without encryption/security for now
    const message = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: Number(senderId),
        content: finalContent,
        messageType,
        fileUrl,
        fileName,
        isRead: false
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        conversation: {
          include: {
            participants: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    // Update conversation's last message and timestamp
    await prisma.conversation.update({
      where: { id: Number(conversationId) },
      data: {
        updatedAt: new Date(),
        lastMessageId: message.id
      }
    });

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get conversation messages with pagination
async function getConversationMessages(conversationId, userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await prisma.message.findMany({
    where: {
      conversationId: Number(conversationId),
      conversation: {
        participants: {
          some: { id: Number(userId) }
        }
      }
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: parseInt(limit)
  });

  return messages.reverse(); // Return in chronological order
}

// Get user conversations
async function getUserConversations(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { id: Number(userId) }
      }
    },
    include: {
      participants: {
        select: { id: true, firstName: true, lastName: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: parseInt(limit)
  });

  return conversations;
}

module.exports = {
  getOrCreateConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations
};
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
