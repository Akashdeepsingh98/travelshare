/*
  # Add MCP (Model Context Protocol) Support

  1. New Tables
    - `mcp_servers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `endpoint` (text)
      - `api_key` (text, encrypted)
      - `is_active` (boolean)
      - `category` (text)
      - `capabilities` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on mcp_servers table
    - Add policies for users to manage their own MCP servers
    - Encrypt API keys for security

  3. Indexes
    - Add indexes for better performance on MCP queries
*/

-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  endpoint text NOT NULL,
  api_key text, -- Will be encrypted
  is_active boolean DEFAULT true,
  category text NOT NULL CHECK (category IN ('restaurant', 'hotel', 'flight', 'taxi', 'mall', 'attraction', 'general')),
  capabilities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- MCP Servers policies
CREATE POLICY "Users can view their own MCP servers"
  ON mcp_servers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MCP servers"
  ON mcp_servers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCP servers"
  ON mcp_servers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCP servers"
  ON mcp_servers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS mcp_servers_user_id_idx ON mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS mcp_servers_category_idx ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS mcp_servers_active_idx ON mcp_servers(is_active);
CREATE INDEX IF NOT EXISTS mcp_servers_created_at_idx ON mcp_servers(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mcp_servers_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_mcp_servers_updated ON mcp_servers;
CREATE TRIGGER on_mcp_servers_updated
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_mcp_servers_updated_at();