'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Search, 
  Phone, 
  Video, 
  Info, 
  Reply, 
  Trash2, 
  Heart, 
  ThumbsUp, 
  Laugh, 
  Angry, 
  Sad, 
  Plus, 
  X, 
  MessageCircle,
  Users,
  Clock,
  Check,
  CheckCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';

const EnhancedMessagesPage = () => {
  const { user, token } = useAuth();
  const { 
    socket, 
    isConnected, 
    conversations, 
    activeConversation, 
    messages, 
    sendMessage: socketSendMessage, 
    startTyping, 
    stopTyping, 
    typingUsers, 
    onlineUsers, 
    isUserOnline, 
    markAsRead, 
    refreshConversations, 
    setActiveConversation 
  } = useSocket();
  
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit('join_conversation', activeConversation.id);
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, socket]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!activeConversation || !socket) return;

    // Start typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(activeConversation.id);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(activeConversation.id);
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    setSendingMessage(true);
    
    try {
      // Use Socket.IO for real-time message sending
      if (socket && isConnected) {
        socketSendMessage(activeConversation.id, newMessage.trim());
        setNewMessage('');
        
        // Stop typing indicator
        if (isTyping) {
          stopTyping(activeConversation.id);
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/conversations/${activeConversation.id}/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      
      // Send file message via socket
      if (socket && isConnected) {
        socket.emit('send_message', {
          conversationId: activeConversation.id,
          senderId: user?.id,
          content: `Shared a file: ${file.name}`,
          messageType: 'FILE',
          fileUrl: data.fileUrl,
          fileName: file.name
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getParticipantName = (participants: any[]) => {
    const otherParticipant = participants.find(p => p.id !== user?.id);
    return otherParticipant?.firstName || otherParticipant?.name || 'Unknown User';
  };

  const filteredConversations = conversations.filter(conv => {
    const participantName = getParticipantName(conv.participants);
    return participantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const typingUsersList = Object.values(typingUsers);
  const isAnyoneTyping = typingUsersList.length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" title="Connected" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
              )}
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="New conversation"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="h-12 w-12 mb-4" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const participantName = getParticipantName(conversation.participants);
              const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
              const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
              const isActive = activeConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {participantName.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {participantName}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {conversation._count.messages} messages
                        </span>
                        {isOnline && (
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getParticipantName(activeConversation.participants).charAt(0).toUpperCase()}
                    </div>
                    {(() => {
                      const otherParticipant = activeConversation.participants.find(p => p.id !== user?.id);
                      const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
                      return isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      );
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getParticipantName(activeConversation.participants)}
                    </h2>
                    {(() => {
                      const otherParticipant = activeConversation.participants.find(p => p.id !== user?.id);
                      const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
                      return (
                        <p className="text-sm text-gray-500">
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Voice call"
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Video call"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Conversation info"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle className="h-16 w-16 mb-4" />
                  <p className="text-lg">Start your conversation</p>
                  <p className="text-sm">Send a message to get started</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const senderName = message.sender?.firstName || message.sender?.name || 'Unknown';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {!isOwnMessage && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        
                        {message.messageType === 'FILE' ? (
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              {message.fileName || 'Download file'}
                            </a>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        
                        <div className={`flex items-center justify-between mt-1 text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwnMessage && (
                            <div className="ml-2">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isAnyoneTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {typingUsersList.join(', ')} {typingUsersList.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                </button>
              </form>

              {uploadingFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Uploading file...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessagesPage;
