'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  sender: {
    id: number;
    firstName?: string;
    name?: string;
  };
}

interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    firstName?: string;
    name?: string;
    email: string;
  }>;
  lastMessage?: Message;
  _count: {
    messages: number;
  };
  updatedAt: string;
  serviceRequestId?: number;
  consultationId?: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  sendMessage: (conversationId: number, content: string) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
  typingUsers: { [key: number]: string };
  onlineUsers: Set<number>;
  isUserOnline: (userId: number) => boolean;
  createConversation: (userId1: number, userId2: number, serviceRequestId?: number, consultationId?: number) => Promise<Conversation>;
  markAsRead: (conversationId: number) => void;
  refreshConversations: () => void;
  setActiveConversation: (conversation: Conversation | null) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: number]: string }>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected successfully to ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`);
      setIsConnected(true);
      newSocket.emit('join', Number(user.id));
    });

    newSocket.on('reconnect', (attemptNumber: number) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`[Socket] Reconnection attempt #${attemptNumber}`);
    });

    newSocket.on('reconnect_error', (error: any) => {
      console.error('[Socket] Reconnection failed:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[Socket] All reconnection attempts failed');
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('[Socket] Connection error details:', {
        message: error?.message || 'Unknown connection error',
        description: error?.description || 'No description',
        context: error?.context || 'No context',
        type: error?.type || 'Unknown type',
        code: error?.code || 'No error code',
        transport: error?.transport || 'Unknown transport',
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        withCredentials: true,
        timestamp: new Date().toISOString(),
        errorString: error?.toString() || 'No string representation',
        errorKeys: Object.keys(error || {}),
        fullError: error
      });
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (!newSocket.connected) {
          console.log('[Socket] Attempting to reconnect...');
          newSocket.connect();
        }
      }, 2000);
    });

    newSocket.on('new_message', (message: Message) => {
      try {
        if (!message || typeof message !== 'object') {
          console.warn('[Socket] Invalid new_message data:', message);
          return;
        }
        
        console.log('[Socket] New message received:', message);
        
        // Add to messages if it's for the active conversation
        if (activeConversation && message.conversationId === activeConversation.id) {
          setMessages(prev => [message, ...prev]);
        } else {
          // Show notification for messages not in active conversation
          showNotification(message);
        }
        
        // Update conversations list
        refreshConversations();
      } catch (error) {
        console.error('[Socket] Error in new_message handler:', error, 'Message:', message);
      }
    });

    newSocket.on('user_typing', (data) => {
      try {
        if (!data || typeof data !== 'object') {
          console.warn('[Socket] Invalid user_typing data:', data);
          return;
        }
        
        const { conversationId, userId, userName, isTyping } = data;
        
        if (conversationId === undefined || userId === undefined || isTyping === undefined) {
          console.warn('[Socket] Missing required fields in user_typing:', data);
          return;
        }
        
        if (activeConversation?.id === conversationId) {
          setTypingUsers(prev => {
            const updated = { ...prev };
            if (isTyping) {
              updated[userId] = userName || 'Someone';
            } else {
              delete updated[userId];
            }
            return updated;
          });
        }
      } catch (error) {
        console.error('[Socket] Error in user_typing handler:', error, 'Data:', data);
      }
    });

    newSocket.on('user_status_change', (data) => {
      try {
        if (!data || typeof data !== 'object') {
          console.warn('[Socket] Invalid user_status_change data:', data);
          return;
        }
        
        const { userId, isOnline } = data;
        
        if (userId === undefined || isOnline === undefined) {
          console.warn('[Socket] Missing userId or isOnline in user_status_change:', data);
          return;
        }
        
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (isOnline) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      } catch (error) {
        console.error('[Socket] Error in user_status_change handler:', error, 'Data:', data);
      }
    });

    newSocket.on('online_users', (userIds) => {
      try {
        if (!Array.isArray(userIds)) {
          console.warn('[Socket] Invalid online_users data, expected array:', userIds);
          return;
        }
        setOnlineUsers(new Set(userIds));
      } catch (error) {
        console.error('[Socket] Error in online_users handler:', error, 'Data:', userIds);
      }
    });

    newSocket.on('message_error', (errorData: any) => {
      try {
        console.error('[Socket] Message sending failed - Raw data:', errorData);
        console.error('[Socket] Message sending failed - Processed:', {
          error: errorData?.error || 'Unknown message error',
          details: errorData?.details || 'No details',
          conversationId: errorData?.conversationId || 'Unknown conversation',
          errorType: errorData?.errorType || 'Unknown error type',
          timestamp: errorData?.timestamp || 'No timestamp',
          dataType: typeof errorData,
          dataKeys: Object.keys(errorData || {}),
          isEmpty: !errorData || Object.keys(errorData).length === 0,
          fullError: errorData
        });
        // You could show a toast notification here for user feedback
      } catch (error) {
        console.error('[Socket] Error in message_error handler:', error, 'Original data:', errorData);
      }
    });

    newSocket.on('error', (error: any) => {
      console.error('[Socket] General socket error:', {
        message: error?.message || 'Unknown error',
        type: error?.type || 'Unknown type',
        description: error?.description || 'No description',
        context: error?.context || 'No context',
        stack: error?.stack || 'No stack trace',
        fullError: error
      });
    });

    setSocket(newSocket);

    // Request online users list
    newSocket.emit('get_online_users');

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Load conversations
  const refreshConversations = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/messaging/conversations?userId=${encodeURIComponent(user.id)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setConversations(data);
        }
      }
    } catch (error) {
      console.error('[Socket] Error loading conversations:', error);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/messaging/conversations/${activeConversation.id}/messages`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setMessages(data.reverse()); // Reverse to show oldest first
        }
      } catch (error) {
        console.error('[Socket] Error loading messages:', error);
      }
    };

    loadMessages();

    // Join conversation room
    if (socket) {
      console.log('[Socket] Joining conversation:', activeConversation.id);
      socket.emit('join_conversation', activeConversation.id);
    }
  }, [activeConversation, socket]);

  const sendMessage = (conversationId: number, content: string) => {
    if (!socket || !user) return;

    socket.emit('send_message', {
      conversationId,
      senderId: user.id,
      content,
    });
  };

  const startTyping = (conversationId: number) => {
    if (!socket || !user) return;

    socket.emit('typing_start', {
      conversationId,
      userId: Number(user.id),
      userName: user.firstName || 'User'
    });
  };

  const stopTyping = (conversationId: number) => {
    if (!socket || !user) return;

    socket.emit('typing_stop', {
      conversationId,
      userId: Number(user.id)
    });
  };

  const createConversation = async (userId1: number, userId2: number, serviceRequestId?: number, consultationId?: number): Promise<Conversation> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/messaging/conversations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ 
        participantIds: [userId2], // Only include the target user, current user is added automatically
        isGroup: false,
        serviceRequestId, 
        consultationId 
      }),
    });

    const conversation = await response.json();
    refreshConversations();
    return conversation;
  };

  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.has(userId);
  };

  const showNotification = (message: Message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Don't show notification for own messages
      if (Number(message.senderId) === Number(user?.id)) return;
      
      const senderName = message.sender?.firstName || 'Someone';
      const notification = new Notification(`New message from ${senderName}`, {
        body: message.content,
        icon: '/favicon.ico',
        tag: `message-${message.id}`,
      });
      
      notification.onclick = () => {
        window.focus();
        // You could also open the specific conversation here
        notification.close();
      };
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  const markAsRead = (conversationId: number) => {
    if (!socket || !user) return;

    socket.emit('mark_read', {
      conversationId,
      userId: Number(user.id),
    });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      conversations,
      activeConversation,
      messages,
      isConnected,
      sendMessage,
      startTyping,
      stopTyping,
      typingUsers,
      onlineUsers,
      isUserOnline,
      markAsRead,
      refreshConversations,
      setActiveConversation,
      createConversation,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
