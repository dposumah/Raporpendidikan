'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Filter, School, Map as MapIcon, GraduationCap, ArrowRight, Layers, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamically import the map to prevent SSR issues with leaflet
const SispMap = dynamic(() => import('../../../components/SispMap'), { ssr: false, loading: () => <div style={{ height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: '12px' }}>Memuat Peta Persebaran...</div> });

export default function DashboardSispPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [kecamatan, setKecamatan] = useState('');
  const [kelurahan, setKelurahan] = useState('');

  const [availableFilters, setAvailableFilters] = useState({
    kecamatan: [],
    kelurahan: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data-sisp');
      if (!response.ok) throw new Error('Gagal memuat data');
      const result = await response.json();
      
      setData(result || []);

      const uniqueKec = [...new Set(result.map(d => d.kecamatan).filter(Boolean))].sort();
      setAvailableFilters(prev => ({ ...prev, kecamatan: uniqueKec }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = data;
    if (kecamatan) filtered = filtered.filter(d => d.kecamatan === kecamatan);
    
    const uniqueKel = [...new Set(filtered.map(d => d.kelurahan).filter(Boolean))].sort();
    setAvailableFilters(prev => ({ ...prev, kelurahan: uniqueKel }));
    
    if (kelurahan && !uniqueKel.includes(kelurahan)) {
      setKelurahan('');
    }
  }, [kecamatan, data, kelurahan]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchKec = !kecamatan || d.kecamatan === kecamatan;
      const matchKel = !kelurahan || d.kelurahan === kelurahan;
      return matchKec && matchKel;
    });
  }, [data, kecamatan, kelurahan]);

  // Aggregate stats
  const totalSekolah = filteredData.length;
  
  const statusCounts = {};
  const bentukCounts = {};
  
  filteredData.forEach(d => {
    if (d.status_sekolah) statusCounts[d.status_sekolah] = (statusCounts[d.status_sekolah] || 0) + 1;
    if (d.bentuk_pendidikan) bentukCounts[d.bentuk_pendidikan] = (bentukCounts[d.bentuk_pendidikan] || 0) + 1;
  });

  const getDominant = (counts) => {
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  };

  const dominantStatus = getDominant(statusCounts);
  const dominantBentuk = getDominant(bentukCounts);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Data SISP...</p>
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
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Filter Persebaran</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kecamatan</label>
                <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}>
                  <option value="">Semua Kecamatan</option>
                  {availableFilters.kecamatan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kelurahan</label>
                <select value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}>
                  <option value="">Semua Kelurahan</option>
                  {availableFilters.kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <button 
                onClick={() => { setKecamatan(''); setKelurahan(''); }}
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
          
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Dashboard Satuan Pendidikan (SISP)</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Peta persebaran dan daftar sekolah</p>
          </div>

          {/* DYNAMIC CARDS - SUMMARY, STATUS & BENTUK (COMBINED) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #4f46e5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Sekolah</p>
                  <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}>{totalSekolah.toLocaleString()}</h3>
                </div>
              </div>
            </div>

            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={`status-${status}`} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{status || 'Tanpa Status'}</p>
                <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>{count.toLocaleString()}</h3>
              </div>
            ))}

            {Object.entries(bentukCounts).sort((a, b) => b[1] - a[1]).map(([bentuk, count]) => (
              <div key={`bentuk-${bentuk}`} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{bentuk || 'Tanpa Bentuk'}</p>
                <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>{count.toLocaleString()}</h3>
              </div>
            ))}
            
          </div>

          {/* MAP */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Peta Persebaran Lokasi Sekolah</h3>
            <SispMap data={filteredData} />
          </div>

          {/* TABLE */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Daftar Satuan Pendidikan</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Sekolah</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Bentuk & Status</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Lokasi</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 100).map((sekolah, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{sekolah.nama_satuan_pendidikan}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NPSN: {sekolah.npsn}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ color: '#334155', fontSize: '0.9rem' }}>{sekolah.bentuk_pendidikan}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sekolah.status_sekolah}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ color: '#334155', fontSize: '0.9rem' }}>Kec. {sekolah.kecamatan}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Kel. {sekolah.kelurahan}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => router.push(`/sekolah/${sekolah.npsn}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          <Eye size={16} /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length > 100 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        Menampilkan 100 dari {filteredData.length} sekolah. Gunakan pencarian untuk hasil lebih spesifik.
                      </td>
                    </tr>
                  )}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada sekolah yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
