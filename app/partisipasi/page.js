'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { BarChart3, Users, X, List } from 'lucide-react';

const TARGET_INDICATORS = [
  'Angka Partisipasi Sekolah (5-6)',
  'Angka Partisipasi Sekolah (APS) 7-12',
  'Angka Partisipasi Sekolah (APS) 7 - 15',
  'Angka Partisipasi Sekolah (APS) 13-15',
  'Angka Partisipasi Sekolah (APS) 16-18',
  'Angka Partisipasi Sekolah (APS) 7 - 18 Kesetaraan'
];

const APK_APM_INDICATORS = [
  'Angka Partisipasi Kasar (APK) SMP/MTS/Paket B/SMPLB',
  'Angka Partisipasi Kasar (APK) SD/MI/Paket A/SDLB',
  'Angka Partisipasi Murni (APM) SMP/MTS/Paket B/SMPLB',
  'Angka Partisipasi Murni (APM) SD/MI/Paket A/SDLB',
  'Angka Partisipasi Murni (5-6)'
];

export default function PartisipasiPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [activeMenu, setActiveMenu] = useState('APS');

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

  const chartData = useMemo(() => {
    const grouped = {};
    const currentIndicators = activeMenu === 'APS' ? TARGET_INDICATORS : APK_APM_INDICATORS;
    
    // Inisialisasi grup
    currentIndicators.forEach(name => {
      grouped[name] = [];
    });

    for (const item of data) {
      if (currentIndicators.includes(item.nama_indikator)) {
        // Untuk APK/APM, batasi hanya data 'Semua'.
        if (activeMenu === 'APK/APM' && item.status_satuan_pendidikan !== 'Semua') {
          continue;
        }

        const name = item.nama_indikator;
        const existingYear = grouped[name].find(d => d.tahun === item.tahun);
        if (!existingYear) {
          grouped[name].push({
            tahun: item.tahun,
            nilai_angka: item.nilai_angka,
            nilai_teks: item.nilai_teks,
            label_capaian: item.label_capaian
          });
        } else if (existingYear.nilai_angka === null && item.nilai_angka !== null) {
          existingYear.nilai_angka = item.nilai_angka;
          existingYear.nilai_teks = item.nilai_teks;
          existingYear.label_capaian = item.label_capaian;
        }
      }
    }

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.tahun - b.tahun);
    });

    return grouped;
  }, [data, activeMenu]);

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

  const currentIndicators = activeMenu === 'APS' ? TARGET_INDICATORS : APK_APM_INDICATORS;

  return (
    <main className="container">
      <div className="header" style={{ marginBottom: '1rem' }}>
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} color="var(--primary-color)" />
          Angka Partisipasi Sekolah
        </h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Pantau tingkat partisipasi siswa secara global untuk berbagai rentang usia dan jenjang pendidikan.
      </p>

      <div className="grid grid-cols-2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start', gap: '1.5rem' }}>
        {/* Panel Kiri: Side Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={20} color="var(--primary-color)" />
              Menu Partisipasi
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => setActiveMenu('APS')}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeMenu === 'APS' ? 'var(--primary-color)' : '#f8fafc',
                  color: activeMenu === 'APS' ? 'white' : 'var(--text-main)',
                  fontWeight: activeMenu === 'APS' ? '600' : '500',
                  transition: 'all 0.2s',
                  boxShadow: activeMenu === 'APS' ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                  border: activeMenu !== 'APS' ? '1px solid var(--border-color)' : '1px solid transparent'
                }}
              >
                APS (Angka Partisipasi Sekolah)
              </button>
              <button 
                onClick={() => setActiveMenu('APK/APM')}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeMenu === 'APK/APM' ? 'var(--primary-color)' : '#f8fafc',
                  color: activeMenu === 'APK/APM' ? 'white' : 'var(--text-main)',
                  fontWeight: activeMenu === 'APK/APM' ? '600' : '500',
                  transition: 'all 0.2s',
                  boxShadow: activeMenu === 'APK/APM' ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                  border: activeMenu !== 'APK/APM' ? '1px solid var(--border-color)' : '1px solid transparent'
                }}
              >
                APK / APM
              </button>
            </div>
          </div>
        </div>

        {/* Panel Kanan: Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem' }}>
          {currentIndicators.map((indikatorName) => {
            const itemData = chartData[indikatorName] || [];
            const hasData = itemData.some(d => d.nilai_angka !== null);

            return (
              <div 
                key={indikatorName} 
                className="card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', height: '400px', 
                  cursor: hasData ? 'pointer' : 'default', 
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => {
                  if (hasData) {
                    setSelectedChart({ name: indikatorName, data: itemData });
                  }
                }}
                title={hasData ? "Klik untuk melihat detail capaian" : ""}
              >
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
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}>
                                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>Tahun {label}</h4>
                                  <div style={{ marginBottom: '0.25rem', color: 'var(--text-main)' }}><strong>Nilai:</strong> {data.nilai_teks}</div>
                                  {data.label_capaian && data.label_capaian !== '-' && data.label_capaian.trim() !== '' && (
                                    <div>
                                      <strong>Status:</strong> <span style={{
                                        padding: '0.15rem 0.4rem', 
                                        borderRadius: '4px', 
                                        backgroundColor: data.label_capaian.toLowerCase().includes('baik') || data.label_capaian.toLowerCase().includes('atas') ? '#dcfce7' : 
                                                         data.label_capaian.toLowerCase().includes('kurang') || data.label_capaian.toLowerCase().includes('bawah') ? '#fee2e2' : '#f1f5f9',
                                        color: data.label_capaian.toLowerCase().includes('baik') || data.label_capaian.toLowerCase().includes('atas') ? '#166534' : 
                                               data.label_capaian.toLowerCase().includes('kurang') || data.label_capaian.toLowerCase().includes('bawah') ? '#991b1b' : '#334155',
                                      }}>{data.label_capaian}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="nilai_angka" 
                          fill="var(--primary-color)" 
                          radius={[4, 4, 0, 0]} 
                          barSize={40}
                        >
                          <LabelList dataKey="nilai_teks" position="top" style={{ fill: '#64748b', fontSize: '0.85rem', fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Popup Detail */}
      {selectedChart && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }} onClick={() => setSelectedChart(null)}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedChart(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', paddingRight: '2.5rem', lineHeight: '1.4', fontSize: '1.5rem' }}>
              Detail: {selectedChart.name}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Tahun</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Nilai Capaian</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Label Capaian</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChart.data.map((row) => (
                    <tr key={row.tahun} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{row.tahun}</td>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-main)' }}>{row.nilai_teks}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.75rem', 
                          borderRadius: '6px', 
                          backgroundColor: row.label_capaian?.toLowerCase().includes('baik') || row.label_capaian?.toLowerCase().includes('atas') ? '#dcfce7' : 
                                           row.label_capaian?.toLowerCase().includes('kurang') || row.label_capaian?.toLowerCase().includes('bawah') ? '#fee2e2' : '#f1f5f9',
                          color: row.label_capaian?.toLowerCase().includes('baik') || row.label_capaian?.toLowerCase().includes('atas') ? '#166534' : 
                                 row.label_capaian?.toLowerCase().includes('kurang') || row.label_capaian?.toLowerCase().includes('bawah') ? '#991b1b' : '#334155',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {row.label_capaian || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
