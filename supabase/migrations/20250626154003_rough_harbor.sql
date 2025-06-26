/*
  # Add Communities and Itineraries

  1. New Tables
    - `communities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `is_private` (boolean)
      - `created_at` (timestamp)
    
    - `community_members`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `user_id` (uuid, references profiles)
      - `role` (text, check constraint for 'admin' or 'member')
      - `joined_at` (timestamp)
    
    - `community_shared_posts`
      - `id` (uuid, primary key)
      - `community_id` (uuid, references communities)
      - `post_id` (uuid, references posts)
      - `shared_by` (uuid, references profiles)
      - `shared_at` (timestamp)
    
    - `itineraries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `destination` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `budget` (text)
      - `preferences` (jsonb)
      - `notes` (text)
      - `is_public` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `itinerary_items`
      - `id` (uuid, primary key)
      - `itinerary_id` (uuid, references itineraries)
      - `day` (integer)
      - `time` (text)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `category` (text, check constraint)
      - `cost` (numeric)
      - `notes` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading public content
    - Add policies for community members to access community content
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
  role text NOT NULL CHECK (role IN ('admin', 'member')),
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

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget text,
  preferences jsonb DEFAULT '[]'::jsonb,
  notes text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  day integer NOT NULL,
  time text,
  title text NOT NULL,
  description text,
  location text,
  category text CHECK (category IN ('accommodation', 'activity', 'food', 'transportation', 'other')),
  cost numeric,
  notes text,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shared_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add community creator as admin
CREATE OR REPLACE FUNCTION add_community_creator_as_admin()
RETURNS trigger AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Communities policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Public communities are viewable by everyone') THEN
    CREATE POLICY "Public communities are viewable by everyone"
      ON communities
      FOR SELECT
      USING (NOT is_private);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Private communities are viewable by members') THEN
    CREATE POLICY "Private communities are viewable by members"
      ON communities
      FOR SELECT
      USING (is_private AND (id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      )));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Approved users can create communities') THEN
    CREATE POLICY "Approved users can create communities"
      ON communities
      FOR INSERT
      TO authenticated
      WITH CHECK ((auth.uid() = created_by) AND (auth.uid() IN (
        SELECT id FROM profiles WHERE is_approved = true
      )));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Community creators can update their communities') THEN
    CREATE POLICY "Community creators can update their communities"
      ON communities
      FOR UPDATE
      USING (auth.uid() = created_by);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Community creators can delete their communities') THEN
    CREATE POLICY "Community creators can delete their communities"
      ON communities
      FOR DELETE
      USING (auth.uid() = created_by);
  END IF;
END$$;

-- Community members policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can view members of their communities') THEN
    CREATE POLICY "Users can view members of their communities"
      ON community_members
      FOR SELECT
      USING (community_id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      ));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Approved users can join public communities') THEN
    CREATE POLICY "Approved users can join public communities"
      ON community_members
      FOR INSERT
      TO authenticated
      WITH CHECK ((auth.uid() = user_id) AND (auth.uid() IN (
        SELECT id FROM profiles WHERE is_approved = true
      )) AND (community_id IN (
        SELECT id FROM communities WHERE is_private = false
      )));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community admins can add members') THEN
    CREATE POLICY "Community admins can add members"
      ON community_members
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM community_members admin_check
        WHERE admin_check.community_id = community_members.community_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
      ));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can leave communities') THEN
    CREATE POLICY "Users can leave communities"
      ON community_members
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community admins can remove members') THEN
    CREATE POLICY "Community admins can remove members"
      ON community_members
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM community_members admin_check
        WHERE admin_check.community_id = community_members.community_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
      ));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community admins can update member roles') THEN
    CREATE POLICY "Community admins can update member roles"
      ON community_members
      FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM community_members admin_check
        WHERE admin_check.community_id = community_members.community_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
      ));
  END IF;
END$$;

-- Community shared posts policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shared_posts' AND policyname = 'Community shared posts are viewable by community members') THEN
    CREATE POLICY "Community shared posts are viewable by community members"
      ON community_shared_posts
      FOR SELECT
      USING (community_id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      ));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shared_posts' AND policyname = 'Community members can share posts') THEN
    CREATE POLICY "Community members can share posts"
      ON community_shared_posts
      FOR INSERT
      TO authenticated
      WITH CHECK ((auth.uid() = shared_by) AND (auth.uid() IN (
        SELECT id FROM profiles WHERE is_approved = true
      )) AND (community_id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      )));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shared_posts' AND policyname = 'Users can remove their shared posts') THEN
    CREATE POLICY "Users can remove their shared posts"
      ON community_shared_posts
      FOR DELETE
      USING (auth.uid() = shared_by);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shared_posts' AND policyname = 'Community admins can remove shared posts') THEN
    CREATE POLICY "Community admins can remove shared posts"
      ON community_shared_posts
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM community_members
        WHERE community_members.community_id = community_shared_posts.community_id
        AND community_members.user_id = auth.uid()
        AND community_members.role = 'admin'
      ));
  END IF;
END$$;

-- Itineraries policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itineraries' AND policyname = 'Public itineraries are viewable by everyone') THEN
    CREATE POLICY "Public itineraries are viewable by everyone"
      ON itineraries
      FOR SELECT
      USING (is_public = true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itineraries' AND policyname = 'Users can view their own itineraries') THEN
    CREATE POLICY "Users can view their own itineraries"
      ON itineraries
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itineraries' AND policyname = 'Users can insert their own itineraries') THEN
    CREATE POLICY "Users can insert their own itineraries"
      ON itineraries
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itineraries' AND policyname = 'Users can update their own itineraries') THEN
    CREATE POLICY "Users can update their own itineraries"
      ON itineraries
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itineraries' AND policyname = 'Users can delete their own itineraries') THEN
    CREATE POLICY "Users can delete their own itineraries"
      ON itineraries
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Itinerary items policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Public itinerary items are viewable by everyone') THEN
    CREATE POLICY "Public itinerary items are viewable by everyone"
      ON itinerary_items
      FOR SELECT
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE is_public = true
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Users can view their own itinerary items') THEN
    CREATE POLICY "Users can view their own itinerary items"
      ON itinerary_items
      FOR SELECT
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Users can insert their own itinerary items') THEN
    CREATE POLICY "Users can insert their own itinerary items"
      ON itinerary_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Users can update their own itinerary items') THEN
    CREATE POLICY "Users can update their own itinerary items"
      ON itinerary_items
      FOR UPDATE
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Users can delete their own itinerary items') THEN
    CREATE POLICY "Users can delete their own itinerary items"
      ON itinerary_items
      FOR DELETE
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS communities_name_key ON communities(name);
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

CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_destination_idx ON itineraries(destination);
CREATE INDEX IF NOT EXISTS itineraries_is_public_idx ON itineraries(is_public);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON itineraries(created_at DESC);

CREATE INDEX IF NOT EXISTS itinerary_items_itinerary_id_idx ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS itinerary_items_day_idx ON itinerary_items(day);
CREATE INDEX IF NOT EXISTS itinerary_items_category_idx ON itinerary_items(category);
CREATE INDEX IF NOT EXISTS itinerary_items_order_idx ON itinerary_items("order");

-- Trigger to automatically update updated_at for itineraries
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for itinerary_items
DROP TRIGGER IF EXISTS update_itinerary_items_updated_at ON itinerary_items;
CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to add community creator as admin
DROP TRIGGER IF EXISTS on_community_created ON communities;
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION add_community_creator_as_admin();