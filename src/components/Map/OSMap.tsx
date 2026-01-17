'use client';

import { useEffect, useRef, useState } from 'react';

interface OSMapProps {
  center?: [number, number];
  zoom?: number;
  onClick?: (lat: number, lng: number) => void;
  children?: React.ReactNode;
  className?: string;
}

export function OSMap({
  center = [54.5, -2],
  zoom = 6,
  onClick,
  children,
  className = 'h-[500px] w-full',
}: OSMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');

      // Fix for default marker icons
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

      // UK bounds
      const ukBounds: L.LatLngBoundsExpression = [
        [49.528423, -10.76418],
        [61.331151, 1.9134116],
      ];

      const mapOptions: L.MapOptions = {
        center,
        zoom,
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

      if (onClick) {
        map.on('click', (e) => {
          onClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, center, zoom, onClick]);

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-300`}>
      <div ref={mapRef} className="h-full w-full" />
      {children}
    </div>
  );
}
