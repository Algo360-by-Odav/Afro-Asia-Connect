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

// Send a message (simplified version without security features)
async function sendMessage(conversationId, senderId, content, messageType = 'TEXT', fileUrl = null, fileName = null, ipAddress = null, userAgent = null) {
  try {
    // Create the message directly
    const message = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: Number(senderId),
        content: content,
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

// Mark messages as read
async function markMessagesAsRead(conversationId, userId) {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: Number(userId) },
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

module.exports = {
  getOrCreateConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  markMessagesAsRead
};
