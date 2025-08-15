'use client';

import React, { useState, useEffect } from 'react';

interface SmartSuggestionsProps {
  conversationId: string;
  lastMessage?: string;
  userId: string;
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
}

interface Suggestion {
  text: string;
  confidence?: number;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  conversationId,
  lastMessage,
  userId,
  onSuggestionSelect,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch smart suggestions
  const fetchSuggestions = async () => {
    if (!isVisible || !conversationId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          lastMessage,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching smart suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions when component becomes visible or lastMessage changes
  useEffect(() => {
    if (isVisible) {
      fetchSuggestions();
    }
  }, [isVisible, lastMessage, conversationId, userId]);

  // Don't render if not visible or no suggestions
  if (!isVisible || (!loading && suggestions.length === 0 && !error)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <h4 className="text-sm font-medium text-gray-700">Smart Suggestions</h4>
        </div>
        <span className="text-xs text-gray-500">AI-Powered</span>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Generating suggestions...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 mb-2">
            Click a suggestion to use it:
          </p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionSelect(suggestion)}
              className="w-full text-left p-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md text-sm transition-colors duration-200 group"
            >
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 group-hover:text-blue-600 mt-0.5">💡</span>
                <span className="text-gray-700 group-hover:text-blue-700 flex-1">
                  {suggestion}
                </span>
              </div>
            </button>
          ))}
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} available
            </span>
            <button
              onClick={fetchSuggestions}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {!loading && suggestions.length === 0 && !error && (
        <div className="text-sm text-gray-500 text-center py-2">
          No suggestions available for this context
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
