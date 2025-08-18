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

interface User {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: 'TEXT' | 'FILE' | 'SYSTEM';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
  reactions?: Array<{
    id: number;
    userId: number;
    emoji: string;
    user: User;
  }>;
  replyTo?: {
    id: number;
    content: string;
    sender: User;
  };
}

interface Conversation {
  id: number;
  participants: User[];
  lastMessage?: Message;
  _count: {
    messages: number;
  };
  updatedAt: string;
  serviceRequestId?: number;
  consultationId?: number;
}

const MessagesPage: React.FC = () => {
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      
      // Send file message via Socket.IO
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

  // Check if anyone is typing (excluding current user)
  const isAnyoneTyping = Array.isArray(typingUsers) ? typingUsers.some((userId: any) => userId !== user?.id) : false;
  const typingUsersList = Array.isArray(typingUsers) ? typingUsers
    .filter((userId: any) => userId !== user?.id)
    .map((userId: any) => {
      const typingUser = activeConversation?.participants.find(p => p.id === userId);
      return typingUser ? typingUser.firstName : 'Someone';
    }) : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-sm ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? (
                  <><Wifi className="h-4 w-4" /> <span>Connected</span></>
                ) : (
                  <><WifiOff className="h-4 w-4" /> <span>Disconnected</span></>
                )}
              </div>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Start new conversation"
              >
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search conversations"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
              const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
              const participantName = getParticipantName(conversation.participants || []);
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {otherParticipant?.firstName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {participantName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage?.messageType === 'FILE' ? '📎 File' :
                         conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getParticipantName(activeConversation.participants).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getParticipantName(activeConversation.participants)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const otherParticipant = activeConversation.participants.find((p: any) => p.id !== user?.id);
                      return otherParticipant && isUserOnline(otherParticipant.id) ? 'Online' : 'Offline';
                    })()}
                  </p>
                </div>
              </div>
                
              <div className="flex items-center space-x-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Voice call"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Video call"
                >
                  <Video className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Conversation info"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          {message.sender?.firstName || 'Unknown'}
                        </p>
                      )}
                      
                      {message.messageType === 'FILE' ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm font-medium">{message.fileName}</span>
                          </div>
                          {message.fileUrl && (
                            <a 
                              href={message.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`text-sm underline hover:no-underline ${
                                isOwn ? 'text-blue-100' : 'text-blue-600'
                              }`}
                            >
                              Download File
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <div className="flex items-center space-x-1">
                            {message.isRead ? (
                              <CheckCheck className="h-3 w-3 text-blue-100" />
                            ) : (
                              <Check className="h-3 w-3 text-blue-100" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isAnyoneTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
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
                  aria-label="Attach file"
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
                    aria-label="Message input"
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
                  title="Send message"
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

export default MessagesPage;
