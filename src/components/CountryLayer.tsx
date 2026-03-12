import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { ValidatedCountry } from '../lib/supabase';

type CountryLayerProps = {
  validatedCountries: ValidatedCountry[];
};

export default function CountryLayer({ validatedCountries }: CountryLayerProps) {
  const [countriesData, setCountriesData] = useState<any>(null);

  useEffect(() => {
    // Charger le GeoJSON depuis le fichier public
    fetch('/data/countries.geojson')
      .then(response => response.json())
      .then(data => {
        setCountriesData(data);
      })
      .catch(error => {
        console.error('Erreur lors du chargement du GeoJSON:', error);
      });
  }, []);

  const getCountryStyle = (feature: any) => {
    const countryCode = feature.properties?.['ISO3166-1-Alpha-2'];
    
    const isValidated = validatedCountries.some(vc => vc.country_code === countryCode);
    
    return {
      fillColor: isValidated ? '#10B981' : '#E5E7EB',
      weight: isValidated ? 2 : 1,
      opacity: 1,
      color: isValidated ? '#065F46' : '#9CA3AF',
      fillOpacity: isValidated ? 0.3 : 0.1
    };
  };

  const onEachCountry = (feature: any, layer: any) => {
    const countryCode = feature.properties?.['ISO3166-1-Alpha-2'];
    const countryName = feature.properties?.name || 'Pays inconnu';
    
    const validatedCountry = validatedCountries.find(vc => vc.country_code === countryCode);
    
    if (validatedCountry) {
      layer.bindPopup(`
        <div class="text-sm">
          <strong>${validatedCountry.country_name}</strong><br>
          <span class="text-green-600">✓ Pays validé</span><br>
          ${validatedCountry.lebz_count_in_country} lebz${validatedCountry.lebz_count_in_country > 1 ? 's' : ''}
        </div>
      `);
    } else {
      layer.bindPopup(`
        <div class="text-sm">
          <strong>${countryName}</strong><br>
          <span class="text-gray-500">Non visité</span>
        </div>
      `);
    }
  };

  if (!countriesData) {
    return null;
  }

  return (
    <GeoJSON
      data={countriesData}
      style={getCountryStyle}
      onEachFeature={onEachCountry}
    />
  );
}
