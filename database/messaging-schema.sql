-- Messaging System Schema for Supabase Realtime
-- Run this after the main schema to add messaging tables

-- ========================
-- CONVERSATIONS
-- ========================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_group BOOLEAN DEFAULT false,
    group_name TEXT,
    service_request_id UUID,
    consultation_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ========================
-- CONVERSATION PARTICIPANTS
-- ========================
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT now(),
    left_at TIMESTAMP,
    UNIQUE (conversation_id, user_id)
);

-- ========================
-- MESSAGES
-- ========================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('TEXT', 'FILE', 'SYSTEM')) DEFAULT 'TEXT',
    file_url TEXT,
    file_name TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ========================
-- INDEXES FOR PERFORMANCE
-- ========================
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ========================
-- RLS POLICIES
-- ========================

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they participate in"
ON conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can update conversations"
ON conversations FOR UPDATE
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Conversation Participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their conversations"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations they're in"
ON conversation_participants FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to conversations they're in"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id);

-- ========================
-- TRIGGERS
-- ========================

-- Update conversation timestamp when message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- ========================
-- REALTIME PUBLICATION
-- ========================

-- Enable realtime for all messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
