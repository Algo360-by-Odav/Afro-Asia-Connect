const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIMessageService {
  /**
   * Generate smart message suggestions based on context
   */
  async generateMessageSuggestions(userId, conversationId, context = {}) {
    try {
      // Get conversation history for context
      const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          sender: { select: { name: true, role: true } }
        }
      });

      // Get user's message patterns
      const userPatterns = await this.getUserMessagePatterns(userId);
      
      // Generate contextual suggestions
      const suggestions = await this.generateContextualSuggestions(
        recentMessages, 
        userPatterns, 
        context
      );

      return {
        success: true,
        suggestions,
        context: {
          conversationTone: this.analyzeConversationTone(recentMessages),
          urgencyLevel: this.detectUrgencyLevel(recentMessages),
          businessContext: context.businessContext || 'general'
        }
      };
    } catch (error) {
      console.error('Error generating message suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-complete for common phrases
   */
  async getAutoCompleteOptions(userId, partialText, context = {}) {
    try {
      const commonPhrases = await this.getCommonPhrases(userId, context);
      const templateMatches = await this.getTemplateMatches(partialText);
      
      const suggestions = [
        ...this.filterPhrasesByInput(commonPhrases, partialText),
        ...templateMatches
      ].slice(0, 5); // Limit to top 5 suggestions

      return {
        success: true,
        suggestions: suggestions.map(s => ({
          text: s.text,
          confidence: s.confidence,
          type: s.type, // 'phrase', 'template', 'smart'
          category: s.category
        }))
      };
    } catch (error) {
      console.error('Error getting auto-complete options:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze message sentiment
   */
  async analyzeSentiment(messageText) {
    try {
      // Simple sentiment analysis (in production, use AI service like OpenAI)
      const sentiment = this.calculateSentiment(messageText);
      
      return {
        success: true,
        sentiment: {
          score: sentiment.score, // -1 to 1
          label: sentiment.label, // 'positive', 'negative', 'neutral'
          confidence: sentiment.confidence,
          emotions: sentiment.emotions, // ['joy', 'anger', 'fear', etc.]
          businessTone: sentiment.businessTone // 'professional', 'casual', 'urgent'
        }
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Language translation for international communication
   */
  async translateMessage(messageText, fromLanguage, toLanguage) {
    try {
      // In production, integrate with Google Translate API or similar
      const translation = await this.performTranslation(messageText, fromLanguage, toLanguage);
      
      return {
        success: true,
        translation: {
          originalText: messageText,
          translatedText: translation.text,
          fromLanguage,
          toLanguage,
          confidence: translation.confidence,
          detectedLanguage: translation.detectedLanguage
        }
      };
    } catch (error) {
      console.error('Error translating message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * AI chatbot for customer support
   */
  async generateChatbotResponse(userMessage, context = {}) {
    try {
      const intent = await this.detectIntent(userMessage);
      const response = await this.generateResponse(intent, context);
      
      return {
        success: true,
        response: {
          text: response.text,
          intent: intent.name,
          confidence: intent.confidence,
          actions: response.actions, // Follow-up actions
          escalateToHuman: response.escalateToHuman
        }
      };
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async getUserMessagePatterns(userId) {
    const patterns = await prisma.message.groupBy({
      by: ['content'],
      where: { senderId: userId },
      _count: { content: true },
      orderBy: { _count: { content: 'desc' } },
      take: 20
    });

    return patterns.map(p => ({
      phrase: p.content,
      frequency: p._count.content,
      category: this.categorizeMessage(p.content)
    }));
  }

  generateContextualSuggestions(recentMessages, userPatterns, context) {
    const suggestions = [];
    
    // Business context suggestions
    if (context.businessContext === 'negotiation') {
      suggestions.push(
        { text: "Let me review this proposal and get back to you.", confidence: 0.9, type: 'smart' },
        { text: "I'd like to discuss the terms in more detail.", confidence: 0.8, type: 'smart' },
        { text: "Can we schedule a call to finalize this?", confidence: 0.85, type: 'smart' }
      );
    } else if (context.businessContext === 'support') {
      suggestions.push(
        { text: "I understand your concern. Let me help you with that.", confidence: 0.9, type: 'smart' },
        { text: "Thank you for bringing this to our attention.", confidence: 0.85, type: 'smart' },
        { text: "I'll escalate this to our technical team right away.", confidence: 0.8, type: 'smart' }
      );
    } else {
      // General business suggestions
      suggestions.push(
        { text: "Thank you for your message. I'll respond shortly.", confidence: 0.8, type: 'smart' },
        { text: "I appreciate you reaching out to us.", confidence: 0.75, type: 'smart' },
        { text: "Let me know if you need any additional information.", confidence: 0.85, type: 'smart' }
      );
    }

    return suggestions;
  }

  analyzeConversationTone(messages) {
    // Analyze recent messages for tone
    const toneIndicators = {
      professional: ['please', 'thank you', 'regards', 'sincerely'],
      casual: ['hey', 'thanks', 'cool', 'awesome'],
      urgent: ['urgent', 'asap', 'immediately', 'critical']
    };

    let scores = { professional: 0, casual: 0, urgent: 0 };
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.keys(toneIndicators).forEach(tone => {
        toneIndicators[tone].forEach(indicator => {
          if (content.includes(indicator)) scores[tone]++;
        });
      });
    });

    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  detectUrgencyLevel(messages) {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
    const recentMessage = messages[0]?.content.toLowerCase() || '';
    
    return urgentKeywords.some(keyword => recentMessage.includes(keyword)) ? 'high' : 'normal';
  }

  calculateSentiment(text) {
    // Simple sentiment analysis (replace with AI service in production)
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'pleased', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'disappointed', 'frustrated'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    const normalizedScore = Math.max(-1, Math.min(1, score / words.length * 10));
    
    return {
      score: normalizedScore,
      label: normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(normalizedScore),
      emotions: this.detectEmotions(text),
      businessTone: this.detectBusinessTone(text)
    };
  }

  detectEmotions(text) {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'pleased', 'delighted'],
      anger: ['angry', 'frustrated', 'annoyed', 'mad'],
      fear: ['worried', 'concerned', 'anxious', 'nervous'],
      sadness: ['sad', 'disappointed', 'upset', 'unhappy']
    };

    const detectedEmotions = [];
    const lowerText = text.toLowerCase();

    Object.keys(emotionKeywords).forEach(emotion => {
      if (emotionKeywords[emotion].some(keyword => lowerText.includes(keyword))) {
        detectedEmotions.push(emotion);
      }
    });

    return detectedEmotions;
  }

  detectBusinessTone(text) {
    const professionalIndicators = ['please', 'thank you', 'regards', 'sincerely', 'kindly'];
    const casualIndicators = ['hey', 'hi there', 'thanks', 'cool'];
    const urgentIndicators = ['urgent', 'asap', 'immediately', 'critical'];

    const lowerText = text.toLowerCase();
    
    if (urgentIndicators.some(indicator => lowerText.includes(indicator))) return 'urgent';
    if (professionalIndicators.some(indicator => lowerText.includes(indicator))) return 'professional';
    if (casualIndicators.some(indicator => lowerText.includes(indicator))) return 'casual';
    
    return 'neutral';
  }

  async performTranslation(text, fromLang, toLang) {
    // Mock translation - integrate with Google Translate API in production
    return {
      text: `[Translated from ${fromLang} to ${toLang}] ${text}`,
      confidence: 0.95,
      detectedLanguage: fromLang
    };
  }

  async detectIntent(message) {
    const intents = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      question: ['what', 'how', 'when', 'where', 'why', '?'],
      complaint: ['problem', 'issue', 'wrong', 'error', 'not working'],
      request: ['can you', 'please', 'need', 'want', 'help'],
      goodbye: ['bye', 'goodbye', 'see you', 'talk later']
    };

    const lowerMessage = message.toLowerCase();
    let detectedIntent = 'unknown';
    let confidence = 0;

    Object.keys(intents).forEach(intent => {
      const matches = intents[intent].filter(keyword => lowerMessage.includes(keyword));
      if (matches.length > 0) {
        const intentConfidence = matches.length / intents[intent].length;
        if (intentConfidence > confidence) {
          detectedIntent = intent;
          confidence = intentConfidence;
        }
      }
    });

    return { name: detectedIntent, confidence };
  }

  async generateResponse(intent, context) {
    const responses = {
      greeting: {
        text: "Hello! How can I help you today?",
        actions: ['show_menu'],
        escalateToHuman: false
      },
      question: {
        text: "I'd be happy to help answer your question. Can you provide more details?",
        actions: ['request_details'],
        escalateToHuman: false
      },
      complaint: {
        text: "I'm sorry to hear about this issue. Let me connect you with our support team to resolve this quickly.",
        actions: ['escalate_to_support'],
        escalateToHuman: true
      },
      request: {
        text: "I'll do my best to help you with that. What specifically do you need assistance with?",
        actions: ['clarify_request'],
        escalateToHuman: false
      },
      goodbye: {
        text: "Thank you for contacting us. Have a great day!",
        actions: ['end_conversation'],
        escalateToHuman: false
      },
      unknown: {
        text: "I'm not sure I understand. Could you please rephrase your question or let me connect you with a human agent?",
        actions: ['request_clarification', 'offer_human_agent'],
        escalateToHuman: false
      }
    };

    return responses[intent.name] || responses.unknown;
  }

  async getCommonPhrases(userId, context) {
    // Get user's most common phrases
    const userPhrases = await prisma.message.groupBy({
      by: ['content'],
      where: { senderId: userId },
      _count: { content: true },
      orderBy: { _count: { content: 'desc' } },
      take: 10
    });

    return userPhrases.map(p => ({
      text: p.content,
      confidence: 0.8,
      type: 'phrase',
      category: 'user_common'
    }));
  }

  async getTemplateMatches(partialText) {
    const templates = await prisma.messageTemplate.findMany({
      where: {
        content: { contains: partialText, mode: 'insensitive' }
      },
      take: 5
    });

    return templates.map(t => ({
      text: t.content,
      confidence: 0.9,
      type: 'template',
      category: t.category
    }));
  }

  filterPhrasesByInput(phrases, input) {
    return phrases.filter(phrase => 
      phrase.text.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 3);
  }

  categorizeMessage(content) {
    const categories = {
      greeting: ['hello', 'hi', 'good morning'],
      business: ['proposal', 'contract', 'meeting'],
      support: ['help', 'issue', 'problem'],
      closing: ['thanks', 'regards', 'best']
    };

    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
}

module.exports = new AIMessageService();
