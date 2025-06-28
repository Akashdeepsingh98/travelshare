/*
  # Direct Messages System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user1_id` (uuid, references profiles.id)
      - `user2_id` (uuid, references profiles.id)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `sender_id` (uuid, references profiles.id)
      - `content` (text)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)
      - `shared_post_id` (uuid, references posts.id, nullable)
  
  2. Security
    - Enable RLS on both tables
    - Add policies to ensure users can only access their own conversations and messages
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT conversations_users_check CHECK (user1_id < user2_id), -- Ensure consistent ordering to prevent duplicates
  CONSTRAINT conversations_users_unique UNIQUE (user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  CONSTRAINT messages_content_or_post_check CHECK (content IS NOT NULL OR shared_post_id IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS conversations_user1_id_idx ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS conversations_user2_id_idx ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_shared_post_id_idx ON messages(shared_post_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations they are part of"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Create function to update conversation updated_at timestamp when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  user_1 uuid;
  user_2 uuid;
BEGIN
  -- Ensure consistent ordering of user IDs
  IF user_a < user_b THEN
    user_1 := user_a;
    user_2 := user_b;
  ELSE
    user_1 := user_b;
    user_2 := user_a;
  END IF;

  -- Check if conversation exists
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = user_1 AND user2_id = user_2;

  -- If not, create it
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (user_1, user_2)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid) TO authenticated;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count bigint;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.user1_id = user_uuid OR c.user2_id = user_uuid)
    AND m.sender_id != user_uuid
    AND m.read_at IS NULL;
  
  RETURN unread_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_message_count(uuid) TO authenticated;