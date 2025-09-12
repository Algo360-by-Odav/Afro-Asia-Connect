import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Avatar,
  Badge,
  FAB,
  Searchbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { colors } from '../theme';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  read: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export const MessagingScreen: React.FC = ({ navigation, route }: any) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    route?.params?.conversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  const { user } = useSelector((state: RootState) => state.auth);
  const messagesEndRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/messages/conversations');
      if (response.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await apiService.get(`/messages/conversation/${conversationId}`);
      if (response.success) {
        setMessages(response.data.messages || []);
        // Mark messages as read
        await apiService.patch(`/messages/conversation/${conversationId}/read`);
        // Update conversation unread count
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await apiService.post('/messages/send', {
        conversationId: selectedConversation,
        content: newMessage.trim(),
        messageType: 'TEXT'
      });

      if (response.success) {
        const message = response.data.message;
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        
        // Update conversation last message
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation
            ? {
                ...conv,
                lastMessage: message.content,
                lastMessageTime: message.timestamp
              }
            : conv
        ));

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by last message time
    filtered.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setFilteredConversations(filtered);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <TouchableOpacity
      onPress={() => setSelectedConversation(conversation.id)}
      style={[
        styles.conversationItem,
        selectedConversation === conversation.id && styles.selectedConversation
      ]}
    >
      <View style={styles.conversationAvatar}>
        <Avatar.Text
          size={50}
          label={conversation.participantName.charAt(0)}
          style={styles.avatar}
        />
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>{conversation.participantName}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(conversation.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
          {conversation.unreadCount > 0 && (
            <Badge style={styles.unreadBadge}>{conversation.unreadCount}</Badge>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const MessageItem = ({ message, isOwn }: { message: Message; isOwn: boolean }) => (
    <View style={[
      styles.messageContainer,
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.messageTimestamp,
          isOwn ? styles.ownMessageTimestamp : styles.otherMessageTimestamp
        ]}>
          {formatMessageTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  const ConversationsList = () => (
    <View style={styles.conversationsContainer}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search conversations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <ScrollView style={styles.conversationsList}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conversation => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="chat-bubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>
              Start chatting with your customers
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const ChatView = () => {
    const selectedConv = conversations.find(c => c.id === selectedConversation);
    
    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => setSelectedConversation(null)}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Avatar.Text
            size={40}
            label={selectedConv?.participantName.charAt(0) || 'U'}
            style={styles.chatAvatar}
          />
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>
              {selectedConv?.participantName || 'Unknown'}
            </Text>
            <Text style={styles.chatHeaderStatus}>
              {selectedConv?.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity style={styles.chatMenuButton}>
            <Icon name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={messagesEndRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageItem
              message={item}
              isOwn={item.senderId === user?.id}
            />
          )}
          style={styles.messagesList}
          onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            right={
              <TextInput.Icon
                icon="send"
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      {selectedConversation ? <ChatView /> : <ConversationsList />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  conversationsContainer: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedConversation: {
    backgroundColor: '#f8f9ff',
  },
  conversationAvatar: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#667eea',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#667eea',
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    elevation: 4,
  },
  backButton: {
    marginRight: 12,
  },
  chatAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatHeaderStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  chatMenuButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTimestamp: {
    color: '#666',
  },
  messageInputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
  },
  messageInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    maxHeight: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessagingScreen;
