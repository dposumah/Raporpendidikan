'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, Eye, EyeOff, Users, CheckCircle, School, AlertCircle, MapPin, X, ChevronDown, ChevronRight, User, Users as FamilyIcon, FileText, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function DataPendidikanPage() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [kecamatanFilter, setKecamatanFilter] = useState('');
  const [kelurahanFilter, setKelurahanFilter] = useState('');
  const [kelas, setKelas] = useState('');
  const [statusPIP, setStatusPIP] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState('data');

  // Unmask state
  const [unmaskedRows, setUnmaskedRows] = useState(new Set());
  
  // Detail Modal
  const [selectedSiswa, setSelectedSiswa] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const supabase = createClient();

  // 1. FETCH ALL DATA ONCE
  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount!

  const fetchData = async () => {
    setLoading(true);
    let allResult = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase.from('siswa').select('*').range(from, from + limit - 1);
      const { data: result, error } = await query;
      
      if (error) {
        console.error('Error fetching data:', error);
        hasMore = false;
      } else {
        if (result && result.length > 0) {
          allResult = [...allResult, ...result];
          from += limit;
          if (result.length < limit) hasMore = false;
        } else {
          hasMore = false;
        }
      }
    }

    setAllData(allResult);
    setLoading(false);
  };

  // 2. CLIENT-SIDE FILTERING (Blazing Fast)
  const filteredData = useMemo(() => {
    return allData.filter(s => {
      let match = true;
      if (jenjang && s.jenjang !== jenjang) match = false;
      if (sekolah && s.nama_sekolah !== sekolah) match = false;
      
      const sKec = s.sekolah_kecamatan || s.kecamatan_siswa || '';
      if (kecamatanFilter && sKec !== kecamatanFilter) match = false;
      
      const sKel = s.sekolah_desa_kelurahan || s.kelurahan_siswa || '';
      if (kelurahanFilter && sKel !== kelurahanFilter) match = false;
      
      if (kelas && String(s.kelas) !== String(kelas)) match = false;
      if (statusPIP === 'layak' && !s.layak_pip) match = false;
      if (statusPIP === 'tidak_layak' && s.layak_pip) match = false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nama = (s.nama_peserta_didik || '').toLowerCase();
        const nisn = (s.nisn || '').toLowerCase();
        const nik = (s.nik || '').toLowerCase();
        
        if (!nama.includes(q) && !nisn.includes(q) && !nik.includes(q)) {
          match = false;
        }
      }
      return match;
    });
  }, [allData, jenjang, sekolah, kecamatanFilter, kelurahanFilter, kelas, statusPIP, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [jenjang, sekolah, kecamatanFilter, kelurahanFilter, kelas, statusPIP, searchQuery]);

  // 3. DERIVED STATS FROM FILTERED DATA
  const stats = useMemo(() => {
    const total = filteredData.length;
    const pip = filteredData.filter(s => s.layak_pip).length;
    const uniqueSekolah = new Set(filteredData.map(s => s.nama_sekolah).filter(Boolean)).size;
    return {
      totalSiswa: total,
      persenPIP: total > 0 ? Math.round((pip / total) * 100) : 0,
      totalSekolah: uniqueSekolah
    };
  }, [filteredData]);

  const handleSearch = (e) => {
    e.preventDefault();
    // No-op since search is now real-time through useMemo
  };

  const toggleMask = (id) => {
    const newUnmasked = new Set(unmaskedRows);
    if (newUnmasked.has(id)) {
      newUnmasked.delete(id);
    } else {
      newUnmasked.add(id);
    }
    setUnmaskedRows(newUnmasked);
  };

  const maskData = (text) => {
    if (!text) return '-';
    if (text.length > 6) {
      return text.substring(0, 4) + '*'.repeat(text.length - 6) + text.substring(text.length - 2);
    }
    return '***';
  };

  // Group data for Rekapitulasi: Jenjang -> Kecamatan -> Kelurahan -> Sekolah
  const rekapData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(s => {
      const j = s.jenjang || 'Tanpa Jenjang';
      const kec = s.sekolah_kecamatan || s.kecamatan_siswa || 'Tanpa Kecamatan';
      const kel = s.sekolah_desa_kelurahan || s.kelurahan_siswa || 'Tanpa Kelurahan';
      const sek = s.nama_sekolah || 'Tanpa Sekolah';

      if (!grouped[j]) grouped[j] = {};
      if (!grouped[j][kec]) grouped[j][kec] = {};
      if (!grouped[j][kec][kel]) grouped[j][kec][kel] = {};
      if (!grouped[j][kec][kel][sek]) grouped[j][kec][kel][sek] = { total: 0, pip: 0, l: 0, p: 0 };
      
      const node = grouped[j][kec][kel][sek];
      node.total++;
      if (s.layak_pip) node.pip++;
      if (s.jenis_kelamin?.toLowerCase() === 'l') node.l++;
      else if (s.jenis_kelamin?.toLowerCase() === 'p') node.p++;
    });
    return grouped;
  }, [filteredData]);

  const RekapNode = ({ label, dataObj, depth = 0 }) => {
    const [open, setOpen] = useState(depth < 1);
    const isLeaf = dataObj.total !== undefined; // Leaf is Sekolah level
    
    if (isLeaf) {
      return (
        <div style={{ marginLeft: `${depth * 1.5}rem`, padding: '0.75rem 1rem', background: 'white', borderLeft: '2px solid #cbd5e1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><School size={16} color="#64748b"/> {label}</div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{color: '#64748b'}}>L: <strong style={{color: '#0f172a'}}>{dataObj.l}</strong></span>
            <span style={{color: '#64748b'}}>P: <strong style={{color: '#0f172a'}}>{dataObj.p}</strong></span>
            <span style={{color: '#64748b'}}>PIP: <strong style={{color: '#059669'}}>{dataObj.pip}</strong></span>
            <span style={{color: '#0f172a', fontWeight: '700'}}>Total: {dataObj.total}</span>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginLeft: `${depth * 1.5}rem`, marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setOpen(!open)}
          style={{ width: '100%', background: depth === 0 ? '#f1f5f9' : 'transparent', border: depth === 0 ? '1px solid #e2e8f0' : 'none', borderBottom: depth !== 0 ? '1px solid #e2e8f0' : '', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'left', borderRadius: depth === 0 ? '8px' : '0' }}
        >
          {open ? <ChevronDown size={18} color="#64748b"/> : <ChevronRight size={18} color="#64748b"/>}
          <strong style={{ color: '#0f172a', fontSize: depth === 0 ? '1rem' : '0.95rem' }}>{label}</strong>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', background: '#e2e8f0', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>
            {Object.keys(dataObj).length} sub-item
          </span>
        </button>
        {open && (
          <div style={{ marginTop: '0.5rem' }}>
            {Object.entries(dataObj).map(([key, val]) => (
              <RekapNode key={key} label={key} dataObj={val} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Sistem Informasi Data Siswa (SIDS)</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>SANGAT RAHASIA - Internal Dinas Pendidikan Kota Tomohon</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/admin-siswa" style={{ textDecoration: 'none', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Unggah Data Excel
            </Link>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Restricted Access
            </div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('data')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: '600', color: activeTab === 'data' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'data' ? '3px solid #0284c7' : '3px solid transparent', marginBottom: '-9px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Pangkalan Data Siswa
          </button>
          <button 
            onClick={() => setActiveTab('rekap')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: '600', color: activeTab === 'rekap' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'rekap' ? '3px solid #0284c7' : '3px solid transparent', marginBottom: '-9px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Analisis & Rekapitulasi (Multi-Level)
          </button>
        </div>

        {activeTab === 'data' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* KPI Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '12px', color: '#0284c7' }}><Users size={28} /></div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Total Siswa Terdata</div>
                  <div style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '700' }}>{stats.totalSiswa.toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '12px', color: '#059669' }}><CheckCircle size={28} /></div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Persentase Layak PIP</div>
                  <div style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '700' }}>{stats.persenPIP}%</div>
                </div>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '12px', color: '#9333ea' }}><School size={28} /></div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Total Sekolah Terdata</div>
                  <div style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '700' }}>{stats.totalSekolah}</div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', color: '#64748b' }}><Filter size={20} /></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Pencarian Cepat & Filter</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Jenjang</label>
                  <select value={jenjang} onChange={e => setJenjang(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                    <option value="">Semua Jenjang</option>
                    {Array.from(new Set(allData.map(s => s.jenjang).filter(Boolean))).sort().map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Kecamatan</label>
                  <select value={kecamatanFilter} onChange={e => setKecamatanFilter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                    <option value="">Semua Kecamatan</option>
                    {Array.from(new Set(allData.map(s => s.sekolah_kecamatan || s.kecamatan_siswa).filter(Boolean))).sort().map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Kelurahan / Desa (Cari)</label>
                  <input 
                    list="kelurahan-list" 
                    value={kelurahanFilter} 
                    onChange={e => setKelurahanFilter(e.target.value)} 
                    placeholder="Ketik/Pilih Kelurahan..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }} 
                  />
                  <datalist id="kelurahan-list">
                    {Array.from(new Set(allData.map(s => s.sekolah_desa_kelurahan || s.kelurahan_siswa).filter(Boolean))).sort().map(k => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Sekolah (Cari)</label>
                  <input 
                    list="sekolah-list" 
                    value={sekolah} 
                    onChange={e => setSekolah(e.target.value)} 
                    placeholder="Ketik/Pilih Sekolah..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }} 
                  />
                  <datalist id="sekolah-list">
                    {Array.from(new Set(allData.map(s => s.nama_sekolah).filter(Boolean))).sort().map(k => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>
              </div>

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Pencarian cerdas berdasarkan Nama, NISN, atau NIK..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <button type="submit" style={{ background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1.5rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#0369a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#0284c7'}>
                  Cari Data
                </button>
              </form>
            </div>

            {/* Data Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Nama Siswa</th>
                      <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>NISN</th>
                      <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Sekolah</th>
                      <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Kelas</th>
                      <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat data...</td></tr>
                    ) : filteredData.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data yang ditemukan.</td></tr>
                    ) : (
                      filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row) => {
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>{row.nama_peserta_didik}</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{row.nisn || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{row.nama_sekolah || '-'}</td>
                            <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{row.kelas} {row.nama_rombel ? `- ${row.nama_rombel}` : ''}</td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <button 
                                onClick={() => setSelectedSiswa(row)}
                                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#0284c7', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#0284c7'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                              >
                                Lihat Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Menampilkan <strong style={{ color: '#0f172a' }}>{((currentPage - 1) * rowsPerPage) + 1}</strong> hingga <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong> dari <strong style={{ color: '#0f172a' }}>{filteredData.length.toLocaleString('id-ID')}</strong> data
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                    >
                      Sebelumnya
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / rowsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
                      style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', color: currentPage >= Math.ceil(filteredData.length / rowsPerPage) ? '#94a3b8' : '#334155', cursor: currentPage >= Math.ceil(filteredData.length / rowsPerPage) ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rekap' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', color: '#d97706' }}><School size={24} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Struktur Hierarki Data</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Pengelompokan: Jenjang → Kecamatan → Kelurahan → Sekolah</p>
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {Object.keys(rekapData).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Memuat rekapitulasi atau data kosong...</div>
                ) : (
                  Object.entries(rekapData).map(([jenjangLabel, dataKec]) => (
                    <RekapNode key={jenjangLabel} label={jenjangLabel} dataObj={dataKec} depth={0} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Full Detail Siswa */}
        {selectedSiswa && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '100%', maxWidth: '850px', background: '#f8fafc', height: '100%', overflowY: 'auto', boxShadow: '-10px 0 25px rgba(0,0,0,0.2)', position: 'relative', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#e0f2fe', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{selectedSiswa.nama_peserta_didik}</h2>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      <span>NISN: {selectedSiswa.nisn || '-'}</span>
                      <span>NIK: {selectedSiswa.nik || '-'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedSiswa(null)} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  {/* Akademik Card */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><School size={18} color="#0284c7"/> Data Sekolah</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Sekolah</span> <strong style={{ color: '#334155' }}>{selectedSiswa.nama_sekolah || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>NPSN</span> <strong style={{ color: '#334155' }}>{selectedSiswa.npsn || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kelas / Rombel</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kelas || '-'} {selectedSiswa.nama_rombel ? `/ ${selectedSiswa.nama_rombel}` : ''}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Semester</span> <strong style={{ color: '#334155' }}>{selectedSiswa.semester || '-'}</strong></div>
                    </div>
                  </div>

                  {/* Personal Card */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><FileText size={18} color="#0284c7"/> Profil Pribadi</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Jenis Kelamin</span> <strong style={{ color: '#334155' }}>{selectedSiswa.jenis_kelamin || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Tempat, Tgl Lahir</span> <strong style={{ color: '#334155' }}>{selectedSiswa.tempat_lahir || '-'}, {selectedSiswa.tanggal_lahir || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Agama</span> <strong style={{ color: '#334155' }}>{selectedSiswa.agama || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kebutuhan Khusus</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kebutuhan_khusus || 'Tidak Ada'}</strong></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Family Card */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><FamilyIcon size={18} color="#0284c7"/> Data Keluarga</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>No. KK</span> <strong style={{ color: '#334155' }}>{selectedSiswa.no_kk || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama Ayah</span> <strong style={{ color: '#334155' }}>{selectedSiswa.nama_ayah || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama Ibu</span> <strong style={{ color: '#334155' }}>{selectedSiswa.nama_ibu_kandung || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Penghasilan Ortu</span> <strong style={{ color: '#334155' }}>{selectedSiswa.penghasilan_ayah || selectedSiswa.penghasilan_ortu || '-'}</strong></div>
                    </div>
                  </div>

                  {/* Kesejahteraan Card */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><Briefcase size={18} color="#0284c7"/> Kesejahteraan (PIP/KIP)</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Status Layak PIP</span> 
                        {selectedSiswa.layak_pip ? <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Layak</span> : <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Tidak Layak</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Alasan PIP</span> <strong style={{ color: '#334155', textAlign: 'right', maxWidth: '150px' }}>{selectedSiswa.alasan_layak_pip || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Penerima KIP</span> 
                        {selectedSiswa.penerima_kip ? <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Ya</span> : <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Tidak</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>No. KIP</span> <strong style={{ color: '#334155' }}>{selectedSiswa.no_kip || '-'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Lokasi & Peta Card */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><MapPin size={18} color="#0284c7"/> Lokasi & Koordinat Siswa</h3>
                  
                  <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
                    <div style={{ display: 'grid', gap: '0.5rem', color: '#334155', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <div><strong>Alamat:</strong> {selectedSiswa.alamat_siswa || '-'}</div>
                      <div><strong>Dusun/Kel:</strong> {selectedSiswa.dusun_siswa || '-'}, {selectedSiswa.kelurahan_siswa || '-'}</div>
                      <div><strong>Kecamatan/Kab:</strong> {selectedSiswa.kecamatan_siswa || '-'}, {selectedSiswa.kabupaten_siswa || '-'}</div>
                      <div><strong>Koordinat:</strong> {selectedSiswa.lintang || '-'} (Lat), {selectedSiswa.bujur || '-'} (Lng)</div>
                    </div>

                    {selectedSiswa.lintang && selectedSiswa.bujur && (
                      <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                        <iframe 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }}
                          loading="lazy" 
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${selectedSiswa.lintang},${selectedSiswa.bujur}&z=16&output=embed`}
                        ></iframe>
                      </div>
                    )}
                    {(!selectedSiswa.lintang || !selectedSiswa.bujur) && (
                      <div style={{ width: '100%', padding: '2rem', borderRadius: '12px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={32} color="#cbd5e1"/>
                        <span>Koordinat (Lintang/Bujur) tidak tersedia untuk siswa ini. Mini Map tidak dapat ditampilkan.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
