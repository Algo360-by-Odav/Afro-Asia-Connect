'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import EmojiPicker from './EmojiPicker';
import MessageSearch from './MessageSearch';
import MessageTemplates from './MessageTemplates';
import MessageScheduler from './MessageScheduler';
import AnalyticsDashboard from './AnalyticsDashboard';
import SmartSuggestions from './SmartSuggestions';
import SentimentIndicator, { ConversationSentiment } from './SentimentIndicator';
import AutoComplete from './AutoComplete';
import NotificationSettings from './NotificationSettings';

export default function ChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    isConnected, 
    sendMessage, 
    startTyping,
    stopTyping,
    typingUsers,
    isUserOnline,
    onlineUsers,
    setActiveConversation,
    markAsRead 
  } = useSocket();
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showMobileConversations, setShowMobileConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (activeConversation && activeConversation.id && user) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, user]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;
    
    if (selectedFile) {
      await handleFileUpload();
    } else if (activeConversation && activeConversation.id) {
      sendMessage(activeConversation.id, newMessage);
      setNewMessage('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !activeConversation) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('conversationId', activeConversation?.id?.toString() || '');
    formData.append('senderId', user?.id?.toString() || '');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (response.ok) {
        setSelectedFile(null);
        setNewMessage('');
      } else {
        console.error('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    return conversation.participants.find((p: any) => p.id !== user?.id);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTyping = () => {
    if (!activeConversation) return;
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    if (activeConversation && activeConversation.id) {
      startTyping(activeConversation.id);
      setTypingTimeout(setTimeout(() => stopTyping(activeConversation.id), 2000));
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    if (activeConversation) {
      handleTyping();
    }
  };

  const handleTemplateSelect = (content: string) => {
    setNewMessage(content);
    if (activeConversation) {
      handleTyping();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] sm:h-5/6 flex overflow-hidden relative">
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          {/* Feature buttons */}
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 text-gray-500 hover:text-blue-900 hover:bg-blue-900/10 rounded-md transition-colors"
              title="Search messages"
            >
              🔍
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Message templates"
            >
              📋
            </button>
            <button
              onClick={() => setShowScheduler(true)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="Schedule messages"
            >
              ⏰
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-1.5 text-gray-500 hover:text-blue-900 hover:bg-blue-900/10 rounded-md transition-colors"
              title="View analytics"
            >
              📊
            </button>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="p-1.5 text-gray-500 hover:text-blue-900 hover:bg-blue-900/10 rounded-md transition-colors"
              title="Notification settings"
            >
              🔔
            </button>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`p-1.5 rounded-md transition-colors ${
                aiEnabled 
                  ? 'text-blue-900 bg-blue-900/10 hover:bg-blue-900/20' 
                  : 'text-gray-500 hover:text-blue-900 hover:bg-blue-900/10'
              }`}
              title={aiEnabled ? 'Disable AI features' : 'Enable AI features'}
            >
              🤖
            </button>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Close chat"
          >
            ✕
          </button>
        </div>
        
        {/* Left Sidebar - Conversations */}
        <div className="hidden sm:flex sm:w-1/3 border-r border-gray-200 flex-col bg-blue-900 text-white">
          {/* Header */}
          <div className="p-4 border-b border-blue-800">
            <h3 className="text-lg font-semibold text-white">Messages</h3>
            <p className="text-sm text-blue-200">
              Start your conversation here
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-white mb-2">Start Your First Conversation</h3>
                <p className="text-blue-200 mb-6">Connect with other users and explore our powerful messaging features</p>
                
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
                  <div className="bg-blue-900/10 p-3 rounded-lg">
                    <div className="text-2xl mb-1">🔍</div>
                    <p className="text-xs text-blue-200 font-medium">Search Messages</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl mb-1">📋</div>
                    <p className="text-xs text-green-700 font-medium">Use Templates</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl mb-1">⏰</div>
                    <p className="text-xs text-purple-700 font-medium">Schedule Messages</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl mb-1">📊</div>
                    <p className="text-xs text-orange-700 font-medium">View Analytics</p>
                  </div>
                </div>
                
                <p className="text-sm text-blue-200">Visit the messaging test page to start conversations with other users</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation._count?.messages || 0;
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-blue-800 cursor-pointer hover:bg-blue-800 ${
                      activeConversation?.id === conversation.id ? 'bg-blue-800' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="font-medium text-sm text-white">
                            {otherUser?.firstName || otherUser?.lastName || 'Unknown User'}
                          </div>
                          {otherUser && (
                            <div className={`w-2 h-2 rounded-full ${
                              isUserOnline(otherUser.id) ? 'bg-green-500' : 'bg-gray-400'
                            }`} title={isUserOnline(otherUser.id) ? 'Online' : 'Offline'} />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-blue-200 truncate">
                            {conversation.lastMessage.content}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {conversation.lastMessage && (
                          <div className="text-xs text-blue-200">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <div className="bg-white text-blue-900 text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* AI Conversation Insights */}
          {activeConversation?.id && aiEnabled && (
            <div className="p-4 border-t border-gray-200">
              <ConversationSentiment
                conversationId={activeConversation?.id?.toString() || ''}
                userId={user?.id?.toString() || ''}
              />
            </div>
          )}
        </div>

        {/* Mobile Conversation List Toggle */}
        <div className="sm:hidden bg-blue-900 text-white p-3 border-b border-blue-800">
          <button 
            onClick={() => setShowMobileConversations(!showMobileConversations)}
            className="flex items-center space-x-2 text-white"
          >
            <span>📱</span>
            <span>Conversations</span>
            <span className={`transform transition-transform ${showMobileConversations ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        {/* Mobile Conversation List */}
        {showMobileConversations && (
          <div className="sm:hidden bg-blue-900 text-white max-h-64 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-blue-200 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation._count?.messages || 0;
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-3 border-b border-blue-800 cursor-pointer hover:bg-blue-800 ${activeConversation?.id === conversation.id ? 'bg-blue-800' : ''}`}
                    onClick={() => {
                      setActiveConversation(conversation);
                      setShowMobileConversations(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-sm text-white">
                            {otherUser?.firstName || otherUser?.lastName || 'Unknown User'}
                          </div>
                          {otherUser && (
                            <div className={`w-2 h-2 rounded-full ${isUserOnline(otherUser.id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-blue-200 truncate">
                            {conversation.lastMessage.content}
                          </div>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="bg-white text-blue-900 text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {getOtherParticipant(activeConversation)?.firstName || 
                       getOtherParticipant(activeConversation)?.lastName || 
                       'Unknown User'}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${
                        getOtherParticipant(activeConversation) && isUserOnline(getOtherParticipant(activeConversation).id) 
                          ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span>
                        {(() => {
                          const otherParticipant = getOtherParticipant(activeConversation);
                          const isOnline = otherParticipant && isUserOnline(otherParticipant.id);
                          console.log('[ChatModal] Other participant:', otherParticipant?.id, 'Is online:', isOnline);
                          console.log('[ChatModal] Online users:', Array.from(onlineUsers || new Set()));
                          return isOnline ? 'Online' : 'Offline';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === Number(user?.id);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${Number(message.senderId) === Number(user?.id) ? 'justify-end' : 'justify-start'} mb-2`}
                    >
                      <div
                        className={`max-w-[250px] sm:max-w-xs lg:max-w-md px-2 sm:px-3 py-2 rounded-lg text-sm sm:text-base ${
                          Number(message.senderId) === Number(user?.id)
                            ? 'bg-blue-900 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.messageType === 'FILE' && message.fileUrl ? (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                              <span className="text-lg">📎</span>
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline hover:no-underline"
                              >
                                {message.fileName || 'Download File'}
                              </a>
                            </div>
                          </div>
                        ) : null}
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Typing Indicator */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Smart Suggestions */}
              {activeConversation?.id && aiEnabled && (
                <div className="px-4 pb-2">
                  <SmartSuggestions
                    conversationId={activeConversation?.id?.toString() || ''}
                    lastMessage={messages[messages.length - 1]?.content}
                    userId={user?.id?.toString() || ''}
                    onSuggestionSelect={(suggestion) => {
                      setNewMessage(suggestion);
                    }}
                    isVisible={messages.length > 0}
                  />
                </div>
              )}

              {/* Message Input */}
              <div className="p-2 sm:p-4 border-t border-gray-200">
                {selectedFile && (
                  <div className="mb-3 p-2 bg-blue-900/10 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-900">📎 {selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="relative">
                  <EmojiPicker
                    isOpen={showEmojiPicker}
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm sm:text-base"
                    title="Attach file"
                  >
                    📎
                  </label>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                    title="Add emoji"
                  >
                    😀
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="hidden sm:block px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                    title="Use template"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => setShowScheduler(true)}
                    className="hidden sm:block px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                    title="Schedule message"
                  >
                    ⏰
                  </button>
                  {/* AI Auto-Complete Input */}
                  <div className="flex-1">
                    <AutoComplete
                      value={newMessage}
                      onChange={(val) => {
                        setNewMessage(val);
                        handleTyping();
                      }}
                      conversationId={activeConversation?.id?.toString() || ''}
                      userId={user?.id?.toString()}
                      placeholder={selectedFile ? 'Add a message (optional)' : 'Type a message...'}
                      className="min-h-[42px]"
                    />
                  </div>
                  {/* AI Sentiment Indicator */}
                  {newMessage.trim() && aiEnabled && (
                    <div className="flex items-center px-2">
                      <SentimentIndicator
                        message={newMessage}
                        conversationId={activeConversation?.id?.toString() || ''}
                        userId={user?.id?.toString()}
                        showDetails={false}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                    className="bg-blue-900 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isUploading ? 'Uploading...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
      {/* Message Search Modal */}
      <MessageSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectMessage={(conversationId) => {
          const conversation = conversations.find(c => c.id === conversationId);
          if (conversation) {
            setActiveConversation(conversation);
          }
        }}
      />
      
      {/* Message Templates Modal */}
      <MessageTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />
      
      {/* Message Scheduler Modal */}
      <MessageScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        conversationId={activeConversation?.id}
        onScheduleMessage={(content, scheduledFor) => {
          console.log('Message scheduled:', { content, scheduledFor });
          // Optionally show a success message
        }}
      />
      
      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
      
      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
}
