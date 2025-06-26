/*
  # Increase Text Post Word Limit

  1. Changes
    - Update the APP_CONFIG constant in utils/constants.ts to increase maxTextPostWords from 300 to 2000
    - This allows users to create longer text-only posts

  2. Security
    - No security changes needed
    - Maintains existing RLS policies
*/

-- This is a client-side change that doesn't require database modifications.
-- The migration file is created for documentation purposes only.

COMMENT ON TABLE posts IS 'Posts table with increased text post word limit (2000 words)';