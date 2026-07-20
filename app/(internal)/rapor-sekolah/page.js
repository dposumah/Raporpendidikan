'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, School, MapPin, ChevronDown, ChevronRight, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function RaporSekolahPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState('2025');
  const [search, setSearch] = useState('');
  
  const [selectedSekolah, setSelectedSekolah] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    setLoading(true);
    setSelectedSekolah(null);
    try {
      const { data: result, error } = await supabase
        .from('rapor_sekolah')
        .select('*')
        .eq('tahun', tahun)
        .order('nama_sekolah', { ascending: true });

      if (error) {
        console.error('Error fetching rapor sekolah:', error);
      } else {
        setData(result || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(s => 
      s.nama_sekolah.toLowerCase().includes(lowerSearch) || 
      s.npsn.includes(lowerSearch)
    );
  }, [data, search]);

  const renderTrendIcon = (text) => {
    if (!text) return <Minus size={16} color="#94a3b8" />;
    const lower = text.toLowerCase();
    if (lower.includes('naik')) return <TrendingUp size={16} color="#10b981" />;
    if (lower.includes('turun')) return <TrendingDown size={16} color="#ef4444" />;
    return <Minus size={16} color="#94a3b8" />;
  };

  const getLabelColor = (label) => {
    if (!label) return '#e2e8f0';
    const lower = label.toLowerCase();
    if (lower.includes('baik')) return '#dcfce7'; // green
    if (lower.includes('sedang')) return '#fef08a'; // yellow
    if (lower.includes('kurang')) return '#fee2e2'; // red
    return '#f1f5f9'; // default
  };

  const getLabelTextColor = (label) => {
    if (!label) return '#64748b';
    const lower = label.toLowerCase();
    if (lower.includes('baik')) return '#166534';
    if (lower.includes('sedang')) return '#854d0e';
    if (lower.includes('kurang')) return '#991b1b';
    return '#475569';
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Rapor Capaian Per Sekolah</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem', marginBottom: 0 }}>Analisis Rapor Pendidikan tingkat satuan pendidikan</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tahun:</label>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)}
            style={{ 
              padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: 'white', fontWeight: 'bold', fontSize: '0.9rem', outline: 'none'
            }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* LIST SEKOLAH */}
        <div style={{ flex: '1', minWidth: '350px', maxWidth: '400px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari nama sekolah atau NPSN..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat data sekolah...</div>
            ) : filteredData.length > 0 ? (
              filteredData.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSekolah(s)}
                  style={{ 
                    padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                    background: selectedSekolah?.id === s.id ? '#eff6ff' : 'transparent',
                    borderLeft: selectedSekolah?.id === s.id ? '4px solid #3b82f6' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: selectedSekolah?.id === s.id ? '#1d4ed8' : '#0f172a', fontSize: '0.95rem' }}>{s.nama_sekolah}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <School size={12}/> NPSN: {s.npsn}
                      </p>
                    </div>
                    <ChevronRight size={18} color={selectedSekolah?.id === s.id ? '#3b82f6' : '#cbd5e1'} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data sekolah ditemukan untuk tahun {tahun}.</div>
            )}
          </div>
        </div>

        {/* DETAIL INDIKATOR SEKOLAH */}
        <div style={{ flex: '2', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
          {selectedSekolah ? (
            <>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem' }}>{selectedSekolah.nama_sekolah}</h2>
                    <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><School size={14}/> {selectedSekolah.jenis_sekolah} ({selectedSekolah.status_sekolah})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> {selectedSekolah.kecamatan}, {selectedSekolah.kabupaten_kota}</span>
                    </div>
                  </div>
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                    Tahun {selectedSekolah.tahun}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#3b82f6" /> Capaian Indikator
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(selectedSekolah.indikator).map(([groupName, fields], idx) => {
                    const labelCapaian = fields['Label Capaian'] || fields['Label Capaian '] || fields['label_capaian'];
                    const nilai = fields['Perubahan Nilai'] || fields['Nilai'];
                    const tren = fields['Perubahan dari Tahun 2024'] || fields['Perubahan Nilai Capaian dari Tahun 2024'];
                    
                    // Ekstrak kode indikator (misal "D.18" dari "D.18 Kesiapsiagaan Bencana")
                    const kodeMatch = groupName.match(/^([A-Z]\\.\\d+(\\.\\d+)?)/);
                    const kode = kodeMatch ? kodeMatch[1] : '';
                    const title = kodeMatch ? groupName.substring(kode.length).trim() : groupName;

                    return (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        
                        <div style={{ background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                              {kode && <span style={{ background: '#3b82f6', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{kode}</span>}
                              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>{title}</h4>
                            </div>
                          </div>
                          
                          {labelCapaian && (
                            <div style={{ background: getLabelColor(labelCapaian), color: getLabelTextColor(labelCapaian), padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {labelCapaian}
                            </div>
                          )}
                        </div>

                        <div style={{ padding: '1rem', background: 'white' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {Object.entries(fields).filter(([k]) => !k.includes('Label Capaian')).map(([k, v], i) => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem' }}>{k}</span>
                                <div style={{ color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {k.toLowerCase().includes('perubahan') && renderTrendIcon(v)}
                                  <span>{v || '-'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <School size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', margin: 0 }}>Pilih salah satu sekolah di daftar kiri</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>untuk melihat rincian capaian indikator rapor pendidikan.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
