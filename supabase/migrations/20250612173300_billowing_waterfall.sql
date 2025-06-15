/*
  # Fix signup database error by auto-creating profiles

  1. Database Function
    - Creates `handle_new_user()` function to automatically insert profile data
    - Extracts name from user metadata and creates profile entry
    - Uses SECURITY DEFINER to ensure proper permissions

  2. Database Trigger  
    - Creates trigger `on_auth_user_created` on auth.users table
    - Automatically calls handle_new_user() after new user insertion
    - Ensures profile is created immediately when user signs up

  3. Security
    - Function runs with definer rights to access auth schema
    - Maintains existing RLS policies on profiles table
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();