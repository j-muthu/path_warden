'use client';

import { useState, useEffect, useRef } from 'react';
import { latLngToGridRef, gridRefToLatLng, isValidGridRef, parseGoogleMapsLink } from '@/lib/grid-reference';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  gridReference?: string;
  onChange: (location: { latitude: number; longitude: number; gridReference?: string }) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  gridReference,
  onChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapInitializedRef = useRef(false);
  const markerRef = useRef<L.Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [inputMode, setInputMode] = useState<'map' | 'gridref' | 'coords' | 'link'>('map');
  const [gridRefInput, setGridRefInput] = useState(gridReference || '');
  const [latInput, setLatInput] = useState(latitude?.toString() || '');
  const [lngInput, setLngInput] = useState(longitude?.toString() || '');
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;

    // Set flag synchronously to prevent double initialization in StrictMode
    mapInitializedRef.current = true;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Check if already initialized (safety check)
      if (mapInstanceRef.current) return;

      leafletRef.current = L;

      // Fix marker icons
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const initialCenter: [number, number] = latitude && longitude
        ? [latitude, longitude]
        : [54.5, -2];
      const initialZoom = latitude && longitude ? 15 : 6;

      // UK bounds
      const ukBounds: L.LatLngBoundsExpression = [
        [49.528423, -10.76418],
        [61.331151, 1.9134116],
      ];

      const mapOptions: L.MapOptions = {
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 5,
        maxZoom: 19,
        maxBounds: ukBounds,
        maxBoundsViscosity: 1.0,
      };

      const map = L.map(mapRef.current!, mapOptions);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add click handler
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        updateLocationInternal(lat, lng, L);
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      // Add initial marker if location exists
      if (latitude && longitude) {
        addMarkerInternal(latitude, longitude, L);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMarkerInternal = (lat: number, lng: number, L: typeof import('leaflet')) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    const marker = L.marker([lat, lng], {
      draggable: true,
    }).addTo(mapInstanceRef.current);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateLocationInternal(pos.lat, pos.lng, L, false);
    });

    markerRef.current = marker;
  };

  const updateLocationInternal = (lat: number, lng: number, L: typeof import('leaflet'), panMap = true) => {
    const gridRef = latLngToGridRef(lat, lng);

    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    if (gridRef) {
      setGridRefInput(gridRef);
    }

    addMarkerInternal(lat, lng, L);

    if (panMap && mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15));
    }

    onChange({
      latitude: lat,
      longitude: lng,
      gridReference: gridRef || undefined,
    });

    setError(null);
  };

  const updateLocation = (lat: number, lng: number, panMap = true) => {
    if (!leafletRef.current) return;
    updateLocationInternal(lat, lng, leafletRef.current, panMap);
  };

  const handleGridRefSubmit = () => {
    if (!isValidGridRef(gridRefInput)) {
      setError('Invalid grid reference format. Use 2 letters followed by an even number of digits (e.g., SK123456)');
      return;
    }

    const coords = gridRefToLatLng(gridRefInput);
    if (!coords) {
      setError('Could not convert grid reference to coordinates');
      return;
    }

    updateLocation(coords.lat, coords.lng);
  };

  const handleCoordsSubmit = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid numbers for latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Coordinates out of valid range');
      return;
    }

    updateLocation(lat, lng);
  };

  const handleLinkSubmit = () => {
    const coords = parseGoogleMapsLink(linkInput);
    if (!coords) {
      setError('Could not extract coordinates from the link. Please paste a valid Google Maps link.');
      return;
    }

    updateLocation(coords.lat, coords.lng);
    setLinkInput('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError('Unable to get your location. Please check your browser permissions.');
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Input mode tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { id: 'map', label: 'Click on Map' },
          { id: 'gridref', label: 'Grid Reference' },
          { id: 'coords', label: 'Coordinates' },
          { id: 'link', label: 'Maps Link' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setInputMode(tab.id as typeof inputMode)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              inputMode === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="h-[300px] rounded-lg border border-gray-300" />
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="absolute top-3 right-3 bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 z-[1000]"
        >
          Use My Location
        </button>
      </div>

      {/* Input fields based on mode */}
      {inputMode === 'gridref' && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={gridRefInput}
            onChange={(e) => setGridRefInput(e.target.value.toUpperCase())}
            placeholder="e.g., SK123456"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleGridRefSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Set Location
          </button>
        </div>
      )}

      {inputMode === 'coords' && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            placeholder="Latitude"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            placeholder="Longitude"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleCoordsSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Set
          </button>
        </div>
      )}

      {inputMode === 'link' && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste Google Maps link here"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleLinkSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Extract
          </button>
        </div>
      )}

      {/* Current location display */}
      {mapReady && latitude && longitude && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span>
              <strong>Coordinates:</strong> {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
            {gridReference && (
              <span>
                <strong>Grid Ref:</strong> {gridReference}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
