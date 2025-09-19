'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
  updated_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Conversation {
  id: string;
  name?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participants?: Array<{
    id: string;
    user_id: string;
    conversation_id: string;
    joined_at: string;
    user?: {
      id: string;
      email: string;
      full_name?: string;
    };
  }>;
}

interface RealtimeContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  onlineUsers: Set<string>;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, messageType?: 'TEXT' | 'FILE') => Promise<void>;
  createConversation: (participantIds: string[], isGroup?: boolean, name?: string) => Promise<Conversation | null>;
  markAsRead: (messageId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function SupabaseRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Initialize connection status
  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      if (!isSupabaseConfigured) {
        console.warn('[Realtime] Supabase not configured, messaging features disabled');
      }
      setIsConnected(false);
      return;
    }

    console.log('[Realtime] Supabase configured but realtime features disabled for now');
    setIsConnected(false);
  }, [user]);

  // Stub implementations for when Supabase is not configured
  const loadConversations = async () => {
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot load conversations - Supabase not configured');
      return;
    }
    // TODO: Implement when database is available
    console.log('[Realtime] loadConversations - not implemented yet');
  };

  const loadMessages = async (conversationId: string) => {
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot load messages - Supabase not configured');
      return;
    }
    // TODO: Implement when database is available
    console.log('[Realtime] loadMessages - not implemented yet', conversationId);
  };

  const sendMessage = async (content: string, messageType: 'TEXT' | 'FILE' = 'TEXT') => {
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot send message - Supabase not configured');
      return;
    }
    // TODO: Implement when database is available
    console.log('[Realtime] sendMessage - not implemented yet', { content, messageType });
  };

  const createConversation = async (
    participantIds: string[], 
    isGroup: boolean = false, 
    name?: string
  ): Promise<Conversation | null> => {
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot create conversation - Supabase not configured');
      return null;
    }
    // TODO: Implement when database is available
    console.log('[Realtime] createConversation - not implemented yet', { participantIds, isGroup, name });
    return null;
  };

  const markAsRead = async (messageId: string) => {
    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot mark message as read - Supabase not configured');
      return;
    }
    // TODO: Implement when database is available
    console.log('[Realtime] markAsRead - not implemented yet', messageId);
  };

  const value: RealtimeContextType = {
    conversations,
    activeConversation,
    messages,
    isConnected,
    onlineUsers,
    setActiveConversation,
    sendMessage,
    createConversation,
    markAsRead,
    loadConversations,
    loadMessages,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useSupabaseRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useSupabaseRealtime must be used within a SupabaseRealtimeProvider');
  }
  return context;
}
