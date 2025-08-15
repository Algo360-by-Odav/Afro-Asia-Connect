const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIService {
  constructor() {
    // Common business phrases and responses for smart suggestions
    this.businessPhrases = {
      greetings: [
        "Good morning! How can I assist you today?",
        "Hello! Thank you for reaching out.",
        "Hi there! I hope you're having a great day.",
        "Good afternoon! How may I help you?"
      ],
      followUp: [
        "Thank you for your patience. I'll get back to you shortly.",
        "I'll review this and provide an update by end of day.",
        "Let me check on this and circle back with you.",
        "I'll coordinate with the team and follow up soon."
      ],
      closing: [
        "Thank you for your time. Have a wonderful day!",
        "Please don't hesitate to reach out if you need anything else.",
        "I appreciate your business. Looking forward to working together.",
        "Thank you for choosing our services. Best regards!"
      ],
      scheduling: [
        "Would you be available for a call this week?",
        "Let's schedule a meeting to discuss this further.",
        "When would be a good time to connect?",
        "I'll send you a calendar invite shortly."
      ]
    };

    // Sentiment keywords for analysis
    this.sentimentKeywords = {
      positive: ['great', 'excellent', 'amazing', 'perfect', 'wonderful', 'fantastic', 'love', 'happy', 'satisfied', 'pleased'],
      negative: ['terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'disappointed', 'upset', 'problem', 'issue'],
      neutral: ['okay', 'fine', 'alright', 'maybe', 'perhaps', 'consider', 'think', 'possible']
    };
  }

  // Generate smart message suggestions based on context
  async generateSmartSuggestions(conversationId, lastMessage, userId) {
    try {
      // Get conversation history for context
      const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      const suggestions = [];
      const lastMessageLower = lastMessage?.toLowerCase() || '';

      // Context-aware suggestions
      if (lastMessageLower.includes('thank') || lastMessageLower.includes('thanks')) {
        suggestions.push(...[
          "You're very welcome! Happy to help.",
          "My pleasure! Let me know if you need anything else.",
          "Glad I could assist! Have a great day!"
        ]);
      }

      if (lastMessageLower.includes('question') || lastMessageLower.includes('help')) {
        suggestions.push(...[
          "I'd be happy to help! What specific information do you need?",
          "Of course! Let me provide you with the details.",
          "Absolutely! I'll walk you through this step by step."
        ]);
      }

      if (lastMessageLower.includes('meeting') || lastMessageLower.includes('call')) {
        suggestions.push(...this.businessPhrases.scheduling);
      }

      if (lastMessageLower.includes('price') || lastMessageLower.includes('cost') || lastMessageLower.includes('quote')) {
        suggestions.push(...[
          "I'll prepare a detailed quote for you right away.",
          "Let me get you the most current pricing information.",
          "I'll have our pricing specialist reach out to you today."
        ]);
      }

      // If no specific context, provide general business responses
      if (suggestions.length === 0) {
        const randomCategory = Object.keys(this.businessPhrases)[Math.floor(Math.random() * Object.keys(this.businessPhrases).length)];
        suggestions.push(...this.businessPhrases[randomCategory].slice(0, 2));
      }

      // Limit to 3 suggestions
      return suggestions.slice(0, 3);

    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return [];
    }
  }

  // Analyze message sentiment
  analyzeSentiment(message) {
    const messageLower = message.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Count sentiment keywords
    this.sentimentKeywords.positive.forEach(word => {
      if (messageLower.includes(word)) positiveScore++;
    });

    this.sentimentKeywords.negative.forEach(word => {
      if (messageLower.includes(word)) negativeScore++;
    });

    this.sentimentKeywords.neutral.forEach(word => {
      if (messageLower.includes(word)) neutralScore++;
    });

    // Determine overall sentiment
    let sentiment = 'neutral';
    let confidence = 0.5;

    if (positiveScore > negativeScore && positiveScore > 0) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveScore * 0.1));
    } else if (negativeScore > positiveScore && negativeScore > 0) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeScore * 0.1));
    }

    return {
      sentiment,
      confidence,
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore
      }
    };
  }

  // Generate auto-complete suggestions
  generateAutoComplete(partialText, conversationContext = []) {
    const partial = partialText.toLowerCase().trim();
    const suggestions = [];

    // Common business auto-completions
    const autoCompleteMap = {
      'thank': ['Thank you for your time', 'Thank you for the update', 'Thank you for your patience'],
      'please': ['Please let me know', 'Please find attached', 'Please confirm'],
      'i will': ['I will follow up shortly', 'I will get back to you', 'I will check on this'],
      'let me': ['Let me check on this', 'Let me get back to you', 'Let me know if you need anything'],
      'we can': ['We can schedule a call', 'We can discuss this further', 'We can arrange a meeting'],
      'would you': ['Would you be available?', 'Would you like to schedule a call?', 'Would you prefer email or phone?'],
      'looking forward': ['Looking forward to hearing from you', 'Looking forward to our meeting', 'Looking forward to working together']
    };

    // Find matching auto-completions
    Object.keys(autoCompleteMap).forEach(key => {
      if (key.startsWith(partial) || partial.includes(key)) {
        suggestions.push(...autoCompleteMap[key]);
      }
    });

    // Add context-based suggestions from recent messages
    if (conversationContext.length > 0) {
      const recentTopics = this.extractTopics(conversationContext);
      recentTopics.forEach(topic => {
        if (topic.toLowerCase().includes(partial)) {
          suggestions.push(`Regarding ${topic}, I wanted to follow up`);
        }
      });
    }

    return suggestions.slice(0, 5);
  }

  // Extract topics from conversation context
  extractTopics(messages) {
    const topics = [];
    const commonTopics = ['meeting', 'project', 'proposal', 'contract', 'delivery', 'payment', 'schedule', 'deadline'];
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      commonTopics.forEach(topic => {
        if (content.includes(topic) && !topics.includes(topic)) {
          topics.push(topic);
        }
      });
    });

    return topics;
  }

  // Store AI interaction for learning
  async storeAIInteraction(userId, conversationId, interactionType, data) {
    try {
      // This would typically store in a dedicated AI interactions table
      // For now, we'll log for analytics
      console.log('AI Interaction:', {
        userId,
        conversationId,
        interactionType,
        data,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error storing AI interaction:', error);
      return false;
    }
  }

  // Get conversation insights
  async getConversationInsights(conversationId) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: parseInt(conversationId)
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (messages.length === 0) {
        return { insights: [], overallSentiment: 'neutral' };
      }

      // Analyze sentiment trends
      const sentimentTrend = messages.map(msg => ({
        ...this.analyzeSentiment(msg.content),
        timestamp: msg.createdAt,
        senderId: msg.senderId
      }));

      // Calculate overall sentiment
      const avgSentiment = sentimentTrend.reduce((acc, curr) => {
        acc[curr.sentiment] = (acc[curr.sentiment] || 0) + 1;
        return acc;
      }, {});

      const overallSentiment = Object.keys(avgSentiment).reduce((a, b) => 
        avgSentiment[a] > avgSentiment[b] ? a : b
      );

      // Generate insights
      const insights = [];
      
      if (sentimentTrend.filter(s => s.sentiment === 'negative').length > 2) {
        insights.push({
          type: 'warning',
          message: 'Multiple negative sentiment messages detected. Consider escalating or providing additional support.'
        });
      }

      if (messages.length > 10 && sentimentTrend.filter(s => s.sentiment === 'positive').length > 7) {
        insights.push({
          type: 'success',
          message: 'Highly positive conversation! Great opportunity for upselling or referral requests.'
        });
      }

      return {
        insights,
        overallSentiment,
        sentimentTrend: sentimentTrend.slice(-10), // Last 10 messages
        messageCount: messages.length,
        participantCount: new Set(messages.map(m => m.senderId)).size
      };

    } catch (error) {
      console.error('Error getting conversation insights:', error);
      return { insights: [], overallSentiment: 'neutral' };
    }
  }
}

module.exports = new AIService();
