'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, BookOpen, AlertCircle, Lightbulb, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function PembenahanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [jenjang, setJenjang] = useState('');
  const [kelompokIndikator, setKelompokIndikator] = useState('');
  const [search, setSearch] = useState('');
  
  // UI State
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data-pembenahan');
      if (!response.ok) {
        throw new Error('Gagal memuat data pembenahan');
      }
      const result = await response.json();
      setData(result || []);
    } catch (error) {
      console.error('Error fetching akar masalah:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (indikator_prioritas) => {
    setExpandedCards(prev => ({
      ...prev,
      [indikator_prioritas]: !prev[indikator_prioritas]
    }));
  };

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const jenjangs = new Set();
    const kelompoks = new Set();
    
    data.forEach(item => {
      if (item.jenjang) jenjangs.add(item.jenjang);
      if (item.kelompok_indikator) kelompoks.add(item.kelompok_indikator);
    });

    return {
      jenjangs: Array.from(jenjangs).sort(),
      kelompoks: Array.from(kelompoks).sort()
    };
  }, [data]);

  // Group and filter data
  const groupedFilteredData = useMemo(() => {
    let filtered = data;
    
    if (jenjang) {
      filtered = filtered.filter(item => item.jenjang === jenjang);
    }
    
    if (kelompokIndikator) {
      filtered = filtered.filter(item => item.kelompok_indikator === kelompokIndikator);
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.indikator_prioritas && item.indikator_prioritas.toLowerCase().includes(lowerSearch)) ||
        (item.indikator_akar_masalah && item.indikator_akar_masalah.toLowerCase().includes(lowerSearch)) ||
        (item.nomenklatur_kegiatan && item.nomenklatur_kegiatan.toLowerCase().includes(lowerSearch))
      );
    }

    // Group by indikator_prioritas
    const grouped = {};
    filtered.forEach(item => {
      const p = item.indikator_prioritas || 'Tanpa Indikator Prioritas';
      if (!grouped[p]) {
        grouped[p] = {
          indikator_prioritas: p,
          kelompok_indikator: item.kelompok_indikator,
          indikator_kinerja_urusan: item.indikator_kinerja_urusan,
          items: []
        };
      }
      grouped[p].items.push(item);
    });

    // Sort alphabetically by indikator prioritas
    return Object.values(grouped).sort((a, b) => a.indikator_prioritas.localeCompare(b.indikator_prioritas));
  }, [data, jenjang, kelompokIndikator, search]);


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Memuat data referensi pembenahan...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={28} color="#3b82f6" /> Akar Masalah & Pembenahan
        </h1>
        <p style={{ margin: 0, color: '#64748b' }}>Referensi langkah Identifikasi, Refleksi, dan Benahi untuk setiap Indikator Prioritas daerah Anda.</p>
      </div>

      {/* FILTERS */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Pencarian</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari indikator atau kegiatan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Jenjang</label>
          <select 
            value={jenjang} 
            onChange={(e) => setJenjang(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="">Semua Jenjang</option>
            {filterOptions.jenjangs.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Kelompok Indikator</label>
          <select 
            value={kelompokIndikator} 
            onChange={(e) => setKelompokIndikator(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="">Semua Kelompok</option>
            {filterOptions.kelompoks.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTS SUMMARY */}
      <div style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Menampilkan <b>{groupedFilteredData.length}</b> Indikator Prioritas.
      </div>

      {/* DATA ACCORDION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groupedFilteredData.map((group, idx) => {
          const isExpanded = expandedCards[group.indikator_prioritas] || false;
          
          return (
            <div key={idx} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              
              {/* ACCORDION HEADER */}
              <div 
                onClick={() => toggleCard(group.indikator_prioritas)}
                style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white', transition: 'background 0.2s' }}
              >
                <div style={{ flex: 1, paddingRight: '2rem' }}>
                  <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {group.kelompok_indikator}
                  </div>
                  <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{group.indikator_prioritas}</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{group.indikator_kinerja_urusan}</p>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </div>

              {/* ACCORDION BODY */}
              {isExpanded && (
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  
                  {group.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      
                      {/* CARD REFLEKSI (Akar Masalah) */}
                      <div style={{ flex: '1 1 300px', background: 'white', border: '1px solid #fca5a5', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#fee2e2', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #fca5a5' }}>
                          <AlertCircle size={18} color="#b91c1c" />
                          <span style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.9rem' }}>REFLEKSI (Akar Masalah)</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.25rem' }}>NO. {item.no_indikator_akar_masalah}</span>
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem' }}>{item.indikator_akar_masalah}</h4>
                          </div>
                          <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', color: '#7f1d1d' }}>
                            <strong>Mengapa menjadi akar masalah?</strong><br/>
                            {item.mengapa_akar_masalah}
                          </div>
                          {item.deskripsi_sumber_data && (
                            <div style={{ background: '#fff1f2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#9f1239', marginTop: '0.5rem', border: '1px dashed #fecdd3' }}>
                              <strong>Deskripsi Sumber Data:</strong><br/>
                              {item.deskripsi_sumber_data}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CARD BENAHI (Solusi) */}
                      <div style={{ flex: '1 1 400px', background: 'white', border: '1px solid #86efac', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#dcfce7', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #86efac' }}>
                          <CheckCircle2 size={18} color="#15803d" />
                          <span style={{ color: '#15803d', fontWeight: 'bold', fontSize: '0.9rem' }}>BENAHI (Solusi Kegiatan)</span>
                          {item.jenjang && <span style={{ marginLeft: 'auto', background: '#166534', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>{item.jenjang}</span>}
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.05rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <Lightbulb size={18} color="#eab308" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                            <span>{item.nomenklatur_kegiatan}</span>
                          </h4>
                          <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.9rem' }}>{item.deskripsi_kegiatan}</p>
                          
                          <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', color: '#166534' }}>
                            <strong>Contoh Operasionalisasi:</strong><br/>
                            <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{item.contoh_operasionalisasi}</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>
          );
        })}
        
        {groupedFilteredData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Search size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Data Tidak Ditemukan</h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>Coba ubah kata kunci pencarian atau sesuaikan filter Anda.</p>
          </div>
        )}
      </div>

    </div>
  );
}
