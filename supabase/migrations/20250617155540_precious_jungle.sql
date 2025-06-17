/*
  # Add User Approval System

  1. Changes
    - Add `is_approved` boolean column to profiles table (default false)
    - Add `approved_at` timestamp column
    - Add `approved_by` reference to admin who approved
    - Update RLS policies to check approval status for interactions
    - Allow viewing posts without authentication

  2. Security
    - Only approved users can create posts, comments, likes, follows
    - All users (including non-authenticated) can view posts and profiles
    - Maintain existing user management for their own data
*/

-- Add approval columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Update the handle_new_user function to set approval status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, is_approved)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    new.raw_user_meta_data->>'avatar_url',
    false -- New users start as not approved
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update posts policies to require approval for creation
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Approved users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true)
  );

-- Update post_likes policies to require approval
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
CREATE POLICY "Approved users can like posts"
  ON post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true)
  );

-- Update comments policies to require approval
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Approved users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true)
  );

-- Update follows policies to require approval
DROP POLICY IF EXISTS "Authenticated users can follow others" ON follows;
CREATE POLICY "Approved users can follow others"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = follower_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_approved = true)
  );

-- Allow public viewing of posts (including non-authenticated users)
-- This policy already exists and allows public viewing

-- Allow public viewing of comments
-- This policy already exists and allows public viewing

-- Allow public viewing of post likes
-- This policy already exists and allows public viewing

-- Allow public viewing of follow relationships
-- This policy already exists and allows public viewing

-- Create index for approval queries
CREATE INDEX IF NOT EXISTS profiles_is_approved_idx ON profiles(is_approved);

-- Function to approve a user (for admin use)
CREATE OR REPLACE FUNCTION approve_user(
  target_user_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin user is approved (basic admin check)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = admin_user_id AND is_approved = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Approve the target user
  UPDATE profiles 
  SET 
    is_approved = true,
    approved_at = now(),
    approved_by = admin_user_id
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject/unapprove a user (for admin use)
CREATE OR REPLACE FUNCTION unapprove_user(
  target_user_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin user is approved (basic admin check)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = admin_user_id AND is_approved = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Unapprove the target user
  UPDATE profiles 
  SET 
    is_approved = false,
    approved_at = null,
    approved_by = null
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;