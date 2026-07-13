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
  LineChart,
  Line
} from 'recharts';
import { Info, BarChart3, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndikator, setSelectedIndikator] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Utama');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat data');
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
        // Set default berjenjang jika ada data
        if (jsonData.length > 0) {
          const uniqueJenis = [...new Set(jsonData.map(item => item.jenis_satuan_pendidikan))];
          const allowedJenis = ['PAUD', 'SD Umum', 'SD Kesetaraan', 'SMP Umum', 'SMP Kesetaraan', 'SMA Umum', 'SMA Kesetaraan', 'SMK Umum'];
          const filteredJenis = uniqueJenis.filter(j => allowedJenis.includes(j));
          
          if (filteredJenis.length > 0) {
            const firstJenis = filteredJenis[0];
            setSelectedJenis(firstJenis);
            
            const statusesForJenis = [...new Set(jsonData.filter(i => i.jenis_satuan_pendidikan === firstJenis).map(item => item.status_satuan_pendidikan))];
            if (statusesForJenis.length > 0) {
              const firstStatus = statusesForJenis[0];
              setSelectedStatus(firstStatus);
              
              const regexUtama = /^[a-zA-Z]\.\d+$/;
              const indikatorsForSelection = [...new Set(jsonData.filter(i => i.jenis_satuan_pendidikan === firstJenis && i.status_satuan_pendidikan === firstStatus && regexUtama.test(i.kode_indikator)).map(item => item.kode_indikator))];
              if (indikatorsForSelection.length > 0) {
                setSelectedIndikator(indikatorsForSelection[0]);
              }
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const jenisList = useMemo(() => {
    const allowedJenis = ['PAUD', 'SD Umum', 'SD Kesetaraan', 'SMP Umum', 'SMP Kesetaraan', 'SMA Umum', 'SMA Kesetaraan', 'SMK Umum'];
    const uniqueJenis = [...new Set(data.map(item => item.jenis_satuan_pendidikan))];
    return uniqueJenis.filter(jenis => allowedJenis.includes(jenis));
  }, [data]);

  const statusList = useMemo(() => {
    if (!selectedJenis) return [];
    return [...new Set(data.filter(item => item.jenis_satuan_pendidikan === selectedJenis).map(item => item.status_satuan_pendidikan))];
  }, [data, selectedJenis]);

  const indikatorList = useMemo(() => {
    if (!selectedJenis || !selectedStatus) return [];
    const list = [];
    const map = new Map();
    const regexUtama = /^[a-zA-Z]\.\d+$/; 
    const indikatorUtamaCodes = ['A.1', 'A.2', 'A.3', 'C.1', 'C.7', 'D.1', 'D.10', 'D.4', 'D.8'];
    
    for (const item of data) {
      if (item.jenis_satuan_pendidikan === selectedJenis && item.status_satuan_pendidikan === selectedStatus && regexUtama.test(item.kode_indikator)) {
        
        const isUtama = indikatorUtamaCodes.includes(item.kode_indikator);
        const nameLower = item.nama_indikator.toLowerCase();
        const isAngkaPartisipasi = nameLower.includes('angka partisipasi') || nameLower.includes('apk ') || nameLower.includes('apm ') || nameLower.includes('aps ');
        
        let categoryMatches = false;
        if (selectedKategori === 'Utama' && isUtama) categoryMatches = true;
        if (selectedKategori === 'Pendukung' && !isUtama && !isAngkaPartisipasi) categoryMatches = true;

        if (categoryMatches && !map.has(item.kode_indikator)) {
          map.set(item.kode_indikator, true);
          list.push({ kode: item.kode_indikator, nama: item.nama_indikator, definisi: item.definisi_capaian });
        }
      }
    }
    return list.sort((a, b) => a.kode.localeCompare(b.kode));
  }, [data, selectedJenis, selectedStatus, selectedKategori]);

  // Efek bertingkat untuk mereset dropdown jika parent berubah
  useEffect(() => {
    if (statusList.length > 0 && !statusList.includes(selectedStatus)) {
      setSelectedStatus(statusList[0]);
    }
  }, [statusList, selectedStatus]);

  useEffect(() => {
    if (indikatorList.length > 0 && !indikatorList.some(i => i.kode === selectedIndikator)) {
      setSelectedIndikator(indikatorList[0].kode);
    }
  }, [indikatorList, selectedIndikator]);

  const selectedData = useMemo(() => {
    return data
      .filter((item) => 
        item.kode_indikator === selectedIndikator &&
        item.jenis_satuan_pendidikan === selectedJenis &&
        item.status_satuan_pendidikan === selectedStatus
      )
      .sort((a, b) => a.tahun - b.tahun);
  }, [data, selectedIndikator, selectedJenis, selectedStatus]);

  const currentIndikatorInfo = indikatorList.find(i => i.kode === selectedIndikator);

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Memuat Data...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Membaca database lokal</p>
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

  if (data.length === 0) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Belum ada data tersedia</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Silakan masuk ke halaman Admin dan upload file Excel Rapor Pendidikan.
        </p>
        <a href="/admin" className="btn btn-primary">Ke Halaman Upload</a>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="header">
        <h1 className="title">Analisis Detail Capaian</h1>
      </div>

      <div className="grid grid-cols-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Panel Kiri: Pemilihan Indikator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} color="var(--primary-color)" />
              Pilih Indikator
            </h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jenis Satuan Pendidikan</label>
              <select 
                className="form-select" 
                value={selectedJenis} 
                onChange={(e) => setSelectedJenis(e.target.value)}
              >
                {jenisList.map((jenis) => <option key={jenis} value={jenis}>{jenis}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status Satuan Pendidikan</label>
              <select 
                className="form-select" 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusList.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '500' }}>Kategori Indikator</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Utama', 'Pendukung'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedKategori(cat)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedKategori === cat ? 'var(--primary-color)' : '#f8fafc',
                      color: selectedKategori === cat ? 'white' : 'var(--text-main)',
                      fontWeight: selectedKategori === cat ? '600' : '500',
                      transition: 'all 0.2s',
                      boxShadow: selectedKategori === cat ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                      border: selectedKategori !== cat ? '1px solid var(--border-color)' : '1px solid transparent'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pilih Indikator Terkait</label>
              <select 
                className="form-select" 
                value={selectedIndikator} 
                onChange={(e) => setSelectedIndikator(e.target.value)}
                style={{ height: 'auto', minHeight: '45px' }}
              >
                {indikatorList.length > 0 ? indikatorList.map((ind) => (
                  <option key={ind.kode} value={ind.kode}>
                    [{ind.kode}] {ind.nama.substring(0, 70)}{ind.nama.length > 70 ? '...' : ''}
                  </option>
                )) : (
                  <option disabled>Tidak ada indikator di kategori ini</option>
                )}
              </select>
            </div>
            
            {currentIndikatorInfo && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Definisi:</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                  {currentIndikatorInfo.definisi || 'Tidak ada definisi tersedia untuk indikator ini.'}
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--primary-color)" />
              Rincian Per Tahun
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Tahun</th>
                    <th style={{ padding: '0.5rem' }}>Nilai</th>
                    <th style={{ padding: '0.5rem' }}>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.length > 0 ? selectedData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{row.tahun}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{row.nilai_teks}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          backgroundColor: row.label_capaian?.toLowerCase().includes('baik') || row.label_capaian?.toLowerCase().includes('atas') ? '#dcfce7' : 
                                           row.label_capaian?.toLowerCase().includes('kurang') || row.label_capaian?.toLowerCase().includes('bawah') ? '#fee2e2' : '#f1f5f9',
                          color: row.label_capaian?.toLowerCase().includes('baik') || row.label_capaian?.toLowerCase().includes('atas') ? '#166534' : 
                                 row.label_capaian?.toLowerCase().includes('kurang') || row.label_capaian?.toLowerCase().includes('bawah') ? '#991b1b' : '#334155',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {row.label_capaian || '-'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                        Belum ada data untuk indikator ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Kanan: Grafik */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="var(--primary-color)" />
              Grafik Progress Capaian
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setChartType('bar')}
                style={{
                  border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', fontSize: '0.85rem',
                  backgroundColor: chartType === 'bar' ? 'white' : 'transparent',
                  boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: chartType === 'bar' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
              >Bar</button>
              <button 
                onClick={() => setChartType('line')}
                style={{
                  border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', fontSize: '0.85rem',
                  backgroundColor: chartType === 'line' ? 'white' : 'transparent',
                  boxShadow: chartType === 'line' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: chartType === 'line' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
              >Line</button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
            {selectedData.length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Data tidak tersedia atau tidak memiliki nilai numerik untuk dibuatkan grafik.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={selectedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="tahun" tick={{ fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="nilai_angka" 
                      fill="var(--primary-color)" 
                      radius={[4, 4, 0, 0]} 
                      name="Nilai Capaian"
                      barSize={40}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={selectedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="tahun" tick={{ fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nilai_angka" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }} 
                      name="Nilai Capaian"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
