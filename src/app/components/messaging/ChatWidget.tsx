'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Send, X, Minimize2, Users, Phone, Video } from 'lucide-react';

interface ChatWidgetProps {
  className?: string;
  defaultMinimized?: boolean;
}

export default function ChatWidget({ className = '', defaultMinimized = true }: ChatWidgetProps) {
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    isConnected, 
    sendMessage, 
    isUserOnline,
    onlineUsers,
    setActiveConversation 
  } = useSocket();
  
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [newMessage, setNewMessage] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await sendMessage(activeConversation.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants || !user) return null;
    return conversation.participants.find((p: any) => p.id !== user.id);
  };

  const unreadCount = conversations.reduce((count, conv) => {
    return count + (conv.unreadCount || 0);
  }, 0);

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 relative"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">
              {activeConversation ? 
                getOtherParticipant(activeConversation)?.firstName || 'Chat' : 
                'Messages'
              }
            </span>
            {activeConversation && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  isUserOnline(getOtherParticipant(activeConversation)?.id) ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-xs">
                  {isUserOnline(getOtherParticipant(activeConversation)?.id) ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {activeConversation && (
              <>
                <button className="p-1 hover:bg-blue-700 rounded">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-blue-700 rounded">
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Conversations List */}
          {showConversations && !activeConversation && (
            <div className="w-full border-r border-gray-200 overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Conversations</h3>
                  <span className="text-xs text-gray-500">{conversations.length}</span>
                </div>
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const isOnline = otherParticipant && isUserOnline(otherParticipant.id);
                      
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setActiveConversation(conversation)}
                          className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {otherParticipant?.firstName?.[0] || '?'}
                                </span>
                              </div>
                              {isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {otherParticipant?.firstName || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Area */}
          {activeConversation && (
            <div className="flex-1 flex flex-col">
              {/* Back button for mobile */}
              <div className="p-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to conversations
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-1">Disconnected - trying to reconnect...</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
