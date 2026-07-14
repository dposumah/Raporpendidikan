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
  const [chartType, setChartType] = useState('bar');
  const [spmData, setSpmData] = useState([]);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
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
          const allowedJenis = ['SD Umum', 'SMP Umum', 'PAUD'];
          const filteredJenis = allowedJenis.filter(j => uniqueJenis.includes(j));
          
          if (filteredJenis.length > 0) {
            const firstJenis = filteredJenis[0];
            setSelectedJenis(firstJenis);
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetch('/api/spm', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat SPM');
        return res.json();
      })
      .then(data => setSpmData(data || []))
      .catch(err => console.error('Error load SPM:', err));
  }, []);

  const jenisList = useMemo(() => {
    const allowedJenis = ['SD Umum', 'SMP Umum', 'PAUD'];
    const uniqueJenis = [...new Set(data.map(item => item.jenis_satuan_pendidikan))];
    return allowedJenis.filter(jenis => uniqueJenis.includes(jenis));
  }, [data]);

  const indikatorList = useMemo(() => {
    if (!selectedJenis) return [];
    const list = [];
    const map = new Map();
    
    // Daftar indikator SD/SMP
    const allowedIndicatorsSD_SMP = [
      'kemampuan literasi',
      'kemampuan numerasi',
      'iklim keamanan sekolah',
      'iklim inklusivitas',
      'iklim kebinekaan',
      'karakter'
    ];
    
    // Daftar indikator PAUD
    const allowedIndicatorsPAUD = [
      'proporsi jumlah satuan paud terakreditasi minimal b',
      'indeks distribusi guru',
      'proses belajar yang sesuai bagi anak usia dini',
      'kemitraan dengan orang tua/wali',
      'penyediaan layanan holistik integratif'
    ];

    const allowedIndicators = selectedJenis === 'PAUD' ? allowedIndicatorsPAUD : allowedIndicatorsSD_SMP;
    
    for (const item of data) {
      if (item.jenis_satuan_pendidikan === selectedJenis) {
        
        const nameLower = item.nama_indikator.toLowerCase();
        // Cek apakah indikator ini ada di daftar (exact match)
        const isAllowed = allowedIndicators.some(allowed => nameLower === allowed);
        
        // Memastikan tidak mengambil varian skor
        if (isAllowed && !item.kode_indikator.toLowerCase().endsWith('.skor') && !map.has(item.kode_indikator)) {
          map.set(item.kode_indikator, true);
          list.push({ kode: item.kode_indikator, nama: item.nama_indikator, definisi: item.definisi_capaian });
        }
      }
    }
    return list.sort((a, b) => a.kode.localeCompare(b.kode));
  }, [data, selectedJenis]);

  useEffect(() => {
    if (indikatorList.length > 0 && !indikatorList.some(i => i.kode === selectedIndikator)) {
      setSelectedIndikator(indikatorList[0].kode);
    }
  }, [indikatorList, selectedIndikator]);

  const selectedData = useMemo(() => {
    const filtered = data.filter((item) => 
      item.kode_indikator === selectedIndikator &&
      item.jenis_satuan_pendidikan === selectedJenis
    );
    
    const grouped = {};
    for (const item of filtered) {
      if (!grouped[item.tahun]) {
        grouped[item.tahun] = { tahun: item.tahun, labels: {}, nilai_teks: {} };
      }
      grouped[item.tahun][item.status_satuan_pendidikan] = item.nilai_angka;
      grouped[item.tahun].labels[item.status_satuan_pendidikan] = item.label_capaian;
      grouped[item.tahun].nilai_teks[item.status_satuan_pendidikan] = item.nilai_teks;
    }
    
    return Object.values(grouped).sort((a, b) => a.tahun - b.tahun);
  }, [data, selectedIndikator, selectedJenis]);

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

      <div className="grid grid-cols-2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
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

            {/* Removed Status Dropdown */}

            {/* Removed Kategori Indikator UI */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '500' }}>Menu Indikator</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {indikatorList.length > 0 ? indikatorList.map((ind) => (
                  <button 
                    key={ind.kode}
                    onClick={() => setSelectedIndikator(ind.kode)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedIndikator === ind.kode ? 'var(--primary-color)' : '#f8fafc',
                      color: selectedIndikator === ind.kode ? 'white' : 'var(--text-main)',
                      fontWeight: selectedIndikator === ind.kode ? '600' : '500',
                      transition: 'all 0.2s',
                      boxShadow: selectedIndikator === ind.kode ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                      border: selectedIndikator !== ind.kode ? '1px solid var(--border-color)' : '1px solid transparent'
                    }}
                  >
                    {ind.nama}
                  </button>
                )) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    Tidak ada data indikator
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '500' }}>Menu Khusus</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSelectedIndikator('SPM')}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndikator === 'SPM' ? 'var(--primary-color)' : '#f8fafc',
                    color: selectedIndikator === 'SPM' ? 'white' : 'var(--text-main)',
                    fontWeight: selectedIndikator === 'SPM' ? '600' : '500',
                    transition: 'all 0.2s',
                    boxShadow: selectedIndikator === 'SPM' ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                    border: selectedIndikator !== 'SPM' ? '1px solid var(--border-color)' : '1px solid transparent'
                  }}
                >
                  Indeks Pencapaian SPM
                </button>
              </div>
            </div>
            
            {currentIndikatorInfo && selectedIndikator !== 'SPM' && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Definisi:</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                  {currentIndikatorInfo.definisi || 'Tidak ada definisi tersedia untuk indikator ini.'}
                </p>
              </div>
            )}
          </div>


        </div>

        {/* Panel Kanan: Grafik atau SPM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedIndikator === 'SPM' ? (
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                <BarChart3 size={20} color="var(--primary-color)" />
                Data Indeks Pencapaian SPM
              </h3>
              {spmData.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Tahun</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Indeks SPM</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Nilai Capaian</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Label Capaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spmData.map((row) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>{row.tahun}</td>
                          <td style={{ padding: '1rem 0.5rem', color: 'var(--primary-color)', fontWeight: '500' }}>{row.indeks_spm}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>{row.nilai_capaian}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{ 
                              padding: '0.3rem 0.75rem', 
                              borderRadius: '6px', 
                              backgroundColor: row.label_capaian?.toLowerCase().includes('tuntas') || row.label_capaian?.toLowerCase().includes('baik') ? '#dcfce7' : 
                                               row.label_capaian?.toLowerCase().includes('belum') || row.label_capaian?.toLowerCase().includes('kurang') ? '#fee2e2' : '#f1f5f9',
                              color: row.label_capaian?.toLowerCase().includes('tuntas') || row.label_capaian?.toLowerCase().includes('baik') ? '#166534' : 
                                     row.label_capaian?.toLowerCase().includes('belum') || row.label_capaian?.toLowerCase().includes('kurang') ? '#991b1b' : '#334155',
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
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Belum ada data SPM. Silakan input dari menu Admin.
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {['Semua', 'Negeri', 'Swasta'].map((status) => {
              // Cek apakah ada data untuk status ini di selectedData
              const hasData = selectedData.some(row => row[status] !== undefined);
              if (!hasData) return null;

              const statusColors = {
                'Semua': 'var(--primary-color)',
                'Negeri': '#10b981',
                'Swasta': '#f59e0b'
              };

              return (
                <div key={status} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: statusColors[status], fontSize: '1rem' }}>{status}</h4>
                  <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={selectedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                            formatter={(value, name, props) => {
                              const lbl = props.payload.labels ? props.payload.labels[status] : '';
                              return [value, `${status} ${lbl ? `(${lbl})` : ''}`];
                            }}
                          />
                          <Bar dataKey={status} fill={statusColors[status]} radius={[4, 4, 0, 0]} name={status} barSize={25} />
                        </BarChart>
                      ) : (
                        <LineChart data={selectedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                            formatter={(value, name, props) => {
                              const lbl = props.payload.labels ? props.payload.labels[status] : '';
                              return [value, `${status} ${lbl ? `(${lbl})` : ''}`];
                            }}
                          />
                          <Line type="monotone" dataKey={status} stroke={statusColors[status]} strokeWidth={3} activeDot={{ r: 6 }} name={status} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedData.length === 0 && (
            <div className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Data tidak tersedia atau tidak memiliki nilai numerik untuk dibuatkan grafik.
            </div>
          )}
          
          {/* Rincian Per Tahun di dalam Panel Kanan */}
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              <TrendingUp size={20} color="var(--primary-color)" />
              Rincian Per Tahun
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {selectedData.length > 0 ? selectedData.map((row) => (
                <div key={row.tahun} className="card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    Tahun {row.tahun}
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.5rem' }}>Status</th>
                          <th style={{ padding: '0.5rem' }}>Nilai</th>
                          <th style={{ padding: '0.5rem' }}>Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Semua', 'Negeri', 'Swasta'].map(status => {
                          if (row[status] === undefined) return null;
                          const label = row.labels[status];
                          return (
                            <tr key={status} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{status}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{row.nilai_teks[status]}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '4px', 
                                  backgroundColor: label?.toLowerCase().includes('baik') || label?.toLowerCase().includes('atas') ? '#dcfce7' : 
                                                   label?.toLowerCase().includes('kurang') || label?.toLowerCase().includes('bawah') ? '#fee2e2' : '#f1f5f9',
                                  color: label?.toLowerCase().includes('baik') || label?.toLowerCase().includes('atas') ? '#166534' : 
                                         label?.toLowerCase().includes('kurang') || label?.toLowerCase().includes('bawah') ? '#991b1b' : '#334155',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}>
                                  {label || '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )) : (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  Belum ada data untuk indikator ini
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </main>
  );
}
