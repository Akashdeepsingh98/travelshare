/*
  # Create community_messages table

  1. New Tables
    - `community_messages`
      - `id` (uuid, primary key)
      - `community_id` (uuid, foreign key to communities)
      - `sender_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `community_messages` table
    - Add policy for community members to view messages
    - Add policy for community members to send messages
    - Add policy for message senders to update their own messages
    - Add policy for message senders or community admins to delete messages
*/

-- Create community_messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS community_messages_community_id_idx ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS community_messages_sender_id_idx ON community_messages(sender_id);
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages(created_at);

-- Enable Row Level Security
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_messages

-- Allow authenticated users to view messages if they are a member of the community
CREATE POLICY "Community members can view messages"
  ON community_messages
  FOR SELECT
  TO authenticated
  USING (
    community_id IN (
      SELECT community_members.community_id
      FROM community_members
      WHERE community_members.user_id = auth.uid()
    )
  );

-- Allow authenticated and approved users to send messages if they are a member of the community
CREATE POLICY "Community members can send messages"
  ON community_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (sender_id = auth.uid()) AND
    (community_id IN (
      SELECT community_members.community_id
      FROM community_members
      WHERE community_members.user_id = auth.uid()
      AND (community_members.role = 'member' OR community_members.role = 'admin')
    )) AND
    (auth.uid() IN (SELECT profiles.id FROM profiles WHERE profiles.is_approved = true))
  );

-- Allow message sender to update their own messages
CREATE POLICY "Message sender can update own messages"
  ON community_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Allow message sender or community admin to delete messages
CREATE POLICY "Message sender or admin can delete messages"
  ON community_messages
  FOR DELETE
  TO authenticated
  USING (
    (sender_id = auth.uid()) OR
    (community_id IN (
      SELECT community_members.community_id
      FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    ))
  );