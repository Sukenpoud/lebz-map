import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Lebz } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';

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
};

export default function Map({ lebzList, onLocationSelect, center = [46.2276, 2.2137], zoom = 3 }: MapProps) {
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
      {lebzList.map((lebz) => (
        <Marker
          key={lebz.id}
          position={[lebz.latitude, lebz.longitude]}
          icon={defaultIcon}
        >
          <Popup maxWidth={300}>
            <div className="space-y-2">
              <img
                src={lebz.photo_url}
                alt={lebz.title}
                className="w-full h-40 object-cover rounded"
              />
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
      ))}
    </MapContainer>
  );
}
