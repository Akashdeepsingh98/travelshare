/*
  # Group Messaging Functionality

  1. New Tables
    - `group_chats` - Stores group chat information
    - `group_members` - Links users to group chats with roles
    - `group_messages` - Stores messages sent in group chats

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create functions for group management

  3. Features
    - Group creation with multiple members
    - Admin/member roles
    - Message tracking with read status
    - Real-time updates
*/

-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_id uuid -- Will be linked to group_messages.id later
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id uuid NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (group_chat_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id uuid NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL, -- For sharing posts
  created_at timestamptz DEFAULT now(),
  read_by jsonb DEFAULT '[]'::jsonb, -- Array of user_ids who have read the message
  CONSTRAINT group_messages_content_or_post_check CHECK (content IS NOT NULL OR shared_post_id IS NOT NULL)
);

-- Add foreign key constraint to group_chats.last_message_id after group_messages is created
ALTER TABLE group_chats
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES group_messages(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS group_chats_created_by_idx ON group_chats(created_by);
CREATE INDEX IF NOT EXISTS group_chats_updated_at_idx ON group_chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS group_members_group_chat_id_idx ON group_members(group_chat_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_messages_group_chat_id_idx ON group_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS group_messages_sender_id_idx ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS group_messages_created_at_idx ON group_messages(created_at);
CREATE INDEX IF NOT EXISTS group_messages_shared_post_id_idx ON group_messages(shared_post_id);

-- Enable Row Level Security
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chats

-- Group members can view group chats
CREATE POLICY "Group members can view group chats"
  ON group_chats
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can create group chats
CREATE POLICY "Authenticated users can create group chats"
  ON group_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Group admins can update group chats
CREATE POLICY "Group admins can update group chats"
  ON group_chats
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group creator can delete group chats
CREATE POLICY "Group creator can delete group chats"
  ON group_chats
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for group_members

-- Group members can view other group members
CREATE POLICY "Group members can view group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Group admins can add members
CREATE POLICY "Group admins can add members"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group admins can remove members
CREATE POLICY "Group admins can remove members"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group members can leave (delete their own membership)
CREATE POLICY "Group members can leave group"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Group admins can update member roles
CREATE POLICY "Group admins can update member roles"
  ON group_members
  FOR UPDATE
  TO authenticated
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for group_messages

-- Group members can view messages
CREATE POLICY "Group members can view messages"
  ON group_messages
  FOR SELECT
  TO authenticated
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Group members can send messages
CREATE POLICY "Group members can send messages"
  ON group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Message sender can update their own message
CREATE POLICY "Message sender can update own message"
  ON group_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Message sender or group admin can delete messages
CREATE POLICY "Message sender or group admin can delete messages"
  ON group_messages
  FOR DELETE
  TO authenticated
  USING (
    (sender_id = auth.uid()) OR
    (group_chat_id IN (
      SELECT group_chat_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Triggers to update group_chats.updated_at and group_chats.last_message_id
CREATE OR REPLACE FUNCTION update_group_chat_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_chats
  SET
    updated_at = now(),
    last_message_id = NEW.id
  WHERE id = NEW.group_chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_chat_activity
AFTER INSERT ON group_messages
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_activity();

-- Create function to create a group chat with initial members
CREATE OR REPLACE FUNCTION create_group_chat(
  chat_name text,
  chat_description text,
  creator_id uuid,
  member_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id uuid;
  member_id uuid;
BEGIN
  -- Create the group chat
  INSERT INTO group_chats (name, description, created_by)
  VALUES (chat_name, chat_description, creator_id)
  RETURNING id INTO new_chat_id;
  
  -- Add creator as admin
  INSERT INTO group_members (group_chat_id, user_id, role)
  VALUES (new_chat_id, creator_id, 'admin');
  
  -- Add other members
  FOREACH member_id IN ARRAY member_ids
  LOOP
    -- Skip if member_id is the creator (already added as admin)
    IF member_id <> creator_id THEN
      INSERT INTO group_members (group_chat_id, user_id, role)
      VALUES (new_chat_id, member_id, 'member');
    END IF;
  END LOOP;
  
  RETURN new_chat_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_group_chat(text, text, uuid, uuid[]) TO authenticated;

-- Create function to get unread group messages count for a user
CREATE OR REPLACE FUNCTION get_unread_group_messages_count(user_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count bigint;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM group_messages gm
  JOIN group_members gm2 ON gm.group_chat_id = gm2.group_chat_id
  WHERE gm2.user_id = user_uuid
    AND gm.sender_id != user_uuid
    AND NOT (gm.read_by ? user_uuid::text);
  
  RETURN unread_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_group_messages_count(uuid) TO authenticated;