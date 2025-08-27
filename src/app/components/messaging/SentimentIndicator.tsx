'use client';

import React, { useState, useEffect } from 'react';

interface SentimentIndicatorProps {
  message: string;
  userId?: string;
  conversationId?: string;
  showDetails?: boolean;
  className?: string;
}

interface SentimentData {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({
  message,
  userId,
  conversationId,
  showDetails = false,
  className = ''
}) => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);

  // Analyze sentiment when message changes
  useEffect(() => {
    if (!message.trim()) {
      setSentimentData(null);
      return;
    }

    const analyzeSentiment = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/sentiment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            userId,
            conversationId
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSentimentData({
            sentiment: data.sentiment,
            confidence: data.confidence,
            scores: data.scores
          });
        }
      } catch (error) {
        console.error('Error analyzing sentiment:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce sentiment analysis
    const timeoutId = setTimeout(analyzeSentiment, 500);
    return () => clearTimeout(timeoutId);
  }, [message, userId, conversationId]);

  if (!sentimentData && !loading) return null;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-1 text-xs ${className}`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        <span className="text-gray-500">Analyzing...</span>
      </div>
    );
  }

  if (!sentimentData) return null;

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      {showDetails ? (
        <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getSentimentColor(sentimentData.sentiment)}`}>
          <div className="flex items-center space-x-1">
            <span>{getSentimentIcon(sentimentData.sentiment)}</span>
            <span className="capitalize">{sentimentData.sentiment}</span>
            <span className="opacity-75">
              ({Math.round(sentimentData.confidence * 100)}%)
            </span>
          </div>
        </div>
      ) : (
        <span 
          className="text-sm cursor-help" 
          title={`Sentiment: ${sentimentData.sentiment} (${Math.round(sentimentData.confidence * 100)}% confidence)`}
        >
          {getSentimentIcon(sentimentData.sentiment)}
        </span>
      )}
    </div>
  );
};

// Conversation Sentiment Overview Component
interface ConversationSentimentProps {
  conversationId: string;
  userId?: string;
}

export const ConversationSentiment: React.FC<ConversationSentimentProps> = ({
  conversationId,
  userId
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/ai/insights/${conversationId}?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        }
      } catch (error) {
        console.error('Error fetching conversation insights:', error);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchInsights();
    }
  }, [conversationId, userId]);

  if (loading) {
    return (
      <div className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
          <span className="text-sm text-gray-600">Analyzing conversation...</span>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📊</span>
          <h4 className="text-sm font-medium text-blue-900">Conversation Insights</h4>
        </div>
        <span className="text-xs text-blue-700">AI Analysis</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Sentiment:</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            insights.overallSentiment === 'positive' ? 'text-green-600 bg-green-50 border-green-200' :
            insights.overallSentiment === 'negative' ? 'text-red-600 bg-red-50 border-red-200' :
            'text-gray-600 bg-gray-50 border-gray-200'
          }`}>
            {
              insights.overallSentiment === 'positive' ? '😊' :
              insights.overallSentiment === 'negative' ? '😟' :
              '😐'
            } {insights.overallSentiment}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Messages:</span>
          <span className="text-sm font-medium">{insights.messageCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Participants:</span>
          <span className="text-sm font-medium">{insights.participantCount}</span>
        </div>

        {insights.insights && insights.insights.length > 0 && (
          <div className="mt-3 pt-2 border-t border-blue-900/20">
            <h5 className="text-xs font-medium text-blue-900 mb-1">AI Insights:</h5>
            {insights.insights.map((insight: any, index: number) => (
              <div 
                key={index}
                className={`text-xs p-2 rounded ${
                  insight.type === 'warning' 
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {insight.type === 'warning' ? '⚠️' : '✅'} {insight.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentIndicator;
