'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { notificationService } from '@/utils/notifications';

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
  sender: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  last_message?: Message;
  updated_at: string;
  service_request_id?: string;
  consultation_id?: string;
}

interface RealtimeContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (participantIds: string[]) => Promise<Conversation>;
  setActiveConversation: (conversation: Conversation | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function SupabaseRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Initialize Supabase Realtime connection
  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      if (!isSupabaseConfigured) {
        console.warn('[Realtime] Supabase not configured, skipping realtime initialization');
        setIsConnected(false);
      }
      return;
    }

    console.log('[Realtime] Initializing Supabase Realtime for user:', user.id);
    setIsConnected(true);

    // Subscribe to messages in real-time
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Realtime] New message received:', payload.new);
          const newMessage = payload.new as Message;
          
          // Only add if it's for the active conversation
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id);
              if (!exists) {
                // Show notification for messages from other users
                if (newMessage.sender_id !== String(user.id)) {
                  notificationService.showMessageNotification(
                    newMessage.sender?.full_name || 'Someone',
                    newMessage.content,
                    newMessage.conversation_id
                  );
                }
                return [...prev, newMessage];
              }
              return prev;
            });
          }
          
          // Refresh conversations to update last message
          refreshConversations();
        }
      )
      .subscribe();

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          console.log('[Realtime] Conversation updated, refreshing...');
          refreshConversations();
        }
      )
      .subscribe();

    // Subscribe to user presence (online status)
    const presenceChannel = supabase
      .channel('online_users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = new Set(Object.keys(state));
        console.log('[Realtime] Online users updated:', Array.from(onlineUserIds));
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('[Realtime] User joined:', key);
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('[Realtime] User left:', key);
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user as online
          await presenceChannel.track({
            user_id: user.id,
            full_name: user.firstName || user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      console.log('[Realtime] Cleaning up subscriptions');
      messagesChannel.unsubscribe();
      conversationsChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [user, activeConversation]);

  // Load conversations
  const refreshConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:users(id, full_name, email)
          ),
          last_message:messages(
            id, content, created_at, sender_id,
            sender:users(id, full_name, email)
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[Realtime] Error loading conversations:', error);
        return;
      }

      console.log('[Realtime] Loaded conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('[Realtime] Error in refreshConversations:', error);
    }
  };

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation || !isSupabaseConfigured) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(id, full_name, email)
          `)
          .eq('conversation_id', activeConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[Realtime] Error loading messages:', error);
          return;
        }

        console.log('[Realtime] Loaded messages for conversation:', activeConversation.id, data);
        setMessages(data || []);
      } catch (error) {
        console.error('[Realtime] Error in loadMessages:', error);
      }
    };

    loadMessages();
  }, [activeConversation]);

  // Send message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!isSupabaseConfigured) {
      console.warn('[Realtime] Cannot send message - Supabase not configured');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'TEXT',
          is_read: false,
        })
        .select(`
          *,
          sender:users(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('[Realtime] Error sending message:', error);
        throw error;
      }

      console.log('[Realtime] Message sent successfully:', data);

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('[Realtime] Error in sendMessage:', error);
      throw error;
    }
  };

  // Create conversation
  const createConversation = async (participantIds: string[]): Promise<Conversation> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error('[Realtime] Error creating conversation:', convError);
        throw convError;
      }

      // Add participants (including current user)
      const allParticipants = [user.id, ...participantIds];
      const participantInserts = allParticipants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);

      if (participantError) {
        console.error('[Realtime] Error adding participants:', participantError);
        throw participantError;
      }

      console.log('[Realtime] Conversation created successfully:', conversation);
      
      // Refresh conversations and set as active
      await refreshConversations();
      
      return conversation;
    } catch (error) {
      console.error('[Realtime] Error in createConversation:', error);
      throw error;
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      if (error) {
        console.error('[Realtime] Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('[Realtime] Error in markAsRead:', error);
    }
  };

  // Check if user is online
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, [user]);

  return (
    <RealtimeContext.Provider value={{
      conversations,
      activeConversation,
      messages,
      isConnected,
      sendMessage,
      createConversation,
      setActiveConversation,
      markAsRead,
      refreshConversations,
      onlineUsers,
      isUserOnline,
    }}>
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
