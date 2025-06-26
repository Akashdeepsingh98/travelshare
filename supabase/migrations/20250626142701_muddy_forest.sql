/*
  # Add Communities System

  1. New Tables
    - `communities`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `is_private` (boolean, default false)
      - `created_at` (timestamp)
    
    - `community_members`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `user_id` (uuid, references profiles)
      - `role` (text, check constraint)
      - `joined_at` (timestamp)
    
    - `community_shared_posts`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `post_id` (uuid, references posts)
      - `shared_by` (uuid, references profiles)
      - `shared_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for community management
    - Add policies for member management
    - Add policies for post sharing
*/

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_shared_posts table
CREATE TABLE IF NOT EXISTS community_shared_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_at timestamptz DEFAULT now(),
  UNIQUE(community_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shared_posts ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Public communities are viewable by everyone"
  ON communities
  FOR SELECT
  USING (NOT is_private);

CREATE POLICY "Private communities are viewable by members"
  ON communities
  FOR SELECT
  USING (
    is_private AND 
    id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Approved users can create communities"
  ON communities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true)
  );

CREATE POLICY "Community creators can update their communities"
  ON communities
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Community creators can delete their communities"
  ON communities
  FOR DELETE
  USING (auth.uid() = created_by);

-- Community members policies
CREATE POLICY "Community members are viewable by community members"
  ON community_members
  FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Approved users can join public communities"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true) AND
    community_id IN (SELECT id FROM communities WHERE NOT is_private)
  );

CREATE POLICY "Community admins can add members"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM community_members 
      WHERE community_id = NEW.community_id AND role = 'admin'
    )
  );

CREATE POLICY "Users can leave communities"
  ON community_members
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Community admins can remove members"
  ON community_members
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM community_members 
      WHERE community_id = OLD.community_id AND role = 'admin'
    )
  );

-- Community shared posts policies
CREATE POLICY "Community shared posts are viewable by community members"
  ON community_shared_posts
  FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can share posts"
  ON community_shared_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by AND
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true) AND
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their shared posts"
  ON community_shared_posts
  FOR DELETE
  USING (auth.uid() = shared_by);

CREATE POLICY "Community admins can remove shared posts"
  ON community_shared_posts
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM community_members 
      WHERE community_id = OLD.community_id AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS communities_created_by_idx ON communities(created_by);
CREATE INDEX IF NOT EXISTS communities_is_private_idx ON communities(is_private);
CREATE INDEX IF NOT EXISTS communities_created_at_idx ON communities(created_at DESC);

CREATE INDEX IF NOT EXISTS community_members_community_id_idx ON community_members(community_id);
CREATE INDEX IF NOT EXISTS community_members_user_id_idx ON community_members(user_id);
CREATE INDEX IF NOT EXISTS community_members_role_idx ON community_members(role);

CREATE INDEX IF NOT EXISTS community_shared_posts_community_id_idx ON community_shared_posts(community_id);
CREATE INDEX IF NOT EXISTS community_shared_posts_post_id_idx ON community_shared_posts(post_id);
CREATE INDEX IF NOT EXISTS community_shared_posts_shared_by_idx ON community_shared_posts(shared_by);
CREATE INDEX IF NOT EXISTS community_shared_posts_shared_at_idx ON community_shared_posts(shared_at DESC);

-- Function to automatically add creator as admin when creating community
CREATE OR REPLACE FUNCTION add_community_creator_as_admin()
RETURNS trigger AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add creator as admin
DROP TRIGGER IF EXISTS on_community_created ON communities;
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION add_community_creator_as_admin();