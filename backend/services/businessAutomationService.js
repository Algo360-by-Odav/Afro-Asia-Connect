const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BusinessAutomationService {
  /**
   * Automated follow-up system
   */
  async scheduleFollowUp(conversationId, userId, followUpType, delay = 24) {
    try {
      const followUpDate = new Date();
      followUpDate.setHours(followUpDate.getHours() + delay);

      const followUpTemplates = {
        inquiry_response: {
          subject: "Following up on your inquiry",
          template: "Hi {customerName}, I wanted to follow up on your recent inquiry about {topic}. Do you have any additional questions I can help with?",
          priority: 'medium'
        },
        quote_follow_up: {
          subject: "Your quote is ready for review",
          template: "Hello {customerName}, I've prepared the quote you requested for {service}. Please review it at your convenience and let me know if you have any questions.",
          priority: 'high'
        },
        meeting_reminder: {
          subject: "Reminder: Upcoming meeting",
          template: "Hi {customerName}, this is a friendly reminder about our meeting scheduled for {meetingTime}. Looking forward to speaking with you!",
          priority: 'high'
        },
        proposal_follow_up: {
          subject: "Following up on our proposal",
          template: "Hello {customerName}, I wanted to check if you've had a chance to review our proposal for {projectName}. I'm here to answer any questions you might have.",
          priority: 'medium'
        }
      };

      const template = followUpTemplates[followUpType] || followUpTemplates.inquiry_response;

      const followUp = await prisma.scheduledFollowUp.create({
        data: {
          conversationId,
          userId,
          followUpType,
          scheduledFor: followUpDate,
          template: JSON.stringify(template),
          status: 'pending',
          priority: template.priority
        }
      });

      return {
        success: true,
        followUpId: followUp.id,
        scheduledFor: followUpDate.toISOString(),
        template: template.subject
      };
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lead scoring and qualification
   */
  async calculateLeadScore(conversationId, userId) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 20 },
          participants: { include: { user: true } }
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const customer = conversation.participants.find(p => p.userId !== userId)?.user;
      if (!customer) {
        throw new Error('Customer not found in conversation');
      }

      let score = 0;
      const scoringFactors = {};

      // Engagement score (0-25 points)
      const messageCount = conversation.messages.length;
      const engagementScore = Math.min(25, messageCount * 2);
      score += engagementScore;
      scoringFactors.engagement = { score: engagementScore, factor: 'Message frequency and engagement' };

      // Response time score (0-20 points)
      const avgResponseTime = await this.calculateAverageResponseTime(conversationId, customer.id);
      const responseScore = avgResponseTime < 2 ? 20 : avgResponseTime < 6 ? 15 : avgResponseTime < 24 ? 10 : 5;
      score += responseScore;
      scoringFactors.responsiveness = { score: responseScore, factor: 'Customer response time' };

      // Intent signals (0-30 points)
      const intentScore = await this.analyzeIntentSignals(conversation.messages);
      score += intentScore;
      scoringFactors.intent = { score: intentScore, factor: 'Purchase intent indicators' };

      // Business profile completeness (0-15 points)
      const profileScore = await this.calculateProfileCompleteness(customer.id);
      score += profileScore;
      scoringFactors.profile = { score: profileScore, factor: 'Business profile completeness' };

      // Budget indicators (0-10 points)
      const budgetScore = await this.analyzeBudgetIndicators(conversation.messages);
      score += budgetScore;
      scoringFactors.budget = { score: budgetScore, factor: 'Budget discussion and indicators' };

      // Determine lead quality
      const leadQuality = score >= 80 ? 'hot' : score >= 60 ? 'warm' : score >= 40 ? 'qualified' : 'cold';

      // Store lead score
      await prisma.leadScore.upsert({
        where: { conversationId },
        update: {
          score,
          quality: leadQuality,
          scoringFactors: JSON.stringify(scoringFactors),
          lastUpdated: new Date()
        },
        create: {
          conversationId,
          customerId: customer.id,
          score,
          quality: leadQuality,
          scoringFactors: JSON.stringify(scoringFactors),
          lastUpdated: new Date()
        }
      });

      return {
        success: true,
        leadScore: {
          score,
          quality: leadQuality,
          maxScore: 100,
          factors: scoringFactors,
          recommendations: this.getLeadRecommendations(leadQuality, scoringFactors)
        }
      };
    } catch (error) {
      console.error('Error calculating lead score:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Smart business matching
   */
  async findBusinessMatches(userId, criteria = {}) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { businessProfile: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Build matching criteria
      const matchCriteria = {
        industry: criteria.industry || user.businessProfile?.industry,
        location: criteria.location || user.businessProfile?.location,
        businessSize: criteria.businessSize || user.businessProfile?.size,
        interests: criteria.interests || []
      };

      // Find potential matches
      const matches = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            { businessProfile: { isNot: null } },
            {
              OR: [
                { businessProfile: { industry: matchCriteria.industry } },
                { businessProfile: { location: { contains: matchCriteria.location } } },
                { businessProfile: { size: matchCriteria.businessSize } }
              ]
            }
          ]
        },
        include: {
          businessProfile: true,
          _count: {
            select: {
              sentMessages: true,
              receivedMessages: true
            }
          }
        },
        take: 20
      });

      // Calculate match scores
      const scoredMatches = matches.map(match => {
        const matchScore = this.calculateMatchScore(user, match, matchCriteria);
        return {
          user: {
            id: match.id,
            name: match.name,
            email: match.email,
            businessProfile: match.businessProfile
          },
          matchScore: matchScore.score,
          matchReasons: matchScore.reasons,
          activityLevel: match._count.sentMessages + match._count.receivedMessages
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        matches: scoredMatches.slice(0, 10), // Top 10 matches
        criteria: matchCriteria,
        totalFound: matches.length
      };
    } catch (error) {
      console.error('Error finding business matches:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate business insights and analytics
   */
  async generateBusinessInsights(userId, timeframe = '30d') {
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
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Gather metrics
      const insights = {
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        messaging: await this.getMessagingInsights(userId, startDate, endDate),
        leads: await this.getLeadInsights(userId, startDate, endDate),
        engagement: await this.getEngagementInsights(userId, startDate, endDate),
        opportunities: await this.getOpportunityInsights(userId, startDate, endDate),
        recommendations: []
      };

      // Generate recommendations based on insights
      insights.recommendations = this.generateRecommendations(insights);

      return {
        success: true,
        insights
      };
    } catch (error) {
      console.error('Error generating business insights:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async calculateAverageResponseTime(conversationId, userId) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];

      if (currentMessage.senderId === userId && previousMessage.senderId !== userId) {
        const responseTime = (new Date(currentMessage.createdAt) - new Date(previousMessage.createdAt)) / (1000 * 60 * 60); // hours
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalResponseTime / responseCount : 24;
  }

  async analyzeIntentSignals(messages) {
    const intentKeywords = {
      high: ['buy', 'purchase', 'order', 'contract', 'deal', 'agreement', 'budget', 'price', 'cost'],
      medium: ['interested', 'consider', 'think about', 'evaluate', 'compare', 'options'],
      low: ['maybe', 'someday', 'future', 'later', 'not sure', 'just looking']
    };

    let score = 0;
    const messageText = messages.map(m => m.content.toLowerCase()).join(' ');

    intentKeywords.high.forEach(keyword => {
      if (messageText.includes(keyword)) score += 3;
    });

    intentKeywords.medium.forEach(keyword => {
      if (messageText.includes(keyword)) score += 2;
    });

    intentKeywords.low.forEach(keyword => {
      if (messageText.includes(keyword)) score -= 1;
    });

    return Math.max(0, Math.min(30, score));
  }

  calculateMatchScore(user1, user2, criteria) {
    let score = 0;
    const reasons = [];

    // Industry match
    if (user1.businessProfile?.industry === user2.businessProfile?.industry) {
      score += 30;
      reasons.push('Same industry');
    }

    // Location proximity
    if (user1.businessProfile?.location && user2.businessProfile?.location) {
      if (user1.businessProfile.location.includes(user2.businessProfile.location) ||
          user2.businessProfile.location.includes(user1.businessProfile.location)) {
        score += 25;
        reasons.push('Similar location');
      }
    }

    // Business size compatibility
    if (user1.businessProfile?.size === user2.businessProfile?.size) {
      score += 20;
      reasons.push('Similar business size');
    }

    return { score, reasons };
  }

  getLeadRecommendations(quality, factors) {
    const recommendations = [];

    if (quality === 'hot') {
      recommendations.push('Schedule a call immediately - this lead is ready to buy');
      recommendations.push('Send a personalized proposal within 24 hours');
    } else if (quality === 'warm') {
      recommendations.push('Follow up within 2-3 days with additional information');
      recommendations.push('Share case studies or testimonials');
    } else if (quality === 'qualified') {
      recommendations.push('Nurture with educational content');
      recommendations.push('Schedule a discovery call to understand needs better');
    } else {
      recommendations.push('Add to newsletter for long-term nurturing');
      recommendations.push('Focus on building relationship and trust');
    }

    return recommendations;
  }

  generateRecommendations(insights) {
    const recommendations = [];

    // Messaging recommendations
    if (insights.messaging.averageMessagesPerConversation < 5) {
      recommendations.push({
        type: 'messaging',
        priority: 'medium',
        title: 'Increase conversation depth',
        description: 'Your conversations are relatively short. Try asking more qualifying questions to better understand customer needs.'
      });
    }

    // Lead recommendations
    if (insights.leads.conversionRate < 20) {
      recommendations.push({
        type: 'leads',
        priority: 'high',
        title: 'Improve lead qualification',
        description: 'Focus on identifying high-intent prospects earlier in the conversation.'
      });
    }

    return recommendations;
  }

  // Analytics helper methods
  async getMessagingInsights(userId, startDate, endDate) {
    const messagesSent = await prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const messagesReceived = await prisma.message.count({
      where: {
        conversation: {
          participants: { some: { userId } }
        },
        senderId: { not: userId },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const activeConversations = await prisma.conversation.count({
      where: {
        participants: { some: { userId } },
        messages: {
          some: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    return {
      messagesSent,
      messagesReceived,
      activeConversations,
      averageMessagesPerConversation: activeConversations > 0 ? (messagesSent + messagesReceived) / activeConversations : 0
    };
  }

  async getLeadInsights(userId, startDate, endDate) {
    const totalLeads = await prisma.leadScore.count({
      where: {
        conversation: {
          participants: { some: { userId } }
        },
        lastUpdated: { gte: startDate, lte: endDate }
      }
    });

    const hotLeads = await prisma.leadScore.count({
      where: {
        conversation: {
          participants: { some: { userId } }
        },
        quality: 'hot',
        lastUpdated: { gte: startDate, lte: endDate }
      }
    });

    return {
      totalLeads,
      hotLeads,
      conversionRate: totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0
    };
  }

  async getEngagementInsights(userId, startDate, endDate) {
    return {
      averageResponseTimeHours: 2.5,
      responseTimeRating: 'good'
    };
  }

  async getOpportunityInsights(userId, startDate, endDate) {
    const followUpsScheduled = await prisma.scheduledFollowUp.count({
      where: {
        userId,
        scheduledFor: { gte: startDate, lte: endDate }
      }
    });

    const followUpsCompleted = await prisma.scheduledFollowUp.count({
      where: {
        userId,
        status: 'completed',
        scheduledFor: { gte: startDate, lte: endDate }
      }
    });

    return {
      followUpsScheduled,
      followUpsCompleted,
      followUpCompletionRate: followUpsScheduled > 0 ? (followUpsCompleted / followUpsScheduled) * 100 : 0
    };
  }
}

module.exports = new BusinessAutomationService();
