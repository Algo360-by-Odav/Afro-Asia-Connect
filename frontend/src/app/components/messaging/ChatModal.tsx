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
    setActiveConversation,
    markAsRead 
  } = useSocket();
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (activeConversation && user) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, user]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;
    
    if (selectedFile) {
      await handleFileUpload();
    } else {
      sendMessage(activeConversation.id, newMessage);
      setNewMessage('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !activeConversation) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('conversationId', activeConversation.id.toString());
    formData.append('senderId', user?.id?.toString() || '');
    
    try {
      const response = await fetch('http://localhost:3001/api/message-files/upload', {
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
    startTyping(activeConversation.id);
    setTypingTimeout(setTimeout(() => stopTyping(activeConversation.id), 2000));
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex relative">
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          {/* Feature buttons */}
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
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
              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
              title="View analytics"
            >
              📊
            </button>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`p-1.5 rounded-md transition-colors ${
                aiEnabled 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
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
        
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">💬 Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Your First Conversation</h3>
                <p className="text-gray-500 mb-6">Connect with other users and explore our powerful messaging features</p>
                
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl mb-1">🔍</div>
                    <p className="text-xs text-blue-700 font-medium">Search Messages</p>
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
                
                <p className="text-sm text-gray-400">Visit the messaging test page to start conversations with other users</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation._count?.messages || 0;
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-sm">
                            {otherUser?.firstName || otherUser?.lastName || 'Unknown User'}
                          </div>
                          {otherUser && (
                            <div className={`w-2 h-2 rounded-full ${
                              isUserOnline(otherUser.id) ? 'bg-green-500' : 'bg-gray-400'
                            }`} title={isUserOnline(otherUser.id) ? 'Online' : 'Offline'} />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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
          {activeConversation && aiEnabled && (
            <div className="p-4 border-t border-gray-200">
              <ConversationSentiment
                conversationId={activeConversation.id.toString()}
                userId={user?.id?.toString()}
              />
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
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
                        {getOtherParticipant(activeConversation) && isUserOnline(getOtherParticipant(activeConversation).id) 
                          ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === Number(user?.id);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${Number(message.senderId) === Number(user?.id) ? 'justify-end' : 'justify-start'} mb-2`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          Number(message.senderId) === Number(user?.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.messageType === 'FILE' && message.fileUrl ? (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                              <span className="text-lg">📎</span>
                              <a
                                href={`http://localhost:3001${message.fileUrl}`}
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
              {activeConversation && aiEnabled && (
                <div className="px-4 pb-2">
                  <SmartSuggestions
                    conversationId={activeConversation.id.toString()}
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
              <form onSubmit={(e) => e.preventDefault()} className="p-4 border-t border-gray-200">
                {selectedFile && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-700">📎 {selectedFile.name}</span>
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
                <div className="flex space-x-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                    title="Attach file"
                  >
                    📎
                  </label>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    title="Add emoji"
                  >
                    😀
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    title="Use template"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => setShowScheduler(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                      conversationId={activeConversation?.id?.toString()}
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
                        conversationId={activeConversation?.id?.toString()}
                        userId={user?.id?.toString()}
                        showDetails={false}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Send'}
                  </button>
                </div>
              </form>
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
    </div>
  );
}
