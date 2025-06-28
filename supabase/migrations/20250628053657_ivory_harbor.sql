/*
  # Fix infinite recursion in community_members RLS policies

  1. Changes
    - Drop the problematic recursive policy "Existing admins can manage members"
    - Recreate all community_members policies using auth.uid() instead of uid()
    - Fix the infinite recursion issue by simplifying admin management
  
  2. Security
    - Maintain all essential functionality while eliminating recursion
    - Users can still join public communities, leave communities
    - Community creators can still manage all members
    - Public can view members of public communities
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Existing admins can manage members" ON community_members;

-- Ensure we have the basic policies for community_members
-- (These should already exist based on the schema, but we'll recreate them to be safe)

-- Policy for approved users to join public communities
DROP POLICY IF EXISTS "Approved users can join public communities" ON community_members;
CREATE POLICY "Approved users can join public communities"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) 
    AND (auth.uid() IN (SELECT profiles.id FROM profiles WHERE profiles.is_approved = true))
    AND (community_id IN (SELECT communities.id FROM communities WHERE communities.is_private = false))
  );

-- Policy for authenticated users to view community members
DROP POLICY IF EXISTS "Authenticated users can view community members" ON community_members;
CREATE POLICY "Authenticated users can view community members"
  ON community_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for community creators to add members (including to private communities)
DROP POLICY IF EXISTS "Community creators can add members" ON community_members;
CREATE POLICY "Community creators can add members"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    community_id IN (SELECT communities.id FROM communities WHERE communities.created_by = auth.uid())
  );

-- Policy for community creators to remove members
DROP POLICY IF EXISTS "Community creators can remove members" ON community_members;
CREATE POLICY "Community creators can remove members"
  ON community_members
  FOR DELETE
  TO authenticated
  USING (
    community_id IN (SELECT communities.id FROM communities WHERE communities.created_by = auth.uid())
  );

-- Policy for community creators to update member roles
DROP POLICY IF EXISTS "Community creators can update member roles" ON community_members;
CREATE POLICY "Community creators can update member roles"
  ON community_members
  FOR UPDATE
  TO authenticated
  USING (
    community_id IN (SELECT communities.id FROM communities WHERE communities.created_by = auth.uid())
  );

-- Policy for public to view members of public communities
DROP POLICY IF EXISTS "Public can view members of public communities" ON community_members;
CREATE POLICY "Public can view members of public communities"
  ON community_members
  FOR SELECT
  TO public
  USING (
    community_id IN (SELECT communities.id FROM communities WHERE communities.is_private = false)
  );

-- Policy for users to leave communities
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;
CREATE POLICY "Users can leave communities"
  ON community_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);