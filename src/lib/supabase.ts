import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export type Lebz = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  city_name: string | null;
  country_code: string | null;
  country_name: string | null;
  photo_url: string | null;
  title: string;
  description: string | null;
  rating: number;
  visited_at: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
};

export type ValidatedCountry = {
  user_id: string;
  country_code: string;
  country_name: string;
  first_visit_date: string;
  lebz_count: number;
};
