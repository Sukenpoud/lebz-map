import { useEffect, useState } from 'react';
import { supabase, Lebz, ValidatedCountry } from '../lib/supabase';
import Map from '../components/Map';

export default function MapPage() {
  const [lebzList, setLebzList] = useState<Lebz[]>([]);
  const [validatedCountries, setValidatedCountries] = useState<ValidatedCountry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLebz();
  }, []);

  const fetchLebz = async () => {
    setLoading(true);
    const [lebzRes, countriesRes] = await Promise.all([
      supabase
        .from('lebz')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('validated_countries')
        .select('*')
    ]);

    if (lebzRes.error) {
      console.error('Error fetching lebz:', lebzRes.error);
    } else {
      setLebzList(lebzRes.data || []);
    }

    if (countriesRes.error) {
      console.error('Error fetching validated countries:', countriesRes.error);
    } else {
      setValidatedCountries(countriesRes.data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <Map 
        lebzList={lebzList} 
        validatedCountries={validatedCountries}
        enableMapClick={true} 
      />
    </div>
  );
}
