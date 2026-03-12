import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { Lebz, getUserColor, isValidatingLebz, ValidatedCountry } from '../lib/supabase';
import CountryLayer from './CountryLayer';
import 'leaflet/dist/leaflet.css';

// Bouton flottant pour ajouter une lebz
function FloatingAddButton() {
  return (
    <Link
      to="/add"
      className="fixed bottom-6 right-6 z-[1000] w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 md:bottom-8 md:right-8"
      title="Ajouter une lebz"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  );
}

// Composant pour gérer les clics sur la carte
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Composant pour le marker temporaire et le bouton d'action
function TemporaryMarker({ position, onConfirm, onCancel }: { 
  position: [number, number]; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  const tempIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path fill="#3B82F6" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5S25 25 25 12.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="white" cx="12.5" cy="12.5" r="4"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Ouvrir le popup automatiquement quand le marker est ajouté ou déplacé
    if (markerRef.current) {
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 100);
    }
  }, [position]);

  return (
    <Marker 
      ref={markerRef}
      position={position} 
      icon={tempIcon}
    >
      <Popup maxWidth={200} className="temp-marker-popup" autoClose={false}>
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-gray-700">Ajouter une lebz ici ?</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Ajouter
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

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
  showCountries?: boolean;
  enableMapClick?: boolean; // Nouvelle prop pour activer le clic sur la carte
};

export default function Map({ 
  lebzList, 
  onLocationSelect, 
  center = [46.2276, 2.2137], 
  zoom = 3, 
  validatedCountries = [], 
  showCountries = false,
  enableMapClick = false // Par défaut, désactivé sauf sur la page principale
}: MapProps) {
  const navigate = useNavigate();
  const [tempMarkerPosition, setTempMarkerPosition] = useState<[number, number] | null>(null);
  const [showTempMarker, setShowTempMarker] = useState(false);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (enableMapClick) {
      setTempMarkerPosition([lat, lng]);
      setShowTempMarker(true);
    }
  };

  const handleConfirmAdd = () => {
    if (tempMarkerPosition) {
      navigate(`/add?lat=${tempMarkerPosition[0]}&lng=${tempMarkerPosition[1]}`);
      setShowTempMarker(false);
      setTempMarkerPosition(null);
    }
  };

  const handleCancelAdd = () => {
    setShowTempMarker(false);
    setTempMarkerPosition(null);
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
      
      {showCountries && <CountryLayer validatedCountries={validatedCountries} />}
      
      {enableMapClick && <MapClickHandler onLocationSelect={handleMapClick} />}
      
      {showTempMarker && tempMarkerPosition && (
        <TemporaryMarker 
          position={tempMarkerPosition} 
          onConfirm={handleConfirmAdd} 
          onCancel={handleCancelAdd} 
        />
      )}
      
      {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}
      
      {enableMapClick && <FloatingAddButton />}
      
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
            <Popup maxWidth={300} className="lebz-popup">
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
                  <p className="text-sm text-gray-600">Par <Link to={`/profile/${lebz.profile.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">{lebz.profile.username}</Link></p>
                )}
                <div className="text-sm">
                  <p className="text-gray-700 mt-0">
                    {lebz.city_name && `${lebz.city_name}, `}
                    {lebz.country_name}
                  </p>
                  <p className="text-yellow-500">{renderStars(lebz.rating)}</p>
                  <p className="text-gray-600">
                    Soulagé le {new Date(lebz.visited_at).toLocaleDateString('fr-FR')}
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
