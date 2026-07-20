'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { School, ChevronDown, ChevronRight, Users, User, Download, Search } from 'lucide-react';

export default function AnalisisRekapGuruPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for expanded rows (store by school name)
  const [expandedSchools, setExpandedSchools] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data-guru');
      if (!response.ok) throw new Error('Gagal memuat data');
      const result = await response.json();
      setData(result || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Group data by school
  const schoolData = useMemo(() => {
    const grouped = {};
    data.forEach(guru => {
      const sekolah = guru.tempat_tugas || 'Tidak Diketahui';
      if (!grouped[sekolah]) {
        grouped[sekolah] = {
          sekolah,
          jenjang: guru.jenjang || '-',
          kecamatan: guru.kecamatan || '-',
          totalGuru: 0,
          guruList: []
        };
      }
      grouped[sekolah].totalGuru++;
      grouped[sekolah].guruList.push(guru);
    });

    let result = Object.values(grouped).sort((a, b) => b.totalGuru - a.totalGuru);
    
    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.sekolah.toLowerCase().includes(q) || s.kecamatan.toLowerCase().includes(q));
    }
    
    return result;
  }, [data, searchQuery]);

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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Nama Sekolah</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Jenjang</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Kecamatan</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Total Guru</th>
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
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {s.guruList.map((g, i) => (
                                  <div key={i} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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
                                      <span>Pendidikan: {g.pendidikan || '-'}</span>
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
  );
}
