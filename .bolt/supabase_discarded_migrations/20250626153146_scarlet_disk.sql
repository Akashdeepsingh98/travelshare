/*
  # Add Itinerary Builder System

  1. New Tables
    - `itineraries` - Stores trip plans with destination, dates, and preferences
    - `itinerary_items` - Stores day-by-day activities and details

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own itineraries
    - Add policies for public viewing of shared itineraries

  3. Indexes & Constraints
    - Add indexes for better query performance
    - Add check constraints for data validation
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

-- Itineraries policies - with checks to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Public itineraries are viewable by everyone'
  ) THEN
    CREATE POLICY "Public itineraries are viewable by everyone"
      ON itineraries
      FOR SELECT
      USING (is_public = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Users can view their own itineraries'
  ) THEN
    CREATE POLICY "Users can view their own itineraries"
      ON itineraries
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Users can insert their own itineraries'
  ) THEN
    CREATE POLICY "Users can insert their own itineraries"
      ON itineraries
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Users can update their own itineraries'
  ) THEN
    CREATE POLICY "Users can update their own itineraries"
      ON itineraries
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itineraries' AND policyname = 'Users can delete their own itineraries'
  ) THEN
    CREATE POLICY "Users can delete their own itineraries"
      ON itineraries
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Itinerary items policies - with checks to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itinerary_items' AND policyname = 'Public itinerary items are viewable by everyone'
  ) THEN
    CREATE POLICY "Public itinerary items are viewable by everyone"
      ON itinerary_items
      FOR SELECT
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE is_public = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itinerary_items' AND policyname = 'Users can view their own itinerary items'
  ) THEN
    CREATE POLICY "Users can view their own itinerary items"
      ON itinerary_items
      FOR SELECT
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itinerary_items' AND policyname = 'Users can insert their own itinerary items'
  ) THEN
    CREATE POLICY "Users can insert their own itinerary items"
      ON itinerary_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itinerary_items' AND policyname = 'Users can update their own itinerary items'
  ) THEN
    CREATE POLICY "Users can update their own itinerary items"
      ON itinerary_items
      FOR UPDATE
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'itinerary_items' AND policyname = 'Users can delete their own itinerary items'
  ) THEN
    CREATE POLICY "Users can delete their own itinerary items"
      ON itinerary_items
      FOR DELETE
      USING (
        itinerary_id IN (
          SELECT id FROM itineraries WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_destination_idx ON itineraries(destination);
CREATE INDEX IF NOT EXISTS itineraries_is_public_idx ON itineraries(is_public);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON itineraries(created_at DESC);

CREATE INDEX IF NOT EXISTS itinerary_items_itinerary_id_idx ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS itinerary_items_day_idx ON itinerary_items(day);
CREATE INDEX IF NOT EXISTS itinerary_items_category_idx ON itinerary_items(category);
CREATE INDEX IF NOT EXISTS itinerary_items_order_idx ON itinerary_items("order");

-- Function to update updated_at timestamp (only create if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Trigger to automatically update updated_at for itineraries
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for itinerary_items
DROP TRIGGER IF EXISTS update_itinerary_items_updated_at ON itinerary_items;
CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();