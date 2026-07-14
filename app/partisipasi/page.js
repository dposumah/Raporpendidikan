'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, Users } from 'lucide-react';

const TARGET_INDICATORS = [
  'Angka Partisipasi Sekolah (5-6)',
  'Angka Partisipasi Sekolah (APS) 7-12',
  'Angka Partisipasi Sekolah (APS) 7 - 15',
  'Angka Partisipasi Sekolah (APS) 13-15',
  'Angka Partisipasi Sekolah (APS) 16-18',
  'Angka Partisipasi Sekolah (APS) 7 - 18 Kesetaraan'
];

export default function PartisipasiPage() {
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

  // Filter dan kelompokkan data berdasarkan indikator APS yang ditargetkan
  // Karena kita menghilangkan filter Jenis/Status, kita perlu menduplikasi perlindungan
  // atau mengambil nilai rata-rata/maksimum jika ada double (meski di parser sudah dideduplikasi per jenis).
  // Namun untuk amannya, kita kelompokkan per nama_indikator, dan ambil nilai pertama untuk tiap tahun.
  const chartData = useMemo(() => {
    const grouped = {};
    
    // Inisialisasi grup
    TARGET_INDICATORS.forEach(name => {
      grouped[name] = [];
    });

    for (const item of data) {
      if (TARGET_INDICATORS.includes(item.nama_indikator)) {
        const name = item.nama_indikator;
        // Cek apakah tahun ini sudah ada di array untuk indikator ini
        const existingYear = grouped[name].find(d => d.tahun === item.tahun);
        if (!existingYear) {
          grouped[name].push({
            tahun: item.tahun,
            nilai_angka: item.nilai_angka,
            nilai_teks: item.nilai_teks,
            label_capaian: item.label_capaian
          });
        } else if (existingYear.nilai_angka === null && item.nilai_angka !== null) {
          // Ganti data null dengan data yang aktual
          existingYear.nilai_angka = item.nilai_angka;
          existingYear.nilai_teks = item.nilai_teks;
          existingYear.label_capaian = item.label_capaian;
        }
      }
    }

    // Urutkan tiap grup berdasarkan tahun
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.tahun - b.tahun);
    });

    return grouped;
  }, [data]);

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Memuat Data Partisipasi...</h2>
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
      <div className="header" style={{ marginBottom: '1rem' }}>
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} color="var(--primary-color)" />
          Angka Partisipasi Sekolah (APS)
        </h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Pantau tingkat partisipasi siswa secara global untuk berbagai rentang usia dan jenjang pendidikan.
      </p>

      <div className="grid grid-cols-2">
        {TARGET_INDICATORS.map((indikatorName) => {
          const itemData = chartData[indikatorName] || [];
          const hasData = itemData.some(d => d.nilai_angka !== null);

          return (
            <div key={indikatorName} className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
              <h3 style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary-color)', lineHeight: '1.4' }}>
                <BarChart3 size={20} style={{ minWidth: '20px', marginTop: '3px' }} />
                {indikatorName}
              </h3>
              
              <div style={{ flex: 1, position: 'relative' }}>
                {!hasData ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    Data belum tersedia
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value, name, props) => [`${props.payload.nilai_teks}`, 'Nilai']}
                      />
                      <Bar 
                        dataKey="nilai_angka" 
                        fill="var(--primary-color)" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
