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
import { useSupabaseRealtime } from '../../../context/SupabaseRealtimeContext';
import { useAuth } from '../../../context/AuthContext';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'TEXT' | 'FILE' | 'SYSTEM';
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
  sender: User;
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    user: User;
  }>;
  reply_to?: {
    id: string;
    content: string;
    sender: User;
  };
}

interface Conversation {
  id: string;
  participants: User[];
  last_message?: Message;
  _count: {
    messages: number;
  };
  updated_at: string;
  service_request_id?: string;
  consultation_id?: string;
}

const MessagesPage: React.FC = () => {
  const { user, token } = useAuth();
  const { 
    isConnected, 
    conversations, 
    activeConversation, 
    messages, 
    sendMessage: socketSendMessage, 
    onlineUsers, 
    isUserOnline, 
    markAsRead, 
    refreshConversations, 
    setActiveConversation 
  } = useSupabaseRealtime();
  
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
    if (activeConversation) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, markAsRead]);

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

    if (!activeConversation) return;

    // Note: Typing indicators not implemented in Supabase Realtime version
    // This would require additional real-time presence features
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    setSendingMessage(true);
    
    try {
      // Use Supabase Realtime for message sending
      if (isConnected) {
        await socketSendMessage(activeConversation.id, newMessage.trim());
        setNewMessage('');
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
        `/api/messaging/conversations/${activeConversation.id}/upload`,
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
      
      // Send file message via Supabase Realtime
      if (isConnected) {
        await socketSendMessage(activeConversation.id, `Shared a file: ${file.name}`, {
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
    return otherParticipant?.full_name || otherParticipant?.email || 'Unknown User';
  };

  const filteredConversations = conversations.filter(conv => {
    const participantName = getParticipantName(conv.participants);
    return participantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Typing indicators not implemented in Supabase Realtime version
  const isAnyoneTyping = false;
  const typingUsersList: string[] = [];

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
              const otherParticipant = conversation.participants?.find(p => String(p.id) !== String(user?.id));
              const isOnline = otherParticipant ? isUserOnline(String(otherParticipant.id)) : false;
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
                        {(otherParticipant?.full_name || otherParticipant?.email)?.charAt(0)?.toUpperCase() || '?'}
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
                          {conversation.last_message ? formatTime(conversation.last_message.created_at) : ''}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.last_message?.message_type === 'FILE' ? '📎 File' :
                         conversation.last_message?.content || 'No messages yet'}
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
                      const otherParticipant = activeConversation.participants.find((p: any) => String(p.id) !== String(user?.id));
                      return otherParticipant && isUserOnline(String(otherParticipant.id)) ? 'Online' : 'Offline';
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
                const isOwn = String(message.sender_id) === String(user?.id);
                
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          {message.sender?.full_name || message.sender?.email || 'Unknown'}
                        </p>
                      )}
                      
                      {message.message_type === 'FILE' ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm font-medium">{message.file_name}</span>
                          </div>
                          {message.file_url && (
                            <a 
                              href={message.file_url} 
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
                          {formatTime(message.created_at)}
                        </span>
                        {isOwn && (
                          <div className="flex items-center space-x-1">
                            {message.is_read ? (
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
