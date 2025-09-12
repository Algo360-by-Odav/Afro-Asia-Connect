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

// Get comprehensive dashboard analytics
async function getDashboardAnalytics(userId, userRole, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  try {
    const analytics = {};

    if (userRole === 'ADMIN') {
      analytics.platform = await getPlatformAnalytics(startDate);
      analytics.revenue = await getRevenueAnalytics(startDate);
      analytics.users = await getUserGrowthAnalytics(startDate);
      analytics.services = await getServiceAnalytics(startDate);
      analytics.bookings = await getBookingAnalytics(startDate);
    } else if (userRole === 'PROVIDER') {
      analytics.provider = await getProviderAnalytics(userId, startDate);
      analytics.earnings = await getProviderEarnings(userId, startDate);
      analytics.bookings = await getProviderBookings(userId, startDate);
      analytics.reviews = await getProviderReviews(userId, startDate);
    } else {
      analytics.customer = await getCustomerAnalytics(userId, startDate);
      analytics.bookings = await getCustomerBookings(userId, startDate);
      analytics.spending = await getCustomerSpending(userId, startDate);
    }

    return analytics;
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw error;
  }
}

// Platform-wide analytics (Admin only)
async function getPlatformAnalytics(startDate) {
  const [
    totalUsers,
    newUsers,
    totalServices,
    activeServices,
    totalBookings,
    completedBookings,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    prisma.service.count(),
    prisma.service.count({ where: { status: 'ACTIVE' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    })
  ]);

  return {
    users: { total: totalUsers, new: newUsers },
    services: { total: totalServices, active: activeServices },
    bookings: { total: totalBookings, completed: completedBookings },
    revenue: totalRevenue._sum.amount || 0,
    conversionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(2) : 0
  };
}

// Revenue analytics with trends
async function getRevenueAnalytics(startDate) {
  const dailyRevenue = await prisma.payment.groupBy({
    by: ['createdAt'],
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    _sum: { amount: true },
    orderBy: { createdAt: 'asc' }
  });

  const monthlyRevenue = await prisma.payment.groupBy({
    by: ['createdAt'],
    where: {
      status: 'COMPLETED',
      createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) }
    },
    _sum: { amount: true }
  });

  return {
    daily: dailyRevenue.map(d => ({
      date: d.createdAt.toISOString().split('T')[0],
      amount: d._sum.amount || 0
    })),
    monthly: monthlyRevenue,
    total: dailyRevenue.reduce((sum, d) => sum + (d._sum.amount || 0), 0)
  };
}

// User growth analytics
async function getUserGrowthAnalytics(startDate) {
  const userGrowth = await prisma.user.groupBy({
    by: ['createdAt', 'role'],
    where: { createdAt: { gte: startDate } },
    _count: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });

  return {
    growth: userGrowth.map(u => ({
      date: u.createdAt.toISOString().split('T')[0],
      role: u.role,
      count: u._count.id
    })),
    byRole: usersByRole.map(u => ({
      role: u.role,
      count: u._count.id
    }))
  };
}

// Service analytics
async function getServiceAnalytics(startDate) {
  const servicesByCategory = await prisma.service.groupBy({
    by: ['category'],
    _count: { id: true },
    _avg: { price: true }
  });

  const servicesByStatus = await prisma.service.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  return {
    byCategory: servicesByCategory.map(s => ({
      category: s.category,
      count: s._count.id,
      averagePrice: s._avg.price || 0
    })),
    byStatus: servicesByStatus.map(s => ({
      status: s.status,
      count: s._count.id
    }))
  };
}

// Booking analytics
async function getBookingAnalytics(startDate) {
  const bookingTrends = await prisma.booking.groupBy({
    by: ['createdAt', 'status'],
    where: { createdAt: { gte: startDate } },
    _count: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const bookingsByStatus = await prisma.booking.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  return {
    trends: bookingTrends.map(b => ({
      date: b.createdAt.toISOString().split('T')[0],
      status: b.status,
      count: b._count.id
    })),
    byStatus: bookingsByStatus.map(b => ({
      status: b.status,
      count: b._count.id
    }))
  };
}

// Provider-specific analytics
async function getProviderAnalytics(providerId, startDate) {
  const [
    totalServices,
    activeBookings,
    completedBookings,
    totalEarnings,
    averageRating
  ] = await Promise.all([
    prisma.service.count({ where: { providerId: parseInt(providerId) } }),
    prisma.booking.count({
      where: {
        providerId: parseInt(providerId),
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
      }
    }),
    prisma.booking.count({
      where: {
        providerId: parseInt(providerId),
        status: 'COMPLETED'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        booking: { providerId: parseInt(providerId) },
        status: 'COMPLETED'
      }
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      where: { providerId: parseInt(providerId) }
    })
  ]);

  return {
    services: totalServices,
    bookings: { active: activeBookings, completed: completedBookings },
    earnings: totalEarnings._sum.amount || 0,
    rating: averageRating._avg.rating || 0
  };
}

// Provider earnings over time
async function getProviderEarnings(providerId, startDate) {
  const earnings = await prisma.payment.findMany({
    where: {
      booking: { providerId: parseInt(providerId) },
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    include: {
      booking: {
        select: { service: { select: { serviceName: true } } }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return earnings.map(e => ({
    date: e.createdAt.toISOString().split('T')[0],
    amount: e.amount,
    service: e.booking.service.serviceName
  }));
}

// Provider bookings analytics
async function getProviderBookings(providerId, startDate) {
  const bookings = await prisma.booking.groupBy({
    by: ['createdAt', 'status'],
    where: {
      providerId: parseInt(providerId),
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  return bookings.map(b => ({
    date: b.createdAt.toISOString().split('T')[0],
    status: b.status,
    count: b._count.id
  }));
}

// Provider reviews analytics
async function getProviderReviews(providerId, startDate) {
  const reviews = await prisma.review.findMany({
    where: {
      providerId: parseInt(providerId),
      createdAt: { gte: startDate }
    },
    select: {
      rating: true,
      createdAt: true,
      comment: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  return {
    recent: reviews.slice(0, 10),
    distribution: ratingDistribution,
    average: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  };
}

// Customer analytics
async function getCustomerAnalytics(customerId, startDate) {
  const [
    totalBookings,
    completedBookings,
    totalSpent,
    favoriteCategories
  ] = await Promise.all([
    prisma.booking.count({ where: { customerId: parseInt(customerId) } }),
    prisma.booking.count({
      where: {
        customerId: parseInt(customerId),
        status: 'COMPLETED'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        booking: { customerId: parseInt(customerId) },
        status: 'COMPLETED'
      }
    }),
    prisma.booking.groupBy({
      by: ['service'],
      where: { customerId: parseInt(customerId) },
      _count: { id: true }
    })
  ]);

  return {
    bookings: { total: totalBookings, completed: completedBookings },
    totalSpent: totalSpent._sum.amount || 0,
    favoriteCategories
  };
}

// Customer bookings over time
async function getCustomerBookings(customerId, startDate) {
  const bookings = await prisma.booking.findMany({
    where: {
      customerId: parseInt(customerId),
      createdAt: { gte: startDate }
    },
    include: {
      service: { select: { serviceName: true, category: true } },
      provider: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return bookings.map(b => ({
    date: b.createdAt.toISOString().split('T')[0],
    service: b.service.serviceName,
    category: b.service.category,
    provider: `${b.provider.firstName} ${b.provider.lastName}`,
    status: b.status,
    amount: b.totalAmount
  }));
}

// Customer spending analytics
async function getCustomerSpending(customerId, startDate) {
  const spending = await prisma.payment.findMany({
    where: {
      booking: { customerId: parseInt(customerId) },
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    include: {
      booking: {
        select: {
          service: { select: { category: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const spendingByCategory = spending.reduce((acc, payment) => {
    const category = payment.booking.service.category;
    acc[category] = (acc[category] || 0) + payment.amount;
    return acc;
  }, {});

  return {
    timeline: spending.map(s => ({
      date: s.createdAt.toISOString().split('T')[0],
      amount: s.amount,
      category: s.booking.service.category
    })),
    byCategory: Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount
    }))
  };
}

module.exports = {
  updateMessageAnalytics,
  updateResponseTimeForParticipants,
  getUserAnalytics,
  getConversationAnalytics,
  getDashboardAnalytics,
  getPlatformAnalytics,
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getServiceAnalytics,
  getBookingAnalytics,
  getProviderAnalytics,
  getProviderEarnings,
  getProviderBookings,
  getProviderReviews,
  getCustomerAnalytics,
  getCustomerBookings,
  getCustomerSpending
};
