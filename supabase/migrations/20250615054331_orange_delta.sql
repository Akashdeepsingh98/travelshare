/*
  # Add support for multiple media files in posts

  1. Changes
    - Add `media_urls` JSONB column to store array of media URLs
    - Add `media_types` JSONB column to store array of media types (image/video)
    - Keep `image_url` for backward compatibility but make it nullable
    - Add constraint to limit media count to 10

  2. Security
    - Maintain existing RLS policies
    - Add check constraint for media array length
*/

-- Add new columns for multiple media support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN media_urls JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'media_types'
  ) THEN
    ALTER TABLE posts ADD COLUMN media_types JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Make image_url nullable for backward compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'image_url' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE posts ALTER COLUMN image_url DROP NOT NULL;
  END IF;
END $$;

-- Add constraint to limit media count to 10
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_media_count_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_media_count_check 
    CHECK (jsonb_array_length(media_urls) <= 10 AND jsonb_array_length(media_urls) = jsonb_array_length(media_types));
  END IF;
END $$;

-- Create index for media queries
CREATE INDEX IF NOT EXISTS posts_media_urls_idx ON posts USING GIN (media_urls);