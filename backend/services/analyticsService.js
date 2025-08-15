const prisma = require('../prismaClient');

// Update analytics when a message is sent
async function updateMessageAnalytics(senderId, conversationId, messageType = 'TEXT', isTemplate = false, isScheduled = false) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Get or create analytics record for today
    const analytics = await prisma.messageAnalytics.upsert({
      where: {
        userId_conversationId_date: {
          userId: Number(senderId),
          conversationId: Number(conversationId),
          date: today
        }
      },
      update: {
        totalMessages: { increment: 1 },
        messagesSent: { increment: 1 },
        ...(messageType === 'FILE' ? { filesShared: { increment: 1 } } : {}),
        ...(isTemplate ? { templatesUsed: { increment: 1 } } : {}),
        ...(isScheduled ? { scheduledMessages: { increment: 1 } } : {}),
      },
      create: {
        userId: Number(senderId),
        conversationId: Number(conversationId),
        date: today,
        totalMessages: 1,
        messagesSent: 1,
        messagesReceived: 0,
        filesShared: messageType === 'FILE' ? 1 : 0,
        templatesUsed: isTemplate ? 1 : 0,
        scheduledMessages: isScheduled ? 1 : 0,
      }
    });

    // Calculate response time for other participants
    await updateResponseTimeForParticipants(conversationId, senderId);
    
    return analytics;
  } catch (error) {
    console.error('Error updating message analytics:', error);
  }
}

// Update response time analytics when receiving a message
async function updateResponseTimeForParticipants(conversationId, senderId) {
  try {
    // Get conversation participants (excluding sender)
    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: {
        participants: {
          where: { id: { not: Number(senderId) } }
        }
      }
    });

    if (!conversation) return;

    // Get the last message from each participant to calculate response time
    for (const participant of conversation.participants) {
      const lastMessage = await prisma.message.findFirst({
        where: {
          conversationId: Number(conversationId),
          senderId: participant.id
        },
        orderBy: { createdAt: 'desc' }
      });

      if (lastMessage) {
        const responseTime = Math.floor((new Date() - new Date(lastMessage.createdAt)) / (1000 * 60)); // in minutes
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update analytics for the participant
        await prisma.messageAnalytics.upsert({
          where: {
            userId_conversationId_date: {
              userId: participant.id,
              conversationId: Number(conversationId),
              date: today
            }
          },
          update: {
            messagesReceived: { increment: 1 },
            totalMessages: { increment: 1 },
            averageResponseTime: responseTime < 1440 ? responseTime : null // Only track if < 24 hours
          },
          create: {
            userId: participant.id,
            conversationId: Number(conversationId),
            date: today,
            totalMessages: 1,
            messagesSent: 0,
            messagesReceived: 1,
            averageResponseTime: responseTime < 1440 ? responseTime : null
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating response time analytics:', error);
  }
}

// Get user analytics for a specific period
async function getUserAnalytics(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  try {
    const analytics = await prisma.messageAnalytics.findMany({
      where: {
        userId: Number(userId),
        date: { gte: startDate }
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            isGroup: true,
            participants: {
              select: { id: true, firstName: true, lastName: true },
              where: { id: { not: Number(userId) } }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalMessages: analytics.reduce((sum, a) => sum + a.totalMessages, 0),
      messagesSent: analytics.reduce((sum, a) => sum + a.messagesSent, 0),
      messagesReceived: analytics.reduce((sum, a) => sum + a.messagesReceived, 0),
      templatesUsed: analytics.reduce((sum, a) => sum + a.templatesUsed, 0),
      scheduledMessages: analytics.reduce((sum, a) => sum + a.scheduledMessages, 0),
      filesShared: analytics.reduce((sum, a) => sum + a.filesShared, 0),
      averageResponseTime: calculateAverageResponseTime(analytics),
      activeConversations: new Set(analytics.map(a => a.conversationId)).size,
      mostActiveDay: getMostActiveDay(analytics),
      engagementScore: calculateEngagementScore(analytics)
    };

    return {
      summary,
      dailyAnalytics: analytics,
      period: { days, startDate, endDate: new Date() }
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
}

// Get conversation analytics
async function getConversationAnalytics(conversationId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  try {
    const analytics = await prisma.messageAnalytics.findMany({
      where: {
        conversationId: Number(conversationId),
        date: { gte: startDate }
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const participantStats = {};
    analytics.forEach(a => {
      if (!participantStats[a.userId]) {
        participantStats[a.userId] = {
          user: a.user,
          totalMessages: 0,
          messagesSent: 0,
          messagesReceived: 0,
          templatesUsed: 0,
          filesShared: 0,
          averageResponseTime: null
        };
      }
      
      const stats = participantStats[a.userId];
      stats.totalMessages += a.totalMessages;
      stats.messagesSent += a.messagesSent;
      stats.messagesReceived += a.messagesReceived;
      stats.templatesUsed += a.templatesUsed;
      stats.filesShared += a.filesShared;
      
      if (a.averageResponseTime) {
        stats.averageResponseTime = a.averageResponseTime;
      }
    });

    return {
      participantStats: Object.values(participantStats),
      dailyAnalytics: analytics,
      period: { days, startDate, endDate: new Date() }
    };
  } catch (error) {
    console.error('Error getting conversation analytics:', error);
    throw error;
  }
}

// Helper functions
function calculateAverageResponseTime(analytics) {
  const responseTimes = analytics
    .filter(a => a.averageResponseTime !== null)
    .map(a => a.averageResponseTime);
  
  if (responseTimes.length === 0) return null;
  
  return Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
}

function getMostActiveDay(analytics) {
  if (analytics.length === 0) return null;
  
  return analytics.reduce((max, current) => 
    current.totalMessages > max.totalMessages ? current : max
  );
}

function calculateEngagementScore(analytics) {
  if (analytics.length === 0) return 0;
  
  const totalMessages = analytics.reduce((sum, a) => sum + a.totalMessages, 0);
  const templatesUsed = analytics.reduce((sum, a) => sum + a.templatesUsed, 0);
  const filesShared = analytics.reduce((sum, a) => sum + a.filesShared, 0);
  const scheduledMessages = analytics.reduce((sum, a) => sum + a.scheduledMessages, 0);
  
  // Engagement score based on feature usage
  const templateScore = templatesUsed * 2; // Templates show professionalism
  const fileScore = filesShared * 3; // File sharing shows engagement
  const scheduleScore = scheduledMessages * 4; // Scheduling shows planning
  
  const engagementScore = (templateScore + fileScore + scheduleScore) / Math.max(totalMessages, 1) * 100;
  
  return Math.min(Math.round(engagementScore), 100); // Cap at 100
}

module.exports = {
  updateMessageAnalytics,
  updateResponseTimeForParticipants,
  getUserAnalytics,
  getConversationAnalytics,
};
