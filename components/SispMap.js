'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';

// Fix Leaflet marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function SispMap({ data }) {
  const router = useRouter();

  // Find center. Default to Indonesia roughly if no data
  let center = [-2.5, 118];
  let zoom = 5;

  // Filter valid coordinates
  const validData = data.filter(d => d.lintang && d.bujur && !isNaN(parseFloat(d.lintang)) && !isNaN(parseFloat(d.bujur)));

  if (validData.length > 0) {
    // Just take the first valid coordinate as center for simplicity, or average them
    const first = validData[0];
    center = [parseFloat(first.lintang), parseFloat(first.bujur)];
    zoom = 12;
  }

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 1 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validData.map((sekolah, index) => (
          <Marker 
            key={sekolah.id || index} 
            position={[parseFloat(sekolah.lintang), parseFloat(sekolah.bujur)]}
          >
            <Popup>
              <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>{sekolah.nama_satuan_pendidikan}</h3>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#64748b' }}>NPSN: {sekolah.npsn}</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>{sekolah.bentuk_pendidikan} - {sekolah.status_sekolah}</p>
                <button 
                  onClick={() => router.push(`/sekolah/${sekolah.npsn}`)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}
                >
                  Lihat Detail Sekolah
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
