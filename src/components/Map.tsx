import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Lebz, getUserColor, isValidatingLebz, ValidatedCountry } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';

// Créer des icônes colorées pour les utilisateurs
const createColoredIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5S25 25 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="white" cx="12.5" cy="12.5" r="4"/>
    </svg>
  `)}`,
  iconRetinaUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="50" height="82" viewBox="0 0 50 82" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" d="M25 0C11.2 0 0 11.2 0 25c0 25 25 57 25 57S50 50 50 25C50 11.2 38.8 0 25 0z"/>
      <circle fill="white" cx="25" cy="25" r="8"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  if (!position || !onLocationSelect) return null;

  return <Marker position={position} icon={defaultIcon} />;
}

type MapProps = {
  lebzList: Lebz[];
  onLocationSelect?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  validatedCountries?: ValidatedCountry[];
};

export default function Map({ lebzList, onLocationSelect, center = [46.2276, 2.2137], zoom = 3, validatedCountries = [] }: MapProps) {
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}
      {lebzList.map((lebz) => {
        const userColor = getUserColor(lebz.user_id);
        const coloredIcon = createColoredIcon(userColor);
        const isValidator = isValidatingLebz(lebz, validatedCountries);
        
        return (
          <Marker
            key={lebz.id}
            position={[lebz.latitude, lebz.longitude]}
            icon={coloredIcon}
          >
            <Popup maxWidth={300}>
              <div className="space-y-2">
                {lebz.photo_url ? (
                  <img
                    src={lebz.photo_url}
                    alt={lebz.title}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <img
                    src="/lebz_placeholder.jpg"
                    alt={lebz.title}
                    className="w-full h-40 object-cover rounded"
                  />
                )}
                
                {isValidator && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    1ère lebz dans ce pays
                  </div>
                )}
                
                <h3 className="font-bold text-lg">{lebz.title}</h3>
                {lebz.profile && (
                  <p className="text-sm text-gray-600">Par {lebz.profile.username}</p>
                )}
                <div className="text-sm">
                  <p className="text-gray-700">
                    {lebz.city_name && `${lebz.city_name}, `}
                    {lebz.country_name}
                  </p>
                  <p className="text-yellow-500">{renderStars(lebz.rating)}</p>
                  <p className="text-gray-600">
                    Visité le {new Date(lebz.visited_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {lebz.description && (
                  <p className="text-sm text-gray-700">{lebz.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
