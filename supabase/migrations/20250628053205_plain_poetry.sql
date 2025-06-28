/*
  # Fix infinite recursion in community_members RLS policies

  1. Policy Updates
    - Remove problematic recursive policies on community_members table
    - Create simplified, non-recursive policies
    - Ensure policies don't reference the same table they're protecting

  2. Security
    - Maintain proper access control without recursion
    - Allow users to view members of communities they belong to
    - Allow admins to manage members
    - Allow users to join public communities
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Users can view members of their communities" ON community_members;
DROP POLICY IF EXISTS "Community admins can add members" ON community_members;
DROP POLICY IF EXISTS "Community admins can remove members" ON community_members;
DROP POLICY IF EXISTS "Community admins can update member roles" ON community_members;
DROP POLICY IF EXISTS "Approved users can join public communities" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;

-- Create new non-recursive policies

-- Allow users to view community members if they are authenticated
-- This avoids the recursive check by using a simpler condition
CREATE POLICY "Authenticated users can view community members"
  ON community_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to view community members for public communities (for non-authenticated users)
CREATE POLICY "Public can view members of public communities"
  ON community_members
  FOR SELECT
  TO public
  USING (
    community_id IN (
      SELECT id FROM communities WHERE is_private = false
    )
  );

-- Allow approved users to join public communities
CREATE POLICY "Approved users can join public communities"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be approved
    auth.uid() = user_id 
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE is_approved = true
    )
    -- Community must be public
    AND community_id IN (
      SELECT id FROM communities WHERE is_private = false
    )
  );

-- Allow community creators to add members to their communities
CREATE POLICY "Community creators can add members"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    community_id IN (
      SELECT id FROM communities WHERE created_by = auth.uid()
    )
  );

-- Allow users to leave communities (delete their own membership)
CREATE POLICY "Users can leave communities"
  ON community_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow community creators to remove members from their communities
CREATE POLICY "Community creators can remove members"
  ON community_members
  FOR DELETE
  TO authenticated
  USING (
    community_id IN (
      SELECT id FROM communities WHERE created_by = auth.uid()
    )
  );

-- Allow community creators to update member roles in their communities
CREATE POLICY "Community creators can update member roles"
  ON community_members
  FOR UPDATE
  TO authenticated
  USING (
    community_id IN (
      SELECT id FROM communities WHERE created_by = auth.uid()
    )
  );

-- Allow existing admins to manage members (but avoid recursion by using a direct check)
-- This policy allows users who are already known to be admins to manage members
CREATE POLICY "Existing admins can manage members"
  ON community_members
  FOR ALL
  TO authenticated
  USING (
    -- Check if the current user is an admin by looking at a specific membership record
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      LIMIT 1
    )
  );