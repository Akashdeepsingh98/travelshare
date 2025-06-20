/*
  # Add Location Coordinates to Posts

  1. Changes
    - Add `latitude` and `longitude` columns to posts table
    - These columns are nullable to maintain compatibility with existing data
    - Add index for geospatial queries

  2. Security
    - Maintain existing RLS policies
    - No additional security changes needed
*/

-- Add latitude and longitude columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE posts ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE posts ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS posts_location_coords_idx ON posts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN posts.latitude IS 'Latitude coordinate of the post location for geospatial queries';
COMMENT ON COLUMN posts.longitude IS 'Longitude coordinate of the post location for geospatial queries';