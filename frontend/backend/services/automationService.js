const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const securityAuditService = require('./securityAuditService');

class AutomationService {
  constructor() {
    // Workflow trigger types
    this.triggerTypes = {
      MESSAGE_RECEIVED: 'message_received',
      KEYWORD_DETECTED: 'keyword_detected',
      SENTIMENT_NEGATIVE: 'sentiment_negative',
      USER_INACTIVE: 'user_inactive',
      BUSINESS_HOURS: 'business_hours',
      LEAD_QUALIFICATION: 'lead_qualification',
      FOLLOW_UP_DUE: 'follow_up_due'
    };

    // Action types
    this.actionTypes = {
      SEND_AUTO_RESPONSE: 'send_auto_response',
      CREATE_LEAD: 'create_lead',
      ASSIGN_TO_AGENT: 'assign_to_agent',
      SCHEDULE_FOLLOW_UP: 'schedule_follow_up',
      SEND_NOTIFICATION: 'send_notification',
      UPDATE_CRM: 'update_crm',
      ESCALATE_TO_MANAGER: 'escalate_to_manager'
    };

    // Pre-defined auto-response templates
    this.autoResponseTemplates = {
      greeting: {
        triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        responses: [
          "Hello! Welcome to AfroAsiaConnect. How can I help you today?",
          "Hi there! Thanks for reaching out. What can I assist you with?",
          "Greetings! I'm here to help you with your business needs."
        ]
      },
      pricing: {
        triggers: ['price', 'cost', 'pricing', 'how much', 'quote'],
        responses: [
          "I'd be happy to help you with pricing information. Let me connect you with our sales team for a personalized quote.",
          "For detailed pricing, please visit our pricing page or I can have a sales representative contact you.",
          "Our pricing varies based on your specific needs. Would you like me to schedule a consultation?"
        ]
      },
      support: {
        triggers: ['help', 'support', 'problem', 'issue', 'bug'],
        responses: [
          "I'm here to help! Can you please describe the issue you're experiencing?",
          "Our support team is ready to assist you. What specific problem can we help solve?",
          "Let me help you with that. Can you provide more details about what you need support with?"
        ]
      },
      business_hours: {
        triggers: ['hours', 'open', 'closed', 'available'],
        responses: [
          "Our business hours are Monday-Friday 9 AM to 6 PM (GMT+8). We'll respond to your message during business hours.",
          "We're available Monday through Friday, 9 AM to 6 PM. For urgent matters, please mark your message as urgent.",
          "Our team operates during business hours (9 AM - 6 PM, GMT+8). We'll get back to you as soon as possible."
        ]
      },
      lead_qualification: {
        triggers: ['interested', 'want to buy', 'purchase', 'order', 'need'],
        responses: [
          "That's great! I'd love to learn more about your requirements. What specific products or services are you looking for?",
          "Excellent! To better assist you, could you tell me more about your business needs and timeline?",
          "I'm excited to help you find the right solution. What's your budget range and when do you need this implemented?"
        ]
      }
    };
  }

  // Process incoming message for automation triggers
  async processMessageForAutomation(messageData) {
    try {
      const { conversationId, senderId, content, messageType } = messageData;

      // Log automation processing
      await securityAuditService.logAuditEvent({
        userId: senderId,
        eventType: 'automation_processing',
        resourceType: 'message',
        resourceId: conversationId,
        action: 'PROCESS_MESSAGE_AUTOMATION',
        riskLevel: 'low',
        metadata: {
          messageLength: content.length,
          messageType,
          automationEnabled: true
        }
      });

      // Check for auto-response triggers
      await this.checkAutoResponseTriggers(conversationId, senderId, content);

      // Check for lead qualification triggers
      await this.checkLeadQualificationTriggers(conversationId, senderId, content);

      // Check for sentiment-based triggers
      await this.checkSentimentTriggers(conversationId, senderId, content);

      // Check for business hours automation
      await this.checkBusinessHoursAutomation(conversationId, senderId);

      return { success: true, processed: true };
    } catch (error) {
      console.error('Automation processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Check for auto-response triggers
  async checkAutoResponseTriggers(conversationId, senderId, content) {
    const contentLower = content.toLowerCase();

    for (const [category, template] of Object.entries(this.autoResponseTemplates)) {
      const triggered = template.triggers.some(trigger => 
        contentLower.includes(trigger.toLowerCase())
      );

      if (triggered) {
        // Select random response
        const response = template.responses[Math.floor(Math.random() * template.responses.length)];
        
        // Send auto-response
        await this.sendAutoResponse(conversationId, senderId, response, category);
        
        // Log automation action
        await securityAuditService.logAuditEvent({
          userId: senderId,
          eventType: 'automation_action',
          resourceType: 'message',
          resourceId: conversationId,
          action: 'AUTO_RESPONSE_SENT',
          riskLevel: 'low',
          metadata: {
            triggerCategory: category,
            triggerKeywords: template.triggers.filter(t => contentLower.includes(t.toLowerCase())),
            responseLength: response.length
          }
        });

        break; // Only trigger one auto-response per message
      }
    }
  }

  // Check for lead qualification triggers
  async checkLeadQualificationTriggers(conversationId, senderId, content) {
    const leadKeywords = [
      'interested in buying', 'want to purchase', 'need a quote', 
      'looking for supplier', 'bulk order', 'wholesale', 'partnership',
      'business opportunity', 'investment', 'collaboration'
    ];

    const contentLower = content.toLowerCase();
    const isLead = leadKeywords.some(keyword => contentLower.includes(keyword));

    if (isLead) {
      // Create lead record
      await this.createLeadFromConversation(conversationId, senderId, content);
      
      // Schedule follow-up
      await this.scheduleFollowUp(conversationId, senderId, 'lead_qualification', 24); // 24 hours
      
      // Send notification to sales team
      await this.sendNotificationToSalesTeam(conversationId, senderId, 'New qualified lead detected');
    }
  }

  // Check for sentiment-based triggers
  async checkSentimentTriggers(conversationId, senderId, content) {
    // Simple sentiment analysis (in production, use AI service)
    const negativeWords = [
      'angry', 'frustrated', 'disappointed', 'terrible', 'awful', 
      'hate', 'worst', 'horrible', 'disgusted', 'furious'
    ];

    const contentLower = content.toLowerCase();
    const isNegative = negativeWords.some(word => contentLower.includes(word));

    if (isNegative) {
      // Escalate to manager
      await this.escalateToManager(conversationId, senderId, 'Negative sentiment detected');
      
      // Send empathetic auto-response
      const empathyResponse = "I understand your frustration, and I sincerely apologize for any inconvenience. Let me connect you with a senior team member who can help resolve this immediately.";
      await this.sendAutoResponse(conversationId, senderId, empathyResponse, 'sentiment_escalation');
    }
  }

  // Check business hours automation
  async checkBusinessHoursAutomation(conversationId, senderId) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Business hours: Monday-Friday, 9 AM - 6 PM
    const isBusinessHours = (day >= 1 && day <= 5) && (hour >= 9 && hour < 18);

    if (!isBusinessHours) {
      // Send out-of-hours auto-response
      const outOfHoursResponse = `Thank you for your message! Our team is currently offline. Business hours are Monday-Friday, 9 AM to 6 PM (GMT+8). We'll respond to your message first thing during business hours.`;
      
      await this.sendAutoResponse(conversationId, senderId, outOfHoursResponse, 'out_of_hours');
    }
  }

  // Send auto-response
  async sendAutoResponse(conversationId, recipientId, content, category) {
    try {
      // Use system user ID (you may need to create a system user)
      const systemUserId = 1; // Assuming system user has ID 1
      
      const messagingService = require('./messagingService');
      
      // Send the auto-response
      await messagingService.sendMessage(
        conversationId,
        systemUserId,
        content,
        'TEXT',
        null,
        null,
        '127.0.0.1', // System IP
        'AfroAsiaConnect-AutomationBot/1.0' // System User Agent
      );

      // Log automation action
      await this.logAutomationAction({
        conversationId,
        recipientId,
        actionType: this.actionTypes.SEND_AUTO_RESPONSE,
        category,
        content,
        success: true
      });

    } catch (error) {
      console.error('Failed to send auto-response:', error);
      
      await this.logAutomationAction({
        conversationId,
        recipientId,
        actionType: this.actionTypes.SEND_AUTO_RESPONSE,
        category,
        content,
        success: false,
        error: error.message
      });
    }
  }

  // Create lead from conversation
  async createLeadFromConversation(conversationId, userId, content) {
    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      if (!user) return;

      // Create lead record (assuming you have a Lead model)
      const lead = await prisma.lead.create({
        data: {
          userId: user.id,
          source: 'messaging_automation',
          status: 'new',
          priority: 'medium',
          description: `Lead generated from conversation. Message: "${content.substring(0, 200)}..."`,
          metadata: {
            conversationId,
            generatedAt: new Date().toISOString(),
            automationGenerated: true
          }
        }
      });

      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.CREATE_LEAD,
        category: 'lead_qualification',
        content: `Lead created with ID: ${lead.id}`,
        success: true
      });

      return lead;
    } catch (error) {
      console.error('Failed to create lead:', error);
      
      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.CREATE_LEAD,
        category: 'lead_qualification',
        content: 'Failed to create lead',
        success: false,
        error: error.message
      });
    }
  }

  // Schedule follow-up
  async scheduleFollowUp(conversationId, userId, type, hoursDelay) {
    try {
      const followUpTime = new Date();
      followUpTime.setHours(followUpTime.getHours() + hoursDelay);

      // Create scheduled follow-up (you may need to create a FollowUp model)
      const followUp = await prisma.followUp.create({
        data: {
          userId: parseInt(userId),
          conversationId: parseInt(conversationId),
          type,
          scheduledFor: followUpTime,
          status: 'pending',
          message: this.getFollowUpMessage(type),
          createdBy: 1 // System user
        }
      });

      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.SCHEDULE_FOLLOW_UP,
        category: type,
        content: `Follow-up scheduled for ${followUpTime.toISOString()}`,
        success: true
      });

      return followUp;
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
      
      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.SCHEDULE_FOLLOW_UP,
        category: type,
        content: 'Failed to schedule follow-up',
        success: false,
        error: error.message
      });
    }
  }

  // Get follow-up message based on type
  getFollowUpMessage(type) {
    const messages = {
      lead_qualification: "Hi! I wanted to follow up on your interest in our products/services. Do you have any questions I can help answer?",
      support_ticket: "Following up on your support request. Has your issue been resolved? Please let me know if you need further assistance.",
      quote_request: "I wanted to check if you had a chance to review the quote we provided. Do you have any questions or need any modifications?",
      general: "Just following up on our previous conversation. Is there anything else I can help you with?"
    };

    return messages[type] || messages.general;
  }

  // Send notification to sales team
  async sendNotificationToSalesTeam(conversationId, userId, message) {
    try {
      // Get sales team members (assuming role-based filtering)
      const salesTeam = await prisma.user.findMany({
        where: {
          role: 'SUPPLIER', // or whatever role represents sales team
          isActive: true
        },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      // Create notifications for each sales team member
      for (const member of salesTeam) {
        await prisma.notification.create({
          data: {
            userId: member.id,
            type: 'lead_notification',
            message,
            link: `/messaging?conversation=${conversationId}`,
            isRead: false
          }
        });
      }

      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.SEND_NOTIFICATION,
        category: 'sales_notification',
        content: `Notification sent to ${salesTeam.length} sales team members`,
        success: true
      });

    } catch (error) {
      console.error('Failed to send sales notification:', error);
    }
  }

  // Escalate to manager
  async escalateToManager(conversationId, userId, reason) {
    try {
      // Find managers (assuming role-based filtering)
      const managers = await prisma.user.findMany({
        where: {
          isAdmin: true,
          isActive: true
        },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      // Create escalation notifications
      for (const manager of managers) {
        await prisma.notification.create({
          data: {
            userId: manager.id,
            type: 'escalation',
            message: `Conversation escalated: ${reason}`,
            link: `/messaging?conversation=${conversationId}`,
            isRead: false
          }
        });
      }

      await this.logAutomationAction({
        conversationId,
        recipientId: userId,
        actionType: this.actionTypes.ESCALATE_TO_MANAGER,
        category: 'escalation',
        content: `Escalated to ${managers.length} managers: ${reason}`,
        success: true
      });

    } catch (error) {
      console.error('Failed to escalate to manager:', error);
    }
  }

  // Log automation action
  async logAutomationAction(actionData) {
    try {
      await prisma.automationLog.create({
        data: {
          conversationId: parseInt(actionData.conversationId),
          userId: parseInt(actionData.recipientId),
          actionType: actionData.actionType,
          category: actionData.category,
          content: actionData.content,
          success: actionData.success,
          errorMessage: actionData.error,
          metadata: actionData.metadata || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log automation action:', error);
    }
  }

  // Get automation analytics
  async getAutomationAnalytics(startDate, endDate, userId = null) {
    try {
      const whereClause = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      if (userId) {
        whereClause.userId = parseInt(userId);
      }

      const logs = await prisma.automationLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      // Generate analytics
      const analytics = {
        totalActions: logs.length,
        successfulActions: logs.filter(log => log.success).length,
        failedActions: logs.filter(log => !log.success).length,
        actionsByType: {},
        actionsByCategory: {},
        successRate: 0
      };

      // Calculate success rate
      if (analytics.totalActions > 0) {
        analytics.successRate = (analytics.successfulActions / analytics.totalActions) * 100;
      }

      // Group by action type
      logs.forEach(log => {
        analytics.actionsByType[log.actionType] = (analytics.actionsByType[log.actionType] || 0) + 1;
        analytics.actionsByCategory[log.category] = (analytics.actionsByCategory[log.category] || 0) + 1;
      });

      return {
        success: true,
        analytics,
        logs: logs.slice(0, 100) // Return first 100 logs
      };

    } catch (error) {
      console.error('Failed to get automation analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user workflows
  async getUserWorkflows(userId) {
    try {
      const workflows = await prisma.automationWorkflow.findMany({
        where: {
          userId: parseInt(userId),
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        workflows
      };

    } catch (error) {
      console.error('Failed to get user workflows:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AutomationService();
