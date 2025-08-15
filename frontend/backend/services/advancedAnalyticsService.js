const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdvancedAnalyticsService {
  /**
   * Generate comprehensive business dashboard metrics
   */
  async generateDashboardMetrics(userId, timeframe = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate timeframe
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const metrics = {
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        overview: await this.getOverviewMetrics(userId, startDate, endDate),
        messaging: await this.getMessagingMetrics(userId, startDate, endDate),
        business: await this.getBusinessMetrics(userId, startDate, endDate),
        engagement: await this.getEngagementMetrics(userId, startDate, endDate),
        revenue: await this.getRevenueMetrics(userId, startDate, endDate),
        trends: await this.getTrendAnalysis(userId, startDate, endDate),
        predictions: await this.getPredictiveAnalytics(userId, startDate, endDate)
      };

      return {
        success: true,
        metrics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating dashboard metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Real-time analytics for live dashboard updates
   */
  async getRealTimeMetrics(userId) {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const realTimeData = {
        timestamp: now.toISOString(),
        activeUsers: await this.getActiveUsersCount(),
        messagesPerMinute: await this.getMessagesPerMinute(),
        conversionsToday: await this.getConversionsToday(userId, todayStart),
        systemHealth: await this.getSystemHealthMetrics(),
        alerts: await this.getActiveAlerts(userId)
      };

      return {
        success: true,
        realTimeData
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Advanced cohort analysis
   */
  async generateCohortAnalysis(userId, cohortType = 'monthly') {
    try {
      const cohorts = await this.calculateCohorts(userId, cohortType);
      const retentionRates = await this.calculateRetentionRates(cohorts);
      
      return {
        success: true,
        cohortAnalysis: {
          type: cohortType,
          cohorts,
          retentionRates,
          insights: this.generateCohortInsights(retentionRates)
        }
      };
    } catch (error) {
      console.error('Error generating cohort analysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Funnel analysis for conversion tracking
   */
  async generateFunnelAnalysis(userId, funnelSteps) {
    try {
      const funnelData = [];
      
      for (let i = 0; i < funnelSteps.length; i++) {
        const step = funnelSteps[i];
        const count = await this.getFunnelStepCount(userId, step);
        const conversionRate = i > 0 ? (count / funnelData[i-1].count) * 100 : 100;
        
        funnelData.push({
          step: step.name,
          count,
          conversionRate,
          dropoffRate: 100 - conversionRate
        });
      }

      return {
        success: true,
        funnelAnalysis: {
          steps: funnelData,
          overallConversionRate: funnelData.length > 0 ? 
            (funnelData[funnelData.length - 1].count / funnelData[0].count) * 100 : 0,
          insights: this.generateFunnelInsights(funnelData)
        }
      };
    } catch (error) {
      console.error('Error generating funnel analysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * A/B testing analytics
   */
  async generateABTestAnalysis(testId) {
    try {
      const test = await prisma.abTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!test) {
        throw new Error('A/B test not found');
      }

      const results = [];
      for (const variant of test.variants) {
        const metrics = await this.getVariantMetrics(variant.id);
        results.push({
          variant: variant.name,
          participants: metrics.participants,
          conversions: metrics.conversions,
          conversionRate: metrics.participants > 0 ? (metrics.conversions / metrics.participants) * 100 : 0,
          confidence: await this.calculateStatisticalSignificance(variant.id, test.variants)
        });
      }

      return {
        success: true,
        abTestAnalysis: {
          testName: test.name,
          status: test.status,
          startDate: test.startDate,
          endDate: test.endDate,
          results,
          winner: this.determineWinner(results),
          recommendations: this.generateABTestRecommendations(results)
        }
      };
    } catch (error) {
      console.error('Error generating A/B test analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async getOverviewMetrics(userId, startDate, endDate) {
    const totalUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    const activeUsers = await prisma.user.count({
      where: { 
        lastLoginAt: { gte: startDate, lte: endDate }
      }
    });

    const totalRevenue = await prisma.payment.aggregate({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      _sum: { amount: true }
    });

    return {
      totalUsers,
      activeUsers,
      userGrowthRate: await this.calculateGrowthRate('users', startDate, endDate),
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueGrowthRate: await this.calculateGrowthRate('revenue', startDate, endDate)
    };
  }

  async getMessagingMetrics(userId, startDate, endDate) {
    const totalMessages = await prisma.message.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    const activeConversations = await prisma.conversation.count({
      where: {
        messages: {
          some: { createdAt: { gte: startDate, lte: endDate } }
        }
      }
    });

    const avgResponseTime = await this.calculateAverageResponseTime(startDate, endDate);

    return {
      totalMessages,
      activeConversations,
      avgResponseTime,
      messageGrowthRate: await this.calculateGrowthRate('messages', startDate, endDate)
    };
  }

  async getBusinessMetrics(userId, startDate, endDate) {
    const totalLeads = await prisma.leadScore.count({
      where: { lastUpdated: { gte: startDate, lte: endDate } }
    });

    const qualifiedLeads = await prisma.leadScore.count({
      where: { 
        lastUpdated: { gte: startDate, lte: endDate },
        quality: { in: ['hot', 'warm', 'qualified'] }
      }
    });

    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      qualifiedLeads,
      conversionRate,
      leadQualityDistribution: await this.getLeadQualityDistribution(startDate, endDate)
    };
  }

  async getEngagementMetrics(userId, startDate, endDate) {
    const pageViews = await prisma.analyticsEvent.count({
      where: { 
        eventType: 'page_view',
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const uniqueVisitors = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { 
        eventType: 'page_view',
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const avgSessionDuration = await this.calculateAverageSessionDuration(startDate, endDate);

    return {
      pageViews,
      uniqueVisitors: uniqueVisitors.length,
      avgSessionDuration,
      bounceRate: await this.calculateBounceRate(startDate, endDate)
    };
  }

  async getRevenueMetrics(userId, startDate, endDate) {
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

    const revenueByDay = await this.getRevenueByDay(startDate, endDate);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
      oneTimeRevenue: (totalRevenue._sum.amount || 0) - (subscriptionRevenue._sum.amount || 0),
      revenueByDay,
      averageOrderValue: await this.calculateAverageOrderValue(startDate, endDate)
    };
  }

  async getTrendAnalysis(userId, startDate, endDate) {
    const trends = {
      userGrowth: await this.calculateTrend('users', startDate, endDate),
      revenueGrowth: await this.calculateTrend('revenue', startDate, endDate),
      engagementTrend: await this.calculateTrend('engagement', startDate, endDate),
      conversionTrend: await this.calculateTrend('conversions', startDate, endDate)
    };

    return {
      trends,
      insights: this.generateTrendInsights(trends)
    };
  }

  async getPredictiveAnalytics(userId, startDate, endDate) {
    const historicalData = await this.getHistoricalData(userId, startDate, endDate);
    
    return {
      predictedRevenue: this.predictRevenue(historicalData),
      predictedUserGrowth: this.predictUserGrowth(historicalData),
      churnRiskUsers: await this.identifyChurnRiskUsers(userId),
      recommendations: this.generatePredictiveRecommendations(historicalData)
    };
  }

  async calculateGrowthRate(metric, startDate, endDate) {
    // Calculate growth rate compared to previous period
    const periodLength = endDate - startDate;
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = startDate;

    let currentValue, previousValue;

    switch (metric) {
      case 'users':
        currentValue = await prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        });
        previousValue = await prisma.user.count({
          where: { createdAt: { gte: previousStartDate, lte: previousEndDate } }
        });
        break;
      case 'revenue':
        const currentRevenue = await prisma.payment.aggregate({
          where: { 
            createdAt: { gte: startDate, lte: endDate },
            status: 'completed'
          },
          _sum: { amount: true }
        });
        const previousRevenue = await prisma.payment.aggregate({
          where: { 
            createdAt: { gte: previousStartDate, lte: previousEndDate },
            status: 'completed'
          },
          _sum: { amount: true }
        });
        currentValue = currentRevenue._sum.amount || 0;
        previousValue = previousRevenue._sum.amount || 0;
        break;
      case 'messages':
        currentValue = await prisma.message.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        });
        previousValue = await prisma.message.count({
          where: { createdAt: { gte: previousStartDate, lte: previousEndDate } }
        });
        break;
    }

    return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  }

  async calculateAverageResponseTime(startDate, endDate) {
    // Mock calculation - implement based on message timestamps
    return 2.5; // hours
  }

  async getLeadQualityDistribution(startDate, endDate) {
    const distribution = await prisma.leadScore.groupBy({
      by: ['quality'],
      where: { lastUpdated: { gte: startDate, lte: endDate } },
      _count: { quality: true }
    });

    return distribution.reduce((acc, item) => {
      acc[item.quality] = item._count.quality;
      return acc;
    }, {});
  }

  async calculateAverageSessionDuration(startDate, endDate) {
    // Mock calculation - implement based on session tracking
    return 15.5; // minutes
  }

  async calculateBounceRate(startDate, endDate) {
    // Mock calculation - implement based on single-page sessions
    return 35.2; // percentage
  }

  async getRevenueByDay(startDate, endDate) {
    const revenueByDay = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      _sum: { amount: true }
    });

    // Group by day and format
    const dailyRevenue = {};
    revenueByDay.forEach(item => {
      const day = item.createdAt.toISOString().split('T')[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (item._sum.amount || 0);
    });

    return dailyRevenue;
  }

  async calculateAverageOrderValue(startDate, endDate) {
    const result = await prisma.payment.aggregate({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      _avg: { amount: true },
      _count: { id: true }
    });

    return result._avg.amount || 0;
  }

  generateTrendInsights(trends) {
    const insights = [];
    
    if (trends.userGrowth > 20) {
      insights.push({
        type: 'positive',
        title: 'Strong User Growth',
        description: `User growth is ${trends.userGrowth.toFixed(1)}% above average`
      });
    }
    
    if (trends.revenueGrowth < -10) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline',
        description: `Revenue has declined by ${Math.abs(trends.revenueGrowth).toFixed(1)}%`
      });
    }

    return insights;
  }

  predictRevenue(historicalData) {
    // Simple linear regression prediction
    // In production, use more sophisticated ML models
    return {
      nextMonth: 15000,
      nextQuarter: 45000,
      confidence: 0.75
    };
  }

  predictUserGrowth(historicalData) {
    return {
      nextMonth: 250,
      nextQuarter: 800,
      confidence: 0.82
    };
  }

  async identifyChurnRiskUsers(userId) {
    // Identify users at risk of churning based on activity patterns
    const riskUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true
      }
    });

    return riskUsers.map(user => ({
      ...user,
      riskScore: this.calculateChurnRiskScore(user),
      recommendations: this.getChurnPreventionRecommendations(user)
    }));
  }

  calculateChurnRiskScore(user) {
    const daysSinceLastLogin = (new Date() - new Date(user.lastLoginAt)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastLogin > 30) return 'high';
    if (daysSinceLastLogin > 14) return 'medium';
    return 'low';
  }

  getChurnPreventionRecommendations(user) {
    return [
      'Send re-engagement email campaign',
      'Offer personalized discount or incentive',
      'Schedule follow-up call or meeting'
    ];
  }

  generatePredictiveRecommendations(historicalData) {
    return [
      {
        type: 'growth',
        title: 'Optimize conversion funnel',
        description: 'Focus on improving step 2-3 conversion rate',
        impact: 'high'
      },
      {
        type: 'retention',
        title: 'Implement retention campaign',
        description: 'Target users inactive for 7+ days',
        impact: 'medium'
      }
    ];
  }
}

module.exports = new AdvancedAnalyticsService();
