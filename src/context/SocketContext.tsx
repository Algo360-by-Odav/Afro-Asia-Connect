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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('[Socket] Attempting to connect to:', apiUrl);
    
    const newSocket = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected successfully to', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
      setIsConnected(true);
      
      if (user?.id) {
        console.log('[Socket] User joining with ID:', user.id);
        newSocket.emit('join_user', user.id);
        
        // Test event emission to verify connection
        newSocket.emit('test_connection', { userId: user.id, timestamp: new Date().toISOString() });
      }
      
      // Request online users list after connection
      setTimeout(() => {
        console.log('[Socket] Requesting online users list...');
        newSocket.emit('get_online_users');
        // Also emit user status as online
        console.log('[Socket] Setting user status to online...');
        newSocket.emit('user_online', user.id);
      }, 1000);
      
      // Also request periodically to keep status in sync
      const statusInterval = setInterval(() => {
        if (newSocket.connected && user?.id) {
          console.log('[Socket] Periodic online users refresh...');
          newSocket.emit('get_online_users');
          // Re-emit user online status to ensure backend knows we're still connected
          newSocket.emit('user_online', user.id);
        }
      }, 30000); // Every 30 seconds
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
        apiUrl: apiUrl,
        errorString: error?.toString() || 'No string representation',
        errorKeys: Object.keys(error || {}),
        timestamp: new Date().toISOString(),
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

    // Add comprehensive event logging
    newSocket.onAny((eventName, ...args) => {
      console.log(`[Socket] Event received: ${eventName}`, args);
      if (eventName === 'new_message') {
        console.log('[Socket] *** NEW_MESSAGE EVENT DETECTED ***', args[0]);
      }
    });

    // Test response handler
    newSocket.on('test_response', (data) => {
      console.log('[Socket] Test response received from backend:', data);
    });

    // Debug: Log all socket events to see what's being received
    newSocket.onAny((eventName, ...args) => {
      if (eventName !== 'online_users') { // Skip noisy events
        console.log(`[Socket] DEBUG - Event received: ${eventName}`, args);
      }
    });

    newSocket.on('new_message', (message: any) => {
      console.log('[Socket] New message received:', message);
      setMessages(prev => {
        // Avoid duplicates by checking if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('[Socket] Message already exists, skipping duplicate');
          return prev;
        }
        return [...prev, message];
      });
    });

    newSocket.on('message_sent', (data: any) => {
      console.log('[Socket] Message sent confirmation:', data);
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

    newSocket.on('online_users', (userIds) => {
      try {
        if (!Array.isArray(userIds)) {
          console.warn('[Socket] Invalid online_users data, expected array:', userIds);
          return;
        }
        console.log('[Socket] Received online users list:', userIds);
        console.log('[Socket] Current user ID:', user?.id);
        console.log('[Socket] Setting online users set with:', userIds);
        
        // Ensure current user is included in online list if connected
        const onlineSet = new Set(userIds.map(id => Number(id)));
        if (user?.id && newSocket.connected) {
          onlineSet.add(Number(user.id));
          console.log('[Socket] Added current user to online set:', user.id);
        }
        
        setOnlineUsers(onlineSet);
        console.log('[Socket] Final online users set:', Array.from(onlineSet));
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
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[Socket] No token found, skipping conversation load');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/messaging/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setConversations(data);
        }
      } else {
        console.error('[Socket] Failed to load conversations:', response.status, response.statusText);
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
    if (socket && socket.connected) {
      console.log('[Socket] Joining conversation:', {
        conversationId: activeConversation.id,
        userId: user?.id,
        socketConnected: socket.connected
      });
      socket.emit('join_conversation', activeConversation.id);
    } else if (socket && !socket.connected) {
      console.log('[Socket] Waiting for connection before joining conversation...');
      const joinWhenConnected = () => {
        console.log('[Socket] Connection restored, joining conversation:', activeConversation.id);
        socket.emit('join_conversation', activeConversation.id);
        socket.off('connect', joinWhenConnected);
      };
      socket.on('connect', joinWhenConnected);
    }
  }, [activeConversation, socket]);

  const sendMessage = (conversationId: number, content: string) => {
    if (!socket || !user) {
      console.error('[Socket] Cannot send message - socket or user missing:', { socket: !!socket, user: !!user });
      return;
    }

    console.log('[Socket] Sending message:', { conversationId, senderId: user.id, content, socketConnected: socket.connected });
    
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
    console.log('[Socket] Creating conversation between users:', userId1, userId2);
    
    const token = localStorage.getItem('token');
    console.log('[Socket] Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...',
      user: user ? { id: user.id, email: user.email } : 'No user',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    });
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
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

    console.log('[Socket] Response received:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error('[Socket] Response not OK - Full details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        type: response.type,
        redirected: response.redirected
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        console.log('[Socket] Token expired, redirecting to login...');
        window.location.href = '/auth/login?message=Session expired. Please log in again.';
        throw new Error('Session expired. Please log in again.');
      }
      
      let errorData;
      const responseText = await response.text();
      console.log('[Socket] Raw response text:', responseText);
      
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Socket] Failed to parse error response:', parseError);
        errorData = { 
          message: `HTTP ${response.status}: ${response.statusText}`,
          rawResponse: responseText
        };
      }
      
      console.error('[Socket] Failed to create conversation:', errorData);
      throw new Error(errorData.message || `Failed to create conversation (${response.status})`);
    }

    const data = await response.json();
    console.log('[Socket] Conversation created successfully:', data);
    
    if (!data.success || !data.conversation) {
      throw new Error('Invalid response format from conversation creation');
    }
    
    // Immediately set as active conversation and add to conversations list
    const conversation = data.conversation;
    console.log('[Socket] Setting active conversation immediately:', conversation);
    setActiveConversation(conversation);
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.some(conv => conv.id === conversation.id);
      if (!exists) {
        console.log('[Socket] Adding new conversation to list:', conversation.id);
        return [conversation, ...prev];
      }
      console.log('[Socket] Conversation already exists in list');
      return prev;
    });
    
    refreshConversations();
    return conversation;
  };

  const isUserOnline = (userId: number): boolean => {
    const isOnline = onlineUsers.has(Number(userId));
    console.log(`[Socket] Checking if user ${userId} is online:`, isOnline, 'Online users:', Array.from(onlineUsers));
    return isOnline;
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
