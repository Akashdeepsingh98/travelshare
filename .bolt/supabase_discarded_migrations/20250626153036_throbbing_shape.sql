/*
  # Add Itinerary Builder Feature

  1. New Tables
    - `itineraries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `destination` (text)
      - `start_date` (date, nullable)
      - `end_date` (date, nullable)
      - `budget` (text, nullable)
      - `preferences` (jsonb)
      - `notes` (text, nullable)
      - `is_public` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `itinerary_items`
      - `id` (uuid, primary key)
      - `itinerary_id` (uuid, references itineraries)
      - `day` (integer)
      - `time` (text, nullable)
      - `title` (text)
      - `description` (text, nullable)
      - `location` (text, nullable)
      - `category` (text with check constraint)
      - `cost` (numeric, nullable)
      - `notes` (text, nullable)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own itineraries
    - Add policies for public viewing of public itineraries

  3. Indexes
    - Add indexes for better performance on queries
*/

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
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- Itineraries policies
CREATE POLICY "Public itineraries are viewable by everyone"
  ON itineraries
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own itineraries"
  ON itineraries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
  ON itineraries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON itineraries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Itinerary items policies
CREATE POLICY "Public itinerary items are viewable by everyone"
  ON itinerary_items
  FOR SELECT
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE is_public = true
    )
  );

CREATE POLICY "Users can view their own itinerary items"
  ON itinerary_items
  FOR SELECT
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own itinerary items"
  ON itinerary_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own itinerary items"
  ON itinerary_items
  FOR UPDATE
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own itinerary items"
  ON itinerary_items
  FOR DELETE
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_destination_idx ON itineraries(destination);
CREATE INDEX IF NOT EXISTS itineraries_is_public_idx ON itineraries(is_public);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON itineraries(created_at DESC);

CREATE INDEX IF NOT EXISTS itinerary_items_itinerary_id_idx ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS itinerary_items_day_idx ON itinerary_items(day);
CREATE INDEX IF NOT EXISTS itinerary_items_category_idx ON itinerary_items(category);
CREATE INDEX IF NOT EXISTS itinerary_items_order_idx ON itinerary_items("order");

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at for itineraries
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for itinerary_items
CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();