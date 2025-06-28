/*
  # Add Expense Tracker for Trips

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `itinerary_id` (uuid, foreign key to itineraries)
      - `user_id` (uuid, foreign key to profiles)
      - `amount` (numeric)
      - `currency` (text)
      - `description` (text)
      - `category` (text)
      - `expense_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `expenses` table
    - Add policies for CRUD operations
    - Ensure users can only access expenses for itineraries they own or have access to
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('accommodation', 'food', 'transportation', 'activity', 'shopping', 'other')),
  expense_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_itinerary_id_idx ON expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses(created_at);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses

-- Users can view expenses for public itineraries
CREATE POLICY "Public itinerary expenses are viewable by everyone"
  ON expenses
  FOR SELECT
  TO public
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE is_public = true
    )
  );

-- Users can view expenses for their own itineraries
CREATE POLICY "Users can view their own itinerary expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  );

-- Users can add expenses to their own itineraries
CREATE POLICY "Users can add expenses to their own itineraries"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) AND
    (itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    ))
  );

-- Users can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid()) AND
    (itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    ))
  );

-- Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid()) AND
    (itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    ))
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_expenses_updated_at();

-- Create function to get expenses summary by category for an itinerary
CREATE OR REPLACE FUNCTION get_expenses_summary(itinerary_uuid uuid)
RETURNS TABLE (
  category text,
  total_amount numeric,
  currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.category,
    SUM(e.amount) as total_amount,
    e.currency
  FROM
    expenses e
  WHERE
    e.itinerary_id = itinerary_uuid
  GROUP BY
    e.category, e.currency
  ORDER BY
    total_amount DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_expenses_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expenses_summary(uuid) TO public;