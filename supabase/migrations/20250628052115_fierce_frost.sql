/*
  # Fix community members recursion

  1. Changes
    - Drops existing get_user_communities function
    - Creates a new get_user_communities function with SECURITY DEFINER
    - Grants execute permission to authenticated users
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_user_communities(uuid);

-- Then create the new function
CREATE OR REPLACE FUNCTION public.get_user_communities(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    created_by uuid,
    is_private boolean,
    created_at timestamp with time zone,
    member_count bigint,
    user_role text,
    creator_id uuid,
    creator_name text,
    creator_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.description,
        c.created_by,
        c.is_private,
        c.created_at,
        (SELECT count(*) FROM public.community_members cm_count WHERE cm_count.community_id = c.id) AS member_count,
        cm.role AS user_role,
        p.id AS creator_id,
        p.name AS creator_name,
        p.avatar_url AS creator_avatar_url
    FROM
        public.communities c
    JOIN
        public.community_members cm ON c.id = cm.community_id
    LEFT JOIN
        public.profiles p ON c.created_by = p.id
    WHERE
        cm.user_id = user_uuid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_communities(uuid) TO authenticated;