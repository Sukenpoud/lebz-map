import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lebz } from '../lib/supabase';
import Map from './Map';

type EditLebzModalProps = {
  lebz: Lebz;
  onClose: () => void;
  onSave: () => void;
};

export default function EditLebzModal({ lebz, onClose, onSave }: EditLebzModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(lebz.title);
  const [description, setDescription] = useState(lebz.description || '');
  const [rating, setRating] = useState(lebz.rating);
  const [visitedAt, setVisitedAt] = useState(lebz.visited_at.split('T')[0]);
  const [latitude, setLatitude] = useState(lebz.latitude);
  const [longitude, setLongitude] = useState(lebz.longitude);
  const [cityName, setCityName] = useState(lebz.city_name || '');
  const [countryCode, setCountryCode] = useState(lebz.country_code || '');
  const [countryName, setCountryName] = useState(lebz.country_name || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compression d'image (réutiliser la même fonction)
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        setPhoto(compressedFile);
        setRemovePhoto(false);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        setPhoto(file);
        setRemovePhoto(false);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
    setRemovePhoto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
        let photoUrl: string | null = lebz.photo_url;
        
        console.log('État initial:', { photoUrl, removePhoto, hasPhoto: !!photo });
        
        // Gérer la photo
        if (photo) {
        console.log('Cas: nouvelle photo uploadée');
        
        // Supprimer l'ancienne photo si elle existe
        if (lebz.photo_url) {
            const oldFileName = lebz.photo_url.split('/').pop();
            if (oldFileName) {
                await supabase.storage
                    .from('lebz-photos')
                    .remove([`${user.id}/${oldFileName}`]);
            }
        }
        
        // Uploader la nouvelle photo
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
        console.log('Nouvelle photoUrl:', photoUrl);
        } else if (removePhoto && lebz.photo_url) {
        console.log('Cas: suppression de photo existante');
        console.log('URL à supprimer:', lebz.photo_url);
        
        // Supprimer la photo existante
        const fileName = lebz.photo_url.split('/').pop();
        console.log('Nom du fichier:', fileName);
        console.log('Chemin storage:', `${user.id}/${fileName}`);
        
        if (fileName) {
            const { error: storageError } = await supabase.storage
            .from('lebz-photos')
            .remove([`${user.id}/${fileName}`]);
            console.log('Erreur storage:', storageError);
        }
        photoUrl = null;
        console.log('photoUrl mis à null:', photoUrl);
        }

        console.log('photoUrl final pour update:', photoUrl);

        // Mettre à jour la lebz
        const { error: updateError } = await supabase
        .from('lebz')
        .update({
            title,
            description: description || null,
            rating,
            latitude,
            longitude,
            city_name: cityName || null,
            country_code: countryCode || null,
            country_name: countryName || null,
            photo_url: photoUrl,  // Devrait être null
            visited_at: visitedAt,
        })
        .eq('id', lebz.id);

        console.log('Erreur update:', updateError);

        if (updateError) throw updateError;

        onSave();
    } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Modifier une lebz</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-700 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Emplacement</h3>

            <div className="h-64 rounded-lg overflow-hidden">
              <Map
                lebzList={[]}
                onLocationSelect={handleLocationSelect}
                center={[latitude, longitude]}
                zoom={8}
              />
            </div>

            {latitude && longitude && (
              <div className="text-sm text-gray-400">
                <p>Latitude: {latitude.toFixed(6)}</p>
                <p>Longitude: {longitude.toFixed(6)}</p>
                {cityName && <p>Ville: {cityName}</p>}
                {countryName && <p>Pays: {countryName}</p>}
              </div>
            )}
          </div>

          <div className="bg-gray-700 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Détails</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                  />
                  {lebz.photo_url && !removePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                
                {(photoPreview || (lebz.photo_url && !removePhoto)) && (
                  <div className="relative">
                    <img
                      src={photoPreview || lebz.photo_url!}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {photoPreview ? 'Nouvelle photo' : 'Photo actuelle'}
                    </div>
                  </div>
                )}
              </div>
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
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}