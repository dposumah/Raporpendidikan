'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, Eye, EyeOff, Users, CheckCircle, School, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DataPendidikanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [sekolah, setSekolah] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [statusPIP, setStatusPIP] = useState('');
  
  // KPI Stats
  const [stats, setStats] = useState({ totalSiswa: 0, persenPIP: 0, totalSekolah: 0 });

  // Unmask state
  const [unmaskedRows, setUnmaskedRows] = useState(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [sekolah, jenjang, kelas, statusPIP]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('siswa').select('*');

    if (sekolah) query = query.eq('nama_sekolah', sekolah);
    if (jenjang) query = query.eq('jenjang', jenjang);
    if (kelas) query = query.eq('kelas', kelas);
    if (statusPIP === 'layak') query = query.eq('layak_pip', true);
    if (statusPIP === 'tidak_layak') query = query.eq('layak_pip', false);

    const { data: result, error } = await query;
    
    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setData(result || []);
      
      // Calculate stats
      const total = result?.length || 0;
      const pip = result?.filter(s => s.layak_pip).length || 0;
      const uniqueSekolah = new Set(result?.map(s => s.nama_sekolah)).size;
      
      setStats({
        totalSiswa: total,
        persenPIP: total > 0 ? Math.round((pip / total) * 100) : 0,
        totalSekolah: uniqueSekolah
      });
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    // Call Supabase RPC for fuzzy search
    const { data: result, error } = await supabase.rpc('cari_siswa', { search_query: searchQuery });
    
    if (error) {
      console.error('Search error:', error);
      // Fallback to strict ILIKE if RPC is not created yet
      const fallback = await supabase.from('siswa').select('*')
        .or(`nama_peserta_didik.ilike.%${searchQuery}%,nisn.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%`);
      if (fallback.data) setData(fallback.data);
    } else {
      setData(result || []);
    }
    setLoading(false);
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

  const maskData = (text, type = 'nik') => {
    if (!text) return '-';
    // Keep first 4 and last 2, mask the rest
    if (text.length > 6) {
      return text.substring(0, 4) + '*'.repeat(text.length - 6) + text.substring(text.length - 2);
    }
    return '***';
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Multi-Level Filter</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Jenjang (Level 1)</label>
              <select value={jenjang} onChange={e => setJenjang(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                <option value="">Semua Jenjang</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Kelas (Level 2)</label>
              <select value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                <option value="">Semua Kelas</option>
                <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                <option value="7">7</option><option value="8">8</option><option value="9">9</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Status PIP (Level 3)</label>
              <select value={statusPIP} onChange={e => setStatusPIP(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                <option value="">Semua Status</option>
                <option value="layak">Layak PIP</option>
                <option value="tidak_layak">Non-PIP</option>
              </select>
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
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Nama Siswa / Sekolah</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>NISN</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>NIK & No KK (Masked)</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Kelas</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status PIP</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data yang ditemukan.</td></tr>
                ) : (
                  data.map((row) => {
                    const isUnmasked = unmaskedRows.has(row.id);
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{row.nama_peserta_didik}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.nama_sekolah}</div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{row.nisn || '-'}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            <div>
                              <div><span style={{color: '#94a3b8', fontSize: '0.75rem', width: '30px', display: 'inline-block'}}>NIK:</span> {isUnmasked ? row.nik : maskData(row.nik)}</div>
                              <div><span style={{color: '#94a3b8', fontSize: '0.75rem', width: '30px', display: 'inline-block'}}>KK:</span> {isUnmasked ? row.no_kk : maskData(row.no_kk)}</div>
                            </div>
                            <button 
                              onClick={() => toggleMask(row.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isUnmasked ? '#0284c7' : '#94a3b8', padding: '0.25rem' }}
                              title={isUnmasked ? "Sembunyikan NIK/KK" : "Tampilkan NIK/KK"}
                            >
                              {isUnmasked ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{row.kelas} {row.nama_rombel ? `- ${row.nama_rombel}` : ''}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {row.layak_pip ? (
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>Layak PIP</span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>Non-PIP</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <button style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#334155', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>
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
        </div>
      </div>
    </div>
  );
}
