'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, X, MapPin, Briefcase, User, Users, GraduationCap, Phone, Filter } from 'lucide-react';

export default function PencarianGuruPage() {
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Detail Modal
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
    let result = data;
    
    // Apply Dropdown Filters
    if (jenjang) result = result.filter(d => d.jenjang === jenjang);
    if (kecamatan) result = result.filter(d => d.kecamatan === kecamatan);
    if (sekolah) result = result.filter(d => d.tempat_tugas === sekolah);

    // Apply Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => {
        const nama = (g.nama || '').toLowerCase();
        const nik = (g.nik || '').toLowerCase();
        const nuptk = (g.nuptk || '').toLowerCase();
        const tempatTugas = (g.tempat_tugas || '').toLowerCase();
        return nama.includes(q) || nik.includes(q) || nuptk.includes(q) || tempatTugas.includes(q);
      });
    }

    return result;
  }, [data, jenjang, kecamatan, sekolah, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, jenjang, kecamatan, sekolah]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Data Pencarian Guru...</p>
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
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Filter Pencarian</h2>
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
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Pencarian Data Guru</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Cari profil lengkap guru berdasarkan Nama, NIK, NUPTK, atau Sekolah.</p>
          </div>

          {/* Search Bar */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Ketik Nama, NIK, NUPTK, atau Tempat Tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', color: '#0f172a' }}
              />
            </div>
            <div style={{ padding: '0.875rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
              {filteredData.length} Ditemukan
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>No</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Nama</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>NUPTK</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status Kepegawaian</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tempat Tugas</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? currentData.map((guru, index) => (
                    <tr key={guru.id || index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{startIndex + index + 1}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{guru.nama}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NIK: {guru.nik?.startsWith('TMP_') ? '-' : guru.nik}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#334155', fontSize: '0.9rem' }}>{guru.nuptk || '-'}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {guru.status_kepegawaian || 'Tidak Diketahui'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#334155', fontSize: '0.9rem' }}>
                        {guru.tempat_tugas}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedGuru(guru)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', padding: '0.25rem' }}
                          title="Lihat Detail"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada data guru yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Menampilkan <span style={{ fontWeight: '600', color: '#0f172a' }}>{startIndex + 1}</span> - <span style={{ fontWeight: '600', color: '#0f172a' }}>{Math.min(startIndex + rowsPerPage, filteredData.length)}</span> dari <span style={{ fontWeight: '600', color: '#0f172a' }}>{filteredData.length}</span> data
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    Sebelumnya
                  </button>
                  <div style={{ padding: '0.5rem 1rem', fontWeight: '600', color: '#0f172a' }}>{currentPage} / {totalPages}</div>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
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
