const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Get smart message suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const { conversationId, lastMessage, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        error: 'conversationId and userId are required' 
      });
    }

    const suggestions = await aiService.generateSmartSuggestions(
      conversationId, 
      lastMessage, 
      userId
    );

    // Store AI interaction for learning
    await aiService.storeAIInteraction(
      userId, 
      conversationId, 
      'smart_suggestions', 
      { lastMessage, suggestionsCount: suggestions.length }
    );

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate smart suggestions' 
    });
  }
});

// Analyze message sentiment
router.post('/sentiment', async (req, res) => {
  try {
    const { message, userId, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'message is required' 
      });
    }

    const sentimentAnalysis = aiService.analyzeSentiment(message);

    // Store AI interaction
    if (userId && conversationId) {
      await aiService.storeAIInteraction(
        userId, 
        conversationId, 
        'sentiment_analysis', 
        { message: message.substring(0, 100), ...sentimentAnalysis }
      );
    }

    res.json({
      success: true,
      ...sentimentAnalysis
    });

  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ 
      error: 'Failed to analyze sentiment' 
    });
  }
});

// Get auto-complete suggestions
router.post('/autocomplete', async (req, res) => {
  try {
    const { partialText, conversationId, userId } = req.body;

    if (!partialText) {
      return res.status(400).json({ 
        error: 'partialText is required' 
      });
    }

    // Get conversation context if provided
    let conversationContext = [];
    if (conversationId) {
      // This would fetch recent messages for context
      // For now, we'll pass empty array
      conversationContext = [];
    }

    const suggestions = aiService.generateAutoComplete(partialText, conversationContext);

    // Store AI interaction
    if (userId && conversationId) {
      await aiService.storeAIInteraction(
        userId, 
        conversationId, 
        'autocomplete', 
        { partialText, suggestionsCount: suggestions.length }
      );
    }

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate autocomplete suggestions' 
    });
  }
});

// Get conversation insights
router.get('/insights/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ 
        error: 'conversationId is required' 
      });
    }

    const insights = await aiService.getConversationInsights(conversationId);

    // Store AI interaction
    if (userId) {
      await aiService.storeAIInteraction(
        userId, 
        conversationId, 
        'conversation_insights', 
        { insightsCount: insights.insights.length, overallSentiment: insights.overallSentiment }
      );
    }

    res.json({
      success: true,
      ...insights
    });

  } catch (error) {
    console.error('Error getting conversation insights:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation insights' 
    });
  }
});

// Batch sentiment analysis for multiple messages
router.post('/sentiment/batch', async (req, res) => {
  try {
    const { messages, userId, conversationId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'messages array is required' 
      });
    }

    const results = messages.map(message => ({
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      ...aiService.analyzeSentiment(message)
    }));

    // Store AI interaction
    if (userId && conversationId) {
      await aiService.storeAIInteraction(
        userId, 
        conversationId, 
        'batch_sentiment_analysis', 
        { messageCount: messages.length }
      );
    }

    res.json({
      success: true,
      results,
      count: results.length,
      summary: {
        positive: results.filter(r => r.sentiment === 'positive').length,
        negative: results.filter(r => r.sentiment === 'negative').length,
        neutral: results.filter(r => r.sentiment === 'neutral').length
      }
    });

  } catch (error) {
    console.error('Error in batch sentiment analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze sentiment for messages' 
    });
  }
});

// Get AI usage statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '7d' } = req.query;

    // This would typically query AI interaction logs
    // For now, return mock data
    const stats = {
      period,
      totalInteractions: 156,
      suggestionUsage: 89,
      sentimentAnalyses: 45,
      autocompleteUsage: 22,
      topFeatures: [
        { feature: 'Smart Suggestions', usage: 89, percentage: 57 },
        { feature: 'Sentiment Analysis', usage: 45, percentage: 29 },
        { feature: 'Auto-complete', usage: 22, percentage: 14 }
      ],
      productivityGains: {
        timesSaved: '2.5 hours',
        messagesImproved: 67,
        responseTimeReduction: '35%'
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting AI stats:', error);
    res.status(500).json({ 
      error: 'Failed to get AI statistics' 
    });
  }
});

module.exports = router;
