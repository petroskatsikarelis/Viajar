//Maps.tsx
'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';                      // TS-safe import
import type { LatLngExpression } from 'leaflet';   // bring the type in

// Use explicit Icon class from Leaflet
const defaultIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Map() {
  const patrasCenter: LatLngExpression = [38.246242, 21.735084];

  return (
    <MapContainer
      center={patrasCenter}
      zoom={13}
      style={{ height: '60vh', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={patrasCenter} icon={defaultIcon}>
        <Popup>Patras Center</Popup>
      </Marker>
    </MapContainer>
  );
}
