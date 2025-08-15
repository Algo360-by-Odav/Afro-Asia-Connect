const prisma = require('../prismaClient');
const messagingService = require('./messagingService');

// Create scheduled message
async function createScheduledMessage(senderId, conversationId, content, scheduledFor, messageType = 'TEXT', fileUrl = null, fileName = null) {
  return prisma.scheduledMessage.create({
    data: {
      senderId: Number(senderId),
      conversationId: Number(conversationId),
      content,
      messageType,
      fileUrl,
      fileName,
      scheduledFor: new Date(scheduledFor),
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      conversation: {
        include: {
          participants: { 
            select: { id: true, firstName: true, lastName: true },
            where: { id: { not: Number(senderId) } }
          }
        }
      }
    }
  });
}

// Get user's scheduled messages
async function getUserScheduledMessages(userId, status = null) {
  return prisma.scheduledMessage.findMany({
    where: {
      senderId: Number(userId),
      ...(status ? { status } : {}),
    },
    include: {
      conversation: {
        include: {
          participants: { 
            select: { id: true, firstName: true, lastName: true },
            where: { id: { not: Number(userId) } }
          }
        }
      }
    },
    orderBy: { scheduledFor: 'asc' }
  });
}

// Get pending messages ready to send
async function getPendingMessages() {
  return prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: {
        lte: new Date()
      }
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      conversation: true
    }
  });
}

// Send scheduled message
async function sendScheduledMessage(scheduledMessageId) {
  const scheduledMessage = await prisma.scheduledMessage.findUnique({
    where: { id: Number(scheduledMessageId) },
    include: {
      sender: true,
      conversation: true
    }
  });

  if (!scheduledMessage || scheduledMessage.status !== 'PENDING') {
    throw new Error('Scheduled message not found or already processed');
  }

  try {
    // Send the actual message
    const message = await messagingService.sendMessage(
      scheduledMessage.conversationId,
      scheduledMessage.senderId,
      scheduledMessage.content,
      scheduledMessage.messageType,
      scheduledMessage.fileUrl,
      scheduledMessage.fileName
    );

    // Update scheduled message status
    await prisma.scheduledMessage.update({
      where: { id: Number(scheduledMessageId) },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    return { message, scheduledMessage };
  } catch (error) {
    // Mark as failed
    await prisma.scheduledMessage.update({
      where: { id: Number(scheduledMessageId) },
      data: { status: 'FAILED' }
    });
    
    throw error;
  }
}

// Cancel scheduled message
async function cancelScheduledMessage(scheduledMessageId, userId) {
  return prisma.scheduledMessage.update({
    where: {
      id: Number(scheduledMessageId),
      senderId: Number(userId), // Ensure user owns the message
      status: 'PENDING' // Can only cancel pending messages
    },
    data: {
      status: 'CANCELLED'
    }
  });
}

// Update scheduled message
async function updateScheduledMessage(scheduledMessageId, userId, updates) {
  const allowedUpdates = {};
  if (updates.content !== undefined) allowedUpdates.content = updates.content;
  if (updates.scheduledFor !== undefined) allowedUpdates.scheduledFor = new Date(updates.scheduledFor);
  
  return prisma.scheduledMessage.update({
    where: {
      id: Number(scheduledMessageId),
      senderId: Number(userId),
      status: 'PENDING' // Can only update pending messages
    },
    data: allowedUpdates
  });
}

module.exports = {
  createScheduledMessage,
  getUserScheduledMessages,
  getPendingMessages,
  sendScheduledMessage,
  cancelScheduledMessage,
  updateScheduledMessage,
};
