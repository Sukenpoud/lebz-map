import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Lebz, Profile, ValidatedCountry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lebzList, setLebzList] = useState<Lebz[]>([]);
  const [validatedCountries, setValidatedCountries] = useState<ValidatedCountry[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
  }, [targetUserId]);

  const fetchProfileData = async () => {
    setLoading(true);

    const [profileRes, lebzRes, countriesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle(),
      supabase
        .from('lebz')
        .select('*')
        .eq('user_id', targetUserId)
        .order('visited_at', { ascending: false }),
      supabase
        .from('validated_countries')
        .select('*')
        .eq('user_id', targetUserId),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (lebzRes.data) setLebzList(lebzRes.data);
    if (countriesRes.data) setValidatedCountries(countriesRes.data);

    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Profil introuvable</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
              <p className="text-gray-400">
                Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{lebzList.length}</div>
              <div className="text-gray-300">Lebz</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{validatedCountries.length}</div>
              <div className="text-gray-300">Pays validés</div>
            </div>
          </div>
        </div>

        {validatedCountries.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pays validés</h2>
            <div className="flex flex-wrap gap-2">
              {validatedCountries.map((country) => (
                <div
                  key={country.country_code}
                  className="bg-gray-700 px-4 py-2 rounded-lg text-white"
                >
                  {country.country_name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {lebzList.length > 0 ? 'Mes lebz' : 'Aucune lebz'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lebzList.map((lebz) => (
              <div key={lebz.id} className="bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={lebz.photo_url}
                  alt={lebz.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{lebz.title}</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>
                      {lebz.city_name && `${lebz.city_name}, `}
                      {lebz.country_name}
                    </p>
                    <p className="text-yellow-400">{renderStars(lebz.rating)}</p>
                    <p>Visité le {new Date(lebz.visited_at).toLocaleDateString('fr-FR')}</p>
                    {lebz.description && (
                      <p className="text-gray-400 mt-2">{lebz.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
