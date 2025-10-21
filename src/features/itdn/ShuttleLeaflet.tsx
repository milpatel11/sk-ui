"use client";
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export interface MapPoint { id: string; lat: number; lng: number; type: 'stop' | 'vehicle'; label?: string; color?: string; }

const makeIcon = (color: string) => {
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>
      <circle cx='14' cy='14' r='10' fill='${color}' stroke='white' stroke-width='2' />
    </svg>`);
  return L.icon({ iconUrl: `data:image/svg+xml,${svg}`, iconSize: [28,28], iconAnchor: [14,14] });
};

export const ShuttleLeaflet: React.FC<{ points: MapPoint[]; height?: number }> = ({ points, height=280 }) => {
  const bounds = useMemo(() => {
    if (!points.length) return null;
    const latLngs = points.map(p => [p.lat, p.lng] as [number, number]);
    return L.latLngBounds(latLngs);
  }, [points]);

  const center = bounds ? bounds.getCenter() : L.latLng(37.7749, -122.4194);

  return (
    <div style={{ width: '100%', height }}>
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} bounds={bounds || undefined} scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {points.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(p.type === 'vehicle' ? (p.color || '#1976d2') : (p.color || '#757575'))}>
            {p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ShuttleLeaflet;