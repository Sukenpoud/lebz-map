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
  first_lebz_id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  first_city_name: string | null;
  first_visit_date: string;
  validated_at: string;
  lebz_count_in_country: number;
};

// Utilitaires
export const isValidatingLebz = (lebz: Lebz, validatedCountries: ValidatedCountry[]): boolean => {
  return validatedCountries.some(vc => vc.first_lebz_id === lebz.id);
};

export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

export const getUserColor = (userId: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};
