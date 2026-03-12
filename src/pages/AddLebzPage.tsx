import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Map from '../components/Map';

export default function AddLebzPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cityName, setCityName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useGeolocation, setUseGeolocation] = useState(false);

  useEffect(() => {
    if (useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Impossible de récupérer votre position');
        }
      );
    }
  }, [useGeolocation]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      if (data.address) {
        setCityName(
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.municipality ||
          ''
        );
        setCountryCode(data.address.country_code?.toUpperCase() || '');
        setCountryName(data.address.country || '');
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    reverseGeocode(lat, lng);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;
  if (latitude === null || longitude === null) {
    setError('Veuillez sélectionner un emplacement');
    return;
  }
 
  setLoading(true);
  setError('');
 
  try {
    let photoUrl: string | null = null;
    
    if (photo) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
 
      const { error: uploadError } = await supabase.storage
        .from('lebz-photos')
        .upload(fileName, photo);
 
      if (uploadError) throw uploadError;
 
      const { data: { publicUrl } } = supabase.storage
        .from('lebz-photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }
 
    const { error: insertError } = await supabase
      .from('lebz')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        rating,
        latitude,
        longitude,
        city_name: cityName || null,
        country_code: countryCode || null,
        country_name: countryName || null,
        photo_url: photoUrl,
        visited_at: visitedAt,
      });
 
    if (insertError) throw insertError;
 
    navigate('/');
  } catch (err: any) {
    setError(err.message || 'Une erreur est survenue');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-6">Ajouter une lebz</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Emplacement</h2>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUseGeolocation(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  useGeolocation
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ma position
              </button>
              <button
                type="button"
                onClick={() => setUseGeolocation(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !useGeolocation
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sur la carte
              </button>
            </div>

            {!useGeolocation && (
              <div className="h-64 rounded-lg overflow-hidden">
                <Map
                  lebzList={[]}
                  onLocationSelect={handleLocationSelect}
                  center={latitude && longitude ? [latitude, longitude] : [46.2276, 2.2137]}
                  zoom={latitude && longitude ? 8 : 3}
                />
              </div>
            )}

            {latitude && longitude && (
              <div className="text-sm text-gray-400">
                <p>Latitude: {latitude.toFixed(6)}</p>
                <p>Longitude: {longitude.toFixed(6)}</p>
                {cityName && <p>Ville: {cityName}</p>}
                {countryName && <p>Pays: {countryName}</p>}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Détails</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="mt-4 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Donnez un titre à cette lebz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez cette lebz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Note *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de visite *
              </label>
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Créer la lebz'}
          </button>
        </form>
      </div>
    </div>
  );
}
