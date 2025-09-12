'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SearchResult {
  id: number;
  content: string;
  createdAt: string;
  messageType: string;
  fileName?: string;
  sender: {
    id: number;
    firstName?: string;
    lastName?: string;
  };
  conversation: {
    id: number;
    participants: Array<{
      id: number;
      firstName?: string;
      lastName?: string;
    }>;
  };
}

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (conversationId: number) => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ isOpen, onClose, onSelectMessage }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim().length >= 2) {
      setSearchTimeout(setTimeout(() => {
        performSearch(query.trim());
      }, 500));
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!user) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messaging/search?userId=${user.id}&q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Search failed:', response.status);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getOtherParticipant = (conversation: SearchResult['conversation']) => {
    return conversation.participants[0] || { firstName: 'Unknown', lastName: 'User' };
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">🔍 Search Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, files, or content..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
            {isSearching && (
              <div className="absolute right-3 top-2.5 text-blue-500">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {query.length < 2 ? (
            <div className="text-center text-gray-500 py-8">
              💡 Type at least 2 characters to search
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="text-center text-gray-500 py-8">
              😔 No messages found for "{query}"
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => {
                const otherUser = getOtherParticipant(result.conversation);
                return (
                  <div
                    key={result.id}
                    onClick={() => {
                      onSelectMessage(result.conversation.id);
                      onClose();
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-700">
                            👤 {result.sender.firstName || 'Unknown'} {result.sender.lastName || ''}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-sm text-gray-600">
                            {otherUser.firstName} {otherUser.lastName}
                          </span>
                        </div>
                        
                        {result.messageType === 'FILE' && result.fileName ? (
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <span>📎</span>
                            <span>{highlightText(result.fileName, query)}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-800">
                            {highlightText(result.content, query)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400 ml-4">
                        {formatTime(result.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
          💡 Click on any result to jump to that conversation
        </div>
      </div>
    </div>
  );
};

export default MessageSearch;
