/*
  # Travel Guides Schema

  1. New Tables
    - `travel_guides` - Stores guide information (title, description, destination, etc.)
    - `guide_content_items` - Links guides to posts and itineraries with ordering
  
  2. Security
    - Enable RLS on both tables
    - Add policies for viewing, creating, updating, and deleting guides
    - Add policies for guide content items
  
  3. Functions
    - Add function to update timestamps
    - Add function to get guide content with details
*/

-- Create travel_guides table
CREATE TABLE IF NOT EXISTS travel_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  destination text NOT NULL,
  cover_image_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guide_content_items table (linking table)
CREATE TABLE IF NOT EXISTS guide_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES travel_guides(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post', 'itinerary')),
  item_id uuid NOT NULL,
  order_position integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
  -- We'll handle the foreign key relationship through RLS policies instead of a check constraint
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS travel_guides_user_id_idx ON travel_guides(user_id);
CREATE INDEX IF NOT EXISTS travel_guides_destination_idx ON travel_guides(destination);
CREATE INDEX IF NOT EXISTS travel_guides_is_public_idx ON travel_guides(is_public);
CREATE INDEX IF NOT EXISTS travel_guides_created_at_idx ON travel_guides(created_at DESC);
CREATE INDEX IF NOT EXISTS guide_content_items_guide_id_idx ON guide_content_items(guide_id);
CREATE INDEX IF NOT EXISTS guide_content_items_item_id_idx ON guide_content_items(item_id);
CREATE INDEX IF NOT EXISTS guide_content_items_order_idx ON guide_content_items(order_position);

-- Enable Row Level Security
ALTER TABLE travel_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_guides

-- Public guides are viewable by everyone
CREATE POLICY "Public guides are viewable by everyone"
  ON travel_guides
  FOR SELECT
  TO public
  USING (is_public = true);

-- Users can view their own guides (even if private)
CREATE POLICY "Users can view their own guides"
  ON travel_guides
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own guides
CREATE POLICY "Users can create their own guides"
  ON travel_guides
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own guides
CREATE POLICY "Users can update their own guides"
  ON travel_guides
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own guides
CREATE POLICY "Users can delete their own guides"
  ON travel_guides
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for guide_content_items

-- Users can view content items for public guides
CREATE POLICY "Public guide content items are viewable by everyone"
  ON guide_content_items
  FOR SELECT
  TO public
  USING (
    guide_id IN (
      SELECT id FROM travel_guides WHERE is_public = true
    )
  );

-- Users can view content items for their own guides
CREATE POLICY "Users can view their own guide content items"
  ON guide_content_items
  FOR SELECT
  TO authenticated
  USING (
    guide_id IN (
      SELECT id FROM travel_guides WHERE user_id = auth.uid()
    )
  );

-- Users can add content items to their own guides
CREATE POLICY "Users can add content items to their own guides"
  ON guide_content_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    guide_id IN (
      SELECT id FROM travel_guides WHERE user_id = auth.uid()
    )
  );

-- Users can update content items in their own guides
CREATE POLICY "Users can update content items in their own guides"
  ON guide_content_items
  FOR UPDATE
  TO authenticated
  USING (
    guide_id IN (
      SELECT id FROM travel_guides WHERE user_id = auth.uid()
    )
  );

-- Users can delete content items from their own guides
CREATE POLICY "Users can delete content items from their own guides"
  ON guide_content_items
  FOR DELETE
  TO authenticated
  USING (
    guide_id IN (
      SELECT id FROM travel_guides WHERE user_id = auth.uid()
    )
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_travel_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_travel_guides_updated_at
BEFORE UPDATE ON travel_guides
FOR EACH ROW
EXECUTE FUNCTION update_travel_guides_updated_at();

-- Create function to get guide content with details
CREATE OR REPLACE FUNCTION get_guide_content(guide_uuid uuid)
RETURNS TABLE (
  id uuid,
  content_type text,
  item_id uuid,
  order_position integer,
  notes text,
  post_data jsonb,
  itinerary_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gci.id,
    gci.content_type,
    gci.item_id,
    gci.order_position,
    gci.notes,
    CASE WHEN gci.content_type = 'post' THEN
      jsonb_build_object(
        'id', p.id,
        'location', p.location,
        'content', p.content,
        'image_url', p.image_url,
        'media_urls', p.media_urls,
        'media_types', p.media_types,
        'created_at', p.created_at,
        'user', jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        )
      )
    ELSE NULL END AS post_data,
    CASE WHEN gci.content_type = 'itinerary' THEN
      jsonb_build_object(
        'id', i.id,
        'title', i.title,
        'destination', i.destination,
        'start_date', i.start_date,
        'end_date', i.end_date,
        'budget', i.budget,
        'preferences', i.preferences,
        'created_at', i.created_at
      )
    ELSE NULL END AS itinerary_data
  FROM
    guide_content_items gci
  LEFT JOIN
    posts p ON gci.content_type = 'post' AND gci.item_id = p.id
  LEFT JOIN
    profiles u ON p.user_id = u.id
  LEFT JOIN
    itineraries i ON gci.content_type = 'itinerary' AND gci.item_id = i.id
  WHERE
    gci.guide_id = guide_uuid
  ORDER BY
    gci.order_position ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_guide_content(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guide_content(uuid) TO public;

-- Create functions to validate content items
CREATE OR REPLACE FUNCTION validate_post_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.item_id) THEN
    RAISE EXCEPTION 'Referenced post does not exist';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_itinerary_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_type = 'itinerary' AND NOT EXISTS (SELECT 1 FROM itineraries WHERE id = NEW.item_id) THEN
    RAISE EXCEPTION 'Referenced itinerary does not exist';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate content items
CREATE TRIGGER validate_post_reference
BEFORE INSERT OR UPDATE ON guide_content_items
FOR EACH ROW
WHEN (NEW.content_type = 'post')
EXECUTE FUNCTION validate_post_exists();

CREATE TRIGGER validate_itinerary_reference
BEFORE INSERT OR UPDATE ON guide_content_items
FOR EACH ROW
WHEN (NEW.content_type = 'itinerary')
EXECUTE FUNCTION validate_itinerary_exists();