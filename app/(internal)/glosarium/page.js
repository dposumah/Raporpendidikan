'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';

export default function GlosariumPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat data');
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const glosariumList = useMemo(() => {
    const list = [];
    const map = new Map();
    // Kita tampilkan semua indikator di glosarium (termasuk sub-level jika ada datanya)
    for (const item of data) {
      if (!map.has(item.kode_indikator)) {
        map.set(item.kode_indikator, true);
        list.push({
          kode: item.kode_indikator,
          nama: item.nama_indikator,
          glosarium: item.glosarium || 'Tidak ada deskripsi tersedia.'
        });
      }
    }
    return list.sort((a, b) => a.kode.localeCompare(b.kode));
  }, [data]);

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Memuat Glosarium...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px' }}>
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="header">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={32} color="var(--primary-color)" />
          Glosarium Indikator
        </h1>
      </div>

      <div className="grid grid-cols-1">
        {glosariumList.map((item) => (
          <div key={item.kode} className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ backgroundColor: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.9rem', color: '#1d4ed8' }}>
                {item.kode}
              </span>
              {item.nama}
            </h3>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {item.glosarium}
            </p>
          </div>
        ))}
        {glosariumList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Data glosarium belum tersedia. Silakan upload data Excel terlebih dahulu.
          </div>
        )}
      </div>
    </main>
  );
}
