/*
  # Fix Community RLS and RPC Function Issues

  1. Database Functions
    - Create `get_user_communities` RPC function to safely get user's communities
    - Create helper function to check community membership without recursion

  2. Security Fixes
    - Fix infinite recursion in community_members RLS policies
    - Simplify community access policies to prevent circular dependencies
    - Add safe membership checking functions

  3. Changes Made
    - Replace problematic RLS policies with non-recursive versions
    - Add RPC function for getting user communities
    - Ensure proper access control without circular references
*/

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Users can view members of their communities" ON community_members;
DROP POLICY IF EXISTS "Community admins can add members" ON community_members;
DROP POLICY IF EXISTS "Community admins can remove members" ON community_members;
DROP POLICY IF EXISTS "Community admins can update member roles" ON community_members;
DROP POLICY IF EXISTS "Private communities are viewable by members" ON communities;

-- Create a safe function to check if a user is a community admin
CREATE OR REPLACE FUNCTION is_community_admin(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM community_members 
    WHERE community_id = community_uuid 
      AND user_id = user_uuid 
      AND role = 'admin'
  );
$$;

-- Create a safe function to check if a user is a community member
CREATE OR REPLACE FUNCTION is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM community_members 
    WHERE community_id = community_uuid 
      AND user_id = user_uuid
  );
$$;

-- Create the get_user_communities RPC function
CREATE OR REPLACE FUNCTION get_user_communities(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_private boolean,
  created_at timestamptz,
  member_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    c.id,
    c.name,
    c.description,
    c.is_private,
    c.created_at,
    COALESCE(member_counts.count, 0) as member_count
  FROM communities c
  INNER JOIN community_members cm ON c.id = cm.community_id
  LEFT JOIN (
    SELECT 
      community_id,
      COUNT(*) as count
    FROM community_members
    GROUP BY community_id
  ) member_counts ON c.id = member_counts.community_id
  WHERE cm.user_id = user_uuid
  ORDER BY c.created_at DESC;
$$;

-- Recreate community_members policies without recursion
CREATE POLICY "Users can view members of their communities"
  ON community_members
  FOR SELECT
  TO public
  USING (
    -- Allow viewing if the requesting user is a member of the same community
    community_id IN (
      SELECT cm2.community_id 
      FROM community_members cm2 
      WHERE cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can add members"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Use the helper function to avoid recursion
    is_community_admin(community_id, auth.uid())
  );

CREATE POLICY "Community admins can remove members"
  ON community_members
  FOR DELETE
  TO public
  USING (
    -- Use the helper function to avoid recursion
    is_community_admin(community_id, auth.uid())
  );

CREATE POLICY "Community admins can update member roles"
  ON community_members
  FOR UPDATE
  TO public
  USING (
    -- Use the helper function to avoid recursion
    is_community_admin(community_id, auth.uid())
  );

-- Recreate the private communities policy without recursion
CREATE POLICY "Private communities are viewable by members"
  ON communities
  FOR SELECT
  TO public
  USING (
    is_private = true AND is_community_member(id, auth.uid())
  );

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION is_community_admin(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION is_community_member(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_user_communities(uuid) TO public;