import { useEffect, useState } from 'react';
import { supabase, Lebz } from '../lib/supabase';
import Map from '../components/Map';

export default function MapPage() {
  const [lebzList, setLebzList] = useState<Lebz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLebz();
  }, []);

  const fetchLebz = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lebz')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lebz:', error);
    } else {
      setLebzList(data || []);
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
    <div className="h-screen w-full">
      <Map lebzList={lebzList} />
    </div>
  );
}
