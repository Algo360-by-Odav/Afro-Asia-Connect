const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdminPanelService {
  /**
   * Get comprehensive platform overview for admin dashboard
   */
  async getPlatformOverview() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const overview = {
        users: await this.getUserMetrics(thirtyDaysAgo, now),
        messaging: await this.getMessagingMetrics(thirtyDaysAgo, now),
        business: await this.getBusinessMetrics(thirtyDaysAgo, now),
        revenue: await this.getRevenueMetrics(thirtyDaysAgo, now),
        system: await this.getSystemHealthMetrics(),
        alerts: await this.getActiveAlerts(),
        recentActivity: await this.getRecentActivity(20)
      };

      return {
        success: true,
        overview,
        generatedAt: now.toISOString()
      };
    } catch (error) {
      console.error('Error getting platform overview:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * User management and moderation
   */
  async getUserManagement(page = 1, limit = 50, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.role) {
        where.roles = { some: { name: filters.role } };
      }
      if (filters.searchTerm) {
        where.OR = [
          { name: { contains: filters.searchTerm, mode: 'insensitive' } },
          { email: { contains: filters.searchTerm, mode: 'insensitive' } }
        ];
      }
      if (filters.dateRange) {
        where.createdAt = {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end)
        };
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            roles: true,
            businessProfile: true,
            _count: {
              select: {
                sentMessages: true,
                receivedMessages: true,
                payments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      // Add risk scores and activity metrics
      const enrichedUsers = await Promise.all(
        users.map(async (user) => ({
          ...user,
          riskScore: await this.calculateUserRiskScore(user.id),
          activityScore: await this.calculateUserActivityScore(user.id),
          lastActivity: await this.getUserLastActivity(user.id),
          flags: await this.getUserFlags(user.id)
        }))
      );

      return {
        success: true,
        users: enrichedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user management data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Content moderation and approval workflows
   */
  async getContentModeration(contentType = 'all', status = 'pending') {
    try {
      const moderationItems = [];

      // Get pending business listings
      if (contentType === 'all' || contentType === 'listings') {
        const listings = await prisma.listing.findMany({
          where: { status: status === 'pending' ? 'pending_approval' : status },
          include: {
            user: { select: { id: true, name: true, email: true } },
            reports: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        moderationItems.push(...listings.map(item => ({
          ...item,
          type: 'listing',
          priority: this.calculateModerationPriority(item)
        })));
      }

      // Get reported messages
      if (contentType === 'all' || contentType === 'messages') {
        const reportedMessages = await prisma.messageReport.findMany({
          where: { status: status === 'pending' ? 'open' : status },
          include: {
            message: {
              include: {
                sender: { select: { id: true, name: true, email: true } }
              }
            },
            reporter: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        moderationItems.push(...reportedMessages.map(item => ({
          ...item,
          type: 'message_report',
          priority: this.calculateModerationPriority(item)
        })));
      }

      // Get user reports
      if (contentType === 'all' || contentType === 'users') {
        const userReports = await prisma.userReport.findMany({
          where: { status: status === 'pending' ? 'open' : status },
          include: {
            reportedUser: { select: { id: true, name: true, email: true } },
            reporter: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        moderationItems.push(...userReports.map(item => ({
          ...item,
          type: 'user_report',
          priority: this.calculateModerationPriority(item)
        })));
      }

      // Sort by priority and creation date
      moderationItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return {
        success: true,
        items: moderationItems,
        summary: {
          total: moderationItems.length,
          highPriority: moderationItems.filter(item => item.priority >= 8).length,
          mediumPriority: moderationItems.filter(item => item.priority >= 5 && item.priority < 8).length,
          lowPriority: moderationItems.filter(item => item.priority < 5).length
        }
      };
    } catch (error) {
      console.error('Error getting content moderation data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * System configuration management
   */
  async getSystemConfiguration() {
    try {
      const config = await prisma.systemConfiguration.findMany({
        orderBy: { category: 'asc' }
      });

      const groupedConfig = config.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push({
          key: item.key,
          value: item.value,
          type: item.type,
          description: item.description,
          isEditable: item.isEditable,
          lastUpdated: item.updatedAt
        });
        return acc;
      }, {});

      return {
        success: true,
        configuration: groupedConfig,
        categories: Object.keys(groupedConfig)
      };
    } catch (error) {
      console.error('Error getting system configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfiguration(updates) {
    try {
      const results = [];

      for (const update of updates) {
        const result = await prisma.systemConfiguration.update({
          where: { key: update.key },
          data: {
            value: update.value,
            updatedAt: new Date()
          }
        });
        results.push(result);
      }

      // Log configuration changes
      await prisma.adminAuditLog.create({
        data: {
          action: 'system_config_update',
          details: JSON.stringify(updates),
          adminId: updates[0].adminId, // Assuming adminId is passed
          timestamp: new Date()
        }
      });

      return {
        success: true,
        updatedConfigurations: results
      };
    } catch (error) {
      console.error('Error updating system configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Platform monitoring and health checks
   */
  async performHealthCheck() {
    try {
      const healthChecks = {
        database: await this.checkDatabaseHealth(),
        redis: await this.checkRedisHealth(),
        storage: await this.checkStorageHealth(),
        email: await this.checkEmailServiceHealth(),
        sms: await this.checkSMSServiceHealth(),
        payment: await this.checkPaymentServiceHealth(),
        ai: await this.checkAIServiceHealth()
      };

      const overallHealth = Object.values(healthChecks).every(check => check.status === 'healthy');

      return {
        success: true,
        overallStatus: overallHealth ? 'healthy' : 'degraded',
        checks: healthChecks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error performing health check:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * User actions (suspend, activate, delete)
   */
  async performUserAction(userId, action, reason, adminId) {
    try {
      let result;

      switch (action) {
        case 'suspend':
          result = await prisma.user.update({
            where: { id: userId },
            data: { 
              status: 'suspended',
              suspendedAt: new Date(),
              suspensionReason: reason
            }
          });
          break;

        case 'activate':
          result = await prisma.user.update({
            where: { id: userId },
            data: { 
              status: 'active',
              suspendedAt: null,
              suspensionReason: null
            }
          });
          break;

        case 'delete':
          // Soft delete - mark as deleted but keep data for compliance
          result = await prisma.user.update({
            where: { id: userId },
            data: { 
              status: 'deleted',
              deletedAt: new Date(),
              deletionReason: reason
            }
          });
          break;

        case 'verify':
          result = await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true, verifiedAt: new Date() }
          });
          break;

        default:
          throw new Error('Invalid user action');
      }

      // Log admin action
      await prisma.adminAuditLog.create({
        data: {
          action: `user_${action}`,
          targetUserId: userId,
          reason,
          adminId,
          timestamp: new Date()
        }
      });

      return {
        success: true,
        user: result,
        action
      };
    } catch (error) {
      console.error('Error performing user action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Content moderation actions
   */
  async performModerationAction(itemId, itemType, action, reason, adminId) {
    try {
      let result;

      switch (itemType) {
        case 'listing':
          if (action === 'approve') {
            result = await prisma.listing.update({
              where: { id: itemId },
              data: { status: 'active', approvedAt: new Date(), approvedBy: adminId }
            });
          } else if (action === 'reject') {
            result = await prisma.listing.update({
              where: { id: itemId },
              data: { status: 'rejected', rejectedAt: new Date(), rejectionReason: reason }
            });
          }
          break;

        case 'message_report':
          result = await prisma.messageReport.update({
            where: { id: itemId },
            data: { 
              status: action === 'approve' ? 'resolved' : 'dismissed',
              resolvedAt: new Date(),
              resolvedBy: adminId,
              resolution: reason
            }
          });
          break;

        case 'user_report':
          result = await prisma.userReport.update({
            where: { id: itemId },
            data: { 
              status: action === 'approve' ? 'resolved' : 'dismissed',
              resolvedAt: new Date(),
              resolvedBy: adminId,
              resolution: reason
            }
          });
          break;
      }

      // Log moderation action
      await prisma.adminAuditLog.create({
        data: {
          action: `moderation_${action}`,
          targetType: itemType,
          targetId: itemId,
          reason,
          adminId,
          timestamp: new Date()
        }
      });

      return {
        success: true,
        result,
        action
      };
    } catch (error) {
      console.error('Error performing moderation action:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async getUserMetrics(startDate, endDate) {
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const activeUsers = await prisma.user.count({
      where: { lastLoginAt: { gte: startDate, lte: endDate } }
    });
    const suspendedUsers = await prisma.user.count({
      where: { status: 'suspended' }
    });

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      growthRate: await this.calculateGrowthRate('users', startDate, endDate)
    };
  }

  async getMessagingMetrics(startDate, endDate) {
    const totalMessages = await prisma.message.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const activeConversations = await prisma.conversation.count({
      where: {
        messages: { some: { createdAt: { gte: startDate, lte: endDate } } }
      }
    });
    const reportedMessages = await prisma.messageReport.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    return {
      totalMessages,
      activeConversations,
      reportedMessages,
      averageMessagesPerConversation: activeConversations > 0 ? totalMessages / activeConversations : 0
    };
  }

  async getBusinessMetrics(startDate, endDate) {
    const totalListings = await prisma.listing.count();
    const newListings = await prisma.listing.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const pendingApproval = await prisma.listing.count({
      where: { status: 'pending_approval' }
    });

    return {
      totalListings,
      newListings,
      pendingApproval,
      approvalRate: newListings > 0 ? ((newListings - pendingApproval) / newListings) * 100 : 0
    };
  }

  async getRevenueMetrics(startDate, endDate) {
    const totalRevenue = await prisma.payment.aggregate({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      _sum: { amount: true }
    });

    const subscriptionRevenue = await prisma.subscription.aggregate({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        status: 'active'
      },
      _sum: { amount: true }
    });

    return {
      total: totalRevenue._sum.amount || 0,
      subscription: subscriptionRevenue._sum.amount || 0,
      oneTime: (totalRevenue._sum.amount || 0) - (subscriptionRevenue._sum.amount || 0)
    };
  }

  async getSystemHealthMetrics() {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeConnections: await this.getActiveConnectionsCount(),
      queueSize: await this.getQueueSize()
    };
  }

  async getActiveAlerts() {
    return await prisma.systemAlert.findMany({
      where: { status: 'active' },
      orderBy: { severity: 'desc' },
      take: 10
    });
  }

  async getRecentActivity(limit = 20) {
    return await prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        admin: { select: { name: true, email: true } }
      }
    });
  }

  calculateModerationPriority(item) {
    let priority = 1;
    
    // Base priority on report count
    if (item.reports?.length > 5) priority += 3;
    else if (item.reports?.length > 2) priority += 2;
    else if (item.reports?.length > 0) priority += 1;
    
    // Increase priority for certain keywords
    const highRiskKeywords = ['fraud', 'scam', 'illegal', 'harassment'];
    const content = item.content || item.description || '';
    if (highRiskKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      priority += 4;
    }
    
    // Recent items get slight priority boost
    const hoursOld = (new Date() - new Date(item.createdAt)) / (1000 * 60 * 60);
    if (hoursOld < 24) priority += 1;
    
    return Math.min(priority, 10); // Cap at 10
  }

  async calculateUserRiskScore(userId) {
    // Simple risk scoring based on various factors
    let riskScore = 0;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reports: true,
        sentMessages: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });
    
    // Reports increase risk
    riskScore += user.reports?.length * 2;
    
    // Account age (newer accounts are riskier)
    const accountAgeInDays = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
    if (accountAgeInDays < 7) riskScore += 3;
    else if (accountAgeInDays < 30) riskScore += 1;
    
    return Math.min(riskScore, 10);
  }

  async calculateUserActivityScore(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const messageCount = await prisma.message.count({
      where: { 
        senderId: userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    
    const loginCount = await prisma.userSession.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    
    return Math.min((messageCount + loginCount * 2), 10);
  }

  async getUserLastActivity(userId) {
    const lastMessage = await prisma.message.findFirst({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    const lastLogin = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true }
    });
    
    const lastMessageTime = lastMessage?.createdAt;
    const lastLoginTime = lastLogin?.lastLoginAt;
    
    if (!lastMessageTime && !lastLoginTime) return null;
    if (!lastMessageTime) return lastLoginTime;
    if (!lastLoginTime) return lastMessageTime;
    
    return lastMessageTime > lastLoginTime ? lastMessageTime : lastLoginTime;
  }

  async getUserFlags(userId) {
    const flags = [];
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { reports: true }
    });
    
    if (user.reports?.length > 0) flags.push('reported');
    if (user.status === 'suspended') flags.push('suspended');
    if (!user.isVerified) flags.push('unverified');
    
    const accountAgeInDays = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
    if (accountAgeInDays < 7) flags.push('new_account');
    
    return flags;
  }

  async checkDatabaseHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', responseTime: '< 10ms' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkRedisHealth() {
    // Mock implementation - integrate with actual Redis client
    return { status: 'healthy', responseTime: '< 5ms' };
  }

  async checkStorageHealth() {
    // Mock implementation - check file storage service
    return { status: 'healthy', freeSpace: '85%' };
  }

  async checkEmailServiceHealth() {
    // Mock implementation - check email service
    return { status: 'healthy', queueSize: 12 };
  }

  async checkSMSServiceHealth() {
    // Mock implementation - check SMS service
    return { status: 'healthy', queueSize: 3 };
  }

  async checkPaymentServiceHealth() {
    // Mock implementation - check Stripe connectivity
    return { status: 'healthy', responseTime: '< 200ms' };
  }

  async checkAIServiceHealth() {
    // Mock implementation - check AI services
    return { status: 'healthy', responseTime: '< 500ms' };
  }

  async getActiveConnectionsCount() {
    // Mock implementation - get active socket connections
    return 1247;
  }

  async getQueueSize() {
    // Mock implementation - get background job queue size
    return 23;
  }

  async calculateGrowthRate(metric, startDate, endDate) {
    // Calculate growth rate compared to previous period
    const periodLength = endDate - startDate;
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    
    let currentValue, previousValue;
    
    switch (metric) {
      case 'users':
        currentValue = await prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        });
        previousValue = await prisma.user.count({
          where: { createdAt: { gte: previousStartDate, lte: startDate } }
        });
        break;
    }
    
    return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  }
}

module.exports = new AdminPanelService();
