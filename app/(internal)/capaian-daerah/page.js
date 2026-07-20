'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Map, ChevronDown, ChevronRight, Activity, TrendingUp, TrendingDown, Minus, Info, X } from 'lucide-react';

export default function CapaianDaerahPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [tahun, setTahun] = useState('');
  const [jenisSatuan, setJenisSatuan] = useState('');
  const [statusSatuan, setStatusSatuan] = useState('');
  
  // UI States
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat data');
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData || []);
        setLoading(false);
        
        if (jsonData && jsonData.length > 0) {
          const years = [...new Set(jsonData.map(d => d.tahun))].sort((a, b) => b - a);
          if (years.length > 0) {
            setTahun(years[0].toString());
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Update cascade filters
  useEffect(() => {
    if (!tahun || data.length === 0) return;
    
    const filteredByYear = data.filter(d => d.tahun.toString() === tahun);
    const uniqueJenis = [...new Set(filteredByYear.map(d => d.jenis_satuan_pendidikan))].sort();
    
    if (uniqueJenis.length > 0) {
      if (!jenisSatuan || !uniqueJenis.includes(jenisSatuan)) {
        setJenisSatuan(uniqueJenis[0]);
      }
    } else {
      setJenisSatuan('');
    }
  }, [tahun, data]);

  useEffect(() => {
    if (!tahun || !jenisSatuan || data.length === 0) return;
    
    const filtered = data.filter(d => d.tahun.toString() === tahun && d.jenis_satuan_pendidikan === jenisSatuan);
    const uniqueStatus = [...new Set(filtered.map(d => d.status_satuan_pendidikan))];
    
    if (uniqueStatus.length > 0) {
      // Prioritaskan "Semua" jika ada, jika tidak ambil yang pertama
      if (uniqueStatus.includes('Semua')) {
        setStatusSatuan('Semua');
      } else if (!statusSatuan || !uniqueStatus.includes(statusSatuan)) {
        setStatusSatuan(uniqueStatus[0]);
      }
    } else {
      setStatusSatuan('');
    }
  }, [tahun, jenisSatuan, data]);


  const filterOptions = useMemo(() => {
    const years = [...new Set(data.map(d => d.tahun))].sort((a, b) => b - a);
    
    let jenisList = [];
    if (tahun) {
      jenisList = [...new Set(data.filter(d => d.tahun.toString() === tahun).map(d => d.jenis_satuan_pendidikan))].sort();
    }
    
    let statusList = [];
    if (tahun && jenisSatuan) {
      statusList = [...new Set(data.filter(d => d.tahun.toString() === tahun && d.jenis_satuan_pendidikan === jenisSatuan).map(d => d.status_satuan_pendidikan))];
    }

    return { years, jenisList, statusList };
  }, [data, tahun, jenisSatuan]);


  const groupedFilteredData = useMemo(() => {
    if (!tahun || !jenisSatuan || !statusSatuan) return [];

    const filtered = data.filter(d => 
      d.tahun.toString() === tahun && 
      d.jenis_satuan_pendidikan === jenisSatuan &&
      d.status_satuan_pendidikan === statusSatuan
    );

    const grouped = {};
    const forbiddenTitles = ['Penyerapan lulusan SMK', 'Pendapatan lulusan SMK', 'Kompetensi lulusan SMK', 'Link and match dengan dunia kerja'];
    const forbiddenKodes = new Set();
    
    filtered.forEach(item => {
      const kode = item.kode_indikator;
      if (!kode) return;

      const kodeMatch = kode.match(/^([A-Z])\.(\d+)(?:\.(\d+))?/);
      if (!kodeMatch) return; // Ignore non-standard codes
      
      const mainKode = `${kodeMatch[1]}.${kodeMatch[2]}`;
      const titleStr = item.nama_indikator;
      
      if (forbiddenTitles.some(f => titleStr.toLowerCase().includes(f.toLowerCase()))) {
        forbiddenKodes.add(mainKode);
      }
      
      const subNum = kodeMatch[3];
      
      if (!grouped[mainKode]) {
        grouped[mainKode] = { main: null, sub: [] };
      }
      
      if (!subNum) {
        grouped[mainKode].main = { ...item, kode: mainKode, title: titleStr };
      } else {
        grouped[mainKode].sub.push({ ...item, kode: kode, title: titleStr });
      }
    });

    forbiddenKodes.forEach(kode => {
      delete grouped[kode];
    });

    const sortedMainCodes = Object.keys(grouped).sort((a, b) => {
      const [aL, aN] = a.split('.');
      const [bL, bN] = b.split('.');
      if (aL !== bL) return aL.localeCompare(bL);
      return parseInt(aN) - parseInt(bN);
    });

    return sortedMainCodes.map(mainKode => {
      const group = grouped[mainKode];
      // Jika kebetulan header utamanya tidak ada tapi sub-nya ada, kita buatkan dummy
      const mainData = group.main || { kode: mainKode, title: 'Indikator ' + mainKode, nilai_teks: '-', label_capaian: '' };
      return { mainData, sub: group.sub };
    });

  }, [data, tahun, jenisSatuan, statusSatuan]);


  const getLabelColor = (label) => {
    if (!label) return '#f1f5f9';
    const l = label.toLowerCase();
    if (l.includes('baik') || l.includes('maju') || l.includes('tinggi')) return '#dcfce7';
    if (l.includes('sedang') || l.includes('berkembang')) return '#fef08a';
    if (l.includes('kurang') || l.includes('rendah') || l.includes('dasar')) return '#fee2e2';
    return '#f1f5f9';
  };

  const getLabelTextColor = (label) => {
    if (!label) return '#64748b';
    const l = label.toLowerCase();
    if (l.includes('baik') || l.includes('maju') || l.includes('tinggi')) return '#166534';
    if (l.includes('sedang') || l.includes('berkembang')) return '#854d0e';
    if (l.includes('kurang') || l.includes('rendah') || l.includes('dasar')) return '#991b1b';
    return '#475569';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Memuat data capaian daerah...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#f8fafc', overflow: 'hidden' }}>
      
      <div style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map size={24} color="#3b82f6" /> Capaian Daerah
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Melihat rincian indikator pendidikan tingkat daerah per tahun
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: '600' }}
          >
            <option value="">Pilih Tahun</option>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select 
            value={jenisSatuan} 
            onChange={(e) => setJenisSatuan(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: '600' }}
            disabled={!tahun}
          >
            <option value="">Pilih Jenjang</option>
            {filterOptions.jenisList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          
          <select 
            value={statusSatuan} 
            onChange={(e) => setStatusSatuan(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: '600' }}
            disabled={!jenisSatuan}
          >
            <option value="">Pilih Status</option>
            {filterOptions.statusList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {error && (
            <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem' }}>
              Error: {error}
            </div>
          )}

          {groupedFilteredData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {groupedFilteredData.map((group, idx) => {
                const { mainData, sub } = group;
                const { kode, title, label_capaian, nilai_teks } = mainData;
                
                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    
                    {/* MAIN INDICATOR HEADER */}
                    <div style={{ background: '#f1f5f9', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ background: '#2563eb', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>{kode}</span>
                          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>{title}</h4>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Nilai / Capaian</span>
                            <div style={{ color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                              <span>{nilai_teks || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                        {label_capaian && (
                          <div style={{ background: getLabelColor(label_capaian), color: getLabelTextColor(label_capaian), padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', border: `1px solid ${getLabelTextColor(label_capaian)}30` }}>
                            {label_capaian}
                          </div>
                        )}
                        
                        {sub.length > 0 && (
                          <button 
                            onClick={() => setSelectedDetail({ kode, title, sub })}
                            style={{ background: 'white', border: '1px solid #cbd5e1', color: '#334155', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            <Info size={14} /> Lihat Detail Sub
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
              <Activity size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem' }}>Tidak ada data capaian untuk kombinasi filter yang dipilih.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETAIL SUB INDIKATOR */}
      {selectedDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ background: '#2563eb', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{selectedDetail.kode}</span>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Detail Sub-Indikator</h3>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{selectedDetail.title}</p>
              </div>
              <button 
                onClick={() => setSelectedDetail(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedDetail.sub.sort((a, b) => {
                  const aNum = parseInt((a.kode || '').split('.')[2] || 0);
                  const bNum = parseInt((b.kode || '').split('.')[2] || 0);
                  return aNum - bNum;
                }).map((sub, sIdx) => (
                  <div key={sIdx} style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.9rem', backgroundColor: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{sub.kode}</span>
                        <h5 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: '600' }}>{sub.title}</h5>
                      </div>
                      {sub.label_capaian && (
                        <div style={{ background: getLabelColor(sub.label_capaian), color: getLabelTextColor(sub.label_capaian), padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                          {sub.label_capaian}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Nilai Capaian</span>
                        <div style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: '600' }}>
                          {sub.nilai_teks || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
