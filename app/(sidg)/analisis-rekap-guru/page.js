'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { School, ChevronDown, ChevronRight, Users, User, Download, Search, X, MapPin, GraduationCap, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

export default function AnalisisRekapGuruPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [jenjang, setJenjang] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [sekolah, setSekolah] = useState('');

  const [availableFilters, setAvailableFilters] = useState({
    jenjang: [],
    kecamatan: [],
    sekolah: []
  });

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: 'totalGuru', direction: 'desc' });

  // State for expanded rows (store by school name)
  const [expandedSchools, setExpandedSchools] = useState(new Set());

  // Detail Modal State
  const [selectedGuru, setSelectedGuru] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data-guru');
      if (!response.ok) throw new Error('Gagal memuat data');
      const result = await response.json();
      setData(result || []);

      const uniqueJenjang = [...new Set(result.map(d => d.jenjang).filter(Boolean))].sort();
      const uniqueKec = [...new Set(result.map(d => d.kecamatan).filter(Boolean))].sort();
      
      setAvailableFilters(prev => ({ ...prev, jenjang: uniqueJenjang, kecamatan: uniqueKec }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = data;
    if (jenjang) filtered = filtered.filter(d => d.jenjang === jenjang);
    if (kecamatan) filtered = filtered.filter(d => d.kecamatan === kecamatan);
    
    const uniqueSekolah = [...new Set(filtered.map(d => d.tempat_tugas).filter(Boolean))].sort();
    setAvailableFilters(prev => ({ ...prev, sekolah: uniqueSekolah }));
    
    if (sekolah && !uniqueSekolah.includes(sekolah)) {
      setSekolah('');
    }
  }, [jenjang, kecamatan, data, sekolah]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchJenjang = !jenjang || d.jenjang === jenjang;
      const matchKecamatan = !kecamatan || d.kecamatan === kecamatan;
      const matchSekolah = !sekolah || d.tempat_tugas === sekolah;
      return matchJenjang && matchKecamatan && matchSekolah;
    });
  }, [data, jenjang, kecamatan, sekolah]);

  // Group data by school
  const schoolData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(guru => {
      const tempatSekolah = guru.tempat_tugas || 'Tidak Diketahui';
      if (!grouped[tempatSekolah]) {
        grouped[tempatSekolah] = {
          sekolah: tempatSekolah,
          jenjang: guru.jenjang || '-',
          kecamatan: guru.kecamatan || '-',
          totalGuru: 0,
          guruList: []
        };
      }
      grouped[tempatSekolah].totalGuru++;
      grouped[tempatSekolah].guruList.push(guru);
    });

    let result = Object.values(grouped);
    
    // Sort logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.sekolah.toLowerCase().includes(q) || s.kecamatan.toLowerCase().includes(q));
    }
    
    return result;
  }, [filteredData, searchQuery, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} color="#94a3b8" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} color="#4f46e5" /> : <ArrowDown size={14} color="#4f46e5" />;
  };

  const toggleExpand = (sekolahName) => {
    const newSet = new Set(expandedSchools);
    if (newSet.has(sekolahName)) {
      newSet.delete(sekolahName);
    } else {
      newSet.add(sekolahName);
    }
    setExpandedSchools(newSet);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Rekapitulasi Guru...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* LEFT SIDEBAR: FILTERS */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <Filter size={20} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Filter Data</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Jenjang</label>
                <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}>
                  <option value="">Semua Jenjang</option>
                  {availableFilters.jenjang.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kecamatan</label>
                <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}>
                  <option value="">Semua Kecamatan</option>
                  {availableFilters.kecamatan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sekolah (Tempat Tugas)</label>
                <select value={sekolah} onChange={(e) => setSekolah(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}>
                  <option value="">Semua Sekolah</option>
                  {availableFilters.sekolah.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <button 
                onClick={() => { setJenjang(''); setKecamatan(''); setSekolah(''); }}
                style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Rekapitulasi Guru per Sekolah</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Klik nama sekolah untuk melihat daftar lengkap tenaga pendidik di sekolah tersebut.</p>
            </div>
          </div>

          {/* Search */}
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '350px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari Nama Sekolah atau Kecamatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Total Sekolah: <span style={{ fontWeight: '600', color: '#0f172a' }}>{schoolData.length}</span>
            </div>
          </div>

          {/* Expandable Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ width: '50px', padding: '1rem' }}></th>
                    <th onClick={() => requestSort('sekolah')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Nama Sekolah {getSortIcon('sekolah')}</div>
                    </th>
                    <th onClick={() => requestSort('jenjang')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Jenjang {getSortIcon('jenjang')}</div>
                    </th>
                    <th onClick={() => requestSort('kecamatan')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Kecamatan {getSortIcon('kecamatan')}</div>
                    </th>
                    <th onClick={() => requestSort('totalGuru')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>Total Guru {getSortIcon('totalGuru')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schoolData.length > 0 ? schoolData.map((s, index) => {
                    const isExpanded = expandedSchools.has(s.sekolah);
                    return (
                      <React.Fragment key={s.sekolah + index}>
                        {/* Parent Row */}
                        <tr 
                          onClick={() => toggleExpand(s.sekolah)}
                          style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.2s', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}
                          onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                          onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.backgroundColor = 'white' }}
                        >
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <School size={18} color="#4f46e5" /> {s.sekolah}
                          </td>
                          <td style={{ padding: '1rem', color: '#334155', fontSize: '0.9rem' }}>{s.jenjang}</td>
                          <td style={{ padding: '1rem', color: '#334155', fontSize: '0.9rem' }}>{s.kecamatan}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '1rem' }}>
                            {s.totalGuru}
                          </td>
                        </tr>

                        {/* Child Rows (Expanded) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="5" style={{ padding: 0 }}>
                              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 3rem', borderBottom: '2px solid #e2e8f0', borderLeft: '4px solid #4f46e5' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Users size={16} /> Daftar Guru ({s.sekolah})
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                  {s.guruList.map((g, i) => (
                                    <div 
                                      key={i} 
                                      onClick={() => setSelectedGuru(g)}
                                      style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4f46e5', flexShrink: 0 }}>
                                          <User size={16} />
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.2' }}>{g.nama}</div>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{g.status_kepegawaian || 'Status Tdk Diketahui'}</div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                                        <span>NUPTK: {g.nuptk || '-'}</span>
                                        <span>Pend: {g.pendidikan || '-'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada sekolah yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DETAIL GURU */}
      {selectedGuru && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4f46e5' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>Profil Guru</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Detail Informasi & Kualifikasi</p>
                </div>
              </div>
              <button onClick={() => setSelectedGuru(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Header Info */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>{selectedGuru.nama}</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
                    NUPTK: {selectedGuru.nuptk || '-'}
                  </span>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
                    NIK: {selectedGuru.nik?.startsWith('TMP_') ? 'Belum Tersedia' : selectedGuru.nik}
                  </span>
                  <span style={{ backgroundColor: '#e0e7ff', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#4f46e5', fontWeight: '600' }}>
                    {selectedGuru.status_kepegawaian || 'Status Tidak Diketahui'}
                  </span>
                </div>
              </div>

              {/* Grid Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* Data Pribadi */}
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="#4f46e5" /> Data Pribadi
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <DetailRow label="Jenis Kelamin" value={selectedGuru.jenis_kelamin} />
                    <DetailRow label="Tempat Lahir" value={selectedGuru.tempat_lahir} />
                    <DetailRow label="Tanggal Lahir" value={selectedGuru.tanggal_lahir} />
                    <DetailRow label="Nomor HP" value={selectedGuru.nomor_hp} />
                    <DetailRow label="Status Tugas" value={selectedGuru.status_tugas} />
                  </div>
                </div>

                {/* Data Tugas */}
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} color="#10b981" /> Lokasi Tugas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <DetailRow label="Tempat Tugas" value={selectedGuru.tempat_tugas} />
                    <DetailRow label="Jenjang" value={selectedGuru.jenjang} />
                    <DetailRow label="NPSN" value={selectedGuru.npsn} />
                    <DetailRow label="Kecamatan" value={selectedGuru.kecamatan} />
                    <DetailRow label="Kabupaten/Kota" value={selectedGuru.kabupaten_kota} />
                  </div>
                </div>

                {/* Kualifikasi & Sertifikasi */}
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={18} color="#0ea5e9" /> Pendidikan & Sertifikasi
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <DetailRow label="Pendidikan Terakhir" value={selectedGuru.pendidikan} />
                    <DetailRow label="Bidang Studi Pendidikan" value={selectedGuru.bidang_studi_pendidikan} />
                    <DetailRow label="Bidang Studi Sertifikasi" value={selectedGuru.bidang_studi_sertifikasi} />
                  </div>
                </div>

                {/* Kepegawaian & Kinerja */}
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={18} color="#f59e0b" /> Jabatan & Kepegawaian
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <DetailRow label="NIP" value={selectedGuru.nip} />
                    <DetailRow label="Pangkat/Golongan" value={selectedGuru.pangkat_gol} />
                    <DetailRow label="TMT Pengangkatan" value={selectedGuru.tmt_pengangkatan} />
                    <DetailRow label="Masa Kerja" value={selectedGuru.masa_kerja_tahun ? `${selectedGuru.masa_kerja_tahun} Tahun ${selectedGuru.masa_kerja_bulan || 0} Bulan` : '-'} />
                    <DetailRow label="Jenis PTK" value={selectedGuru.jenis_ptk} />
                    <DetailRow label="Jabatan PTK" value={selectedGuru.jabatan_ptk} />
                    <DetailRow label="Mata Pelajaran Diajarkan" value={selectedGuru.mata_pelajaran_diajarkan} />
                    <DetailRow label="Jam Mengajar/Minggu" value={selectedGuru.jam_mengajar_perminggu ? `${selectedGuru.jam_mengajar_perminggu} Jam` : '-'} />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Helper Component for Details
function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.25rem' }}>
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
    </div>
  );
}
