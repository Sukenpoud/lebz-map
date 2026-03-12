/*
  # Create Lebz Map Schema

  ## Overview
  This migration creates the core schema for Lebz Map, a travel mapping app where users log travel points (lebz) with photos.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique, required) - User's display name
  - `avatar_url` (text, optional) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `lebz`
  - `id` (uuid, primary key) - Unique lebz identifier
  - `user_id` (uuid, required) - References profiles.id
  - `latitude` (double precision, required) - Location latitude
  - `longitude` (double precision, required) - Location longitude
  - `city_name` (text, optional) - City name from geocoding
  - `country_code` (text, optional) - ISO country code
  - `country_name` (text, optional) - Full country name
  - `photo_url` (text, required) - Photo stored in Supabase Storage
  - `title` (text, required) - Lebz title
  - `description` (text, optional) - Optional description
  - `rating` (integer, required) - Rating from 1 to 5
  - `visited_at` (date, required) - Date of visit
  - `created_at` (timestamptz) - Record creation timestamp

  ## Views

  ### `validated_countries`
  Computes validated countries for each user based on the earliest lebz in each country.
  Returns: user_id, country_code, country_name, first_visit_date, lebz_count

  ## Security
  
  1. Enable RLS on all tables
  2. Profiles policies:
     - Authenticated users can read all profiles
     - Users can update only their own profile
  3. Lebz policies:
     - Authenticated users can read all lebz
     - Users can insert their own lebz
     - Users can update their own lebz
     - Users can delete their own lebz

  ## Storage

  Create storage bucket for lebz photos with public read access.
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create lebz table
CREATE TABLE IF NOT EXISTS lebz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city_name text,
  country_code text,
  country_name text,
  photo_url text NOT NULL,
  title text NOT NULL,
  description text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  visited_at date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for querying lebz by user
CREATE INDEX IF NOT EXISTS idx_lebz_user_id ON lebz(user_id);

-- Create index for country validation queries
CREATE INDEX IF NOT EXISTS idx_lebz_user_country ON lebz(user_id, country_code, created_at);

-- Create view for validated countries
CREATE OR REPLACE VIEW validated_countries AS
SELECT 
  user_id,
  country_code,
  country_name,
  MIN(visited_at) as first_visit_date,
  COUNT(*) as lebz_count
FROM lebz
WHERE country_code IS NOT NULL
GROUP BY user_id, country_code, country_name;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lebz ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Lebz policies
CREATE POLICY "Authenticated users can read all lebz"
  ON lebz FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own lebz"
  ON lebz FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lebz"
  ON lebz FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lebz"
  ON lebz FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for lebz photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lebz-photos', 'lebz-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lebz photos
CREATE POLICY "Authenticated users can upload lebz photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lebz-photos');

CREATE POLICY "Anyone can view lebz photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lebz-photos');

CREATE POLICY "Users can delete own lebz photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lebz-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
