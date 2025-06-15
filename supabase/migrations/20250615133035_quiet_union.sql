/*
  # Add Mini Apps System

  1. New Tables
    - `mini_apps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `app_url` (text)
      - `icon_url` (text)
      - `category` (text with check constraint)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on mini_apps table
    - Add policies for users to manage their own apps
    - Add policies for public viewing of active apps

  3. Indexes
    - Add indexes for better performance on queries
*/

-- Create mini_apps table
CREATE TABLE IF NOT EXISTS mini_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  app_url text NOT NULL,
  icon_url text,
  category text NOT NULL CHECK (category IN ('transportation', 'food', 'shopping', 'entertainment', 'travel', 'business', 'other')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mini_apps ENABLE ROW LEVEL SECURITY;

-- Mini Apps policies
CREATE POLICY "Active mini apps are viewable by everyone"
  ON mini_apps
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own mini apps"
  ON mini_apps
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mini apps"
  ON mini_apps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mini apps"
  ON mini_apps
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mini apps"
  ON mini_apps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS mini_apps_user_id_idx ON mini_apps(user_id);
CREATE INDEX IF NOT EXISTS mini_apps_category_idx ON mini_apps(category);
CREATE INDEX IF NOT EXISTS mini_apps_active_idx ON mini_apps(is_active);
CREATE INDEX IF NOT EXISTS mini_apps_created_at_idx ON mini_apps(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mini_apps_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_mini_apps_updated ON mini_apps;
CREATE TRIGGER on_mini_apps_updated
  BEFORE UPDATE ON mini_apps
  FOR EACH ROW EXECUTE FUNCTION update_mini_apps_updated_at();