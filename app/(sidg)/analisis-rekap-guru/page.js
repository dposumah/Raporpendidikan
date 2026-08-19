'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { School, ChevronDown, ChevronRight, Users, User, Download, Search, X, MapPin, GraduationCap, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Filter, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
          totalSertifikasi: 0,
          totalBelum: 0,
          certPNS: 0, certPPPK: 0, certNonASN: 0,
          belumPNS: 0, belumPPPK: 0, belumNonASN: 0,
          pendidikan: { S1: 0, S2: 0, S3: 0, Diploma: 0, SMA: 0, Lainnya: 0 },
          guruList: []
        };
      }
      grouped[tempatSekolah].totalGuru++;
      
      const stat = (guru.status_kepegawaian || '').toUpperCase();
      const isPNS = stat.includes('PNS') || stat.includes('CPNS');
      const isPPPK = stat.includes('PPPK');
      
      const pend = (guru.pendidikan || '').toUpperCase();
      if (pend === 'S1') grouped[tempatSekolah].pendidikan.S1++;
      else if (pend === 'S2') grouped[tempatSekolah].pendidikan.S2++;
      else if (pend === 'S3') grouped[tempatSekolah].pendidikan.S3++;
      else if (pend === 'D1' || pend === 'D2' || pend === 'D3' || pend === 'D4') grouped[tempatSekolah].pendidikan.Diploma++;
      else if (pend.includes('SMA')) grouped[tempatSekolah].pendidikan.SMA++;
      else grouped[tempatSekolah].pendidikan.Lainnya++;
      
      if (guru.bidang_studi_sertifikasi && guru.bidang_studi_sertifikasi.trim() !== '' && guru.bidang_studi_sertifikasi.trim() !== '-') {
        grouped[tempatSekolah].totalSertifikasi++;
        if (isPNS) grouped[tempatSekolah].certPNS++;
        else if (isPPPK) grouped[tempatSekolah].certPPPK++;
        else grouped[tempatSekolah].certNonASN++;
      } else {
        grouped[tempatSekolah].totalBelum++;
        if (isPNS) grouped[tempatSekolah].belumPNS++;
        else if (isPPPK) grouped[tempatSekolah].belumPPPK++;
        else grouped[tempatSekolah].belumNonASN++;
      }
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
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} color="#991b1b" /> : <ArrowDown size={14} color="#991b1b" />;
  };

  const exportToExcel = () => {
    const exportData = schoolData.map(s => ({
      'Nama Sekolah': s.sekolah,
      'Jenjang': s.jenjang,
      'Kecamatan': s.kecamatan,
      'Total Guru': s.totalGuru,
      'Sudah Sertifikasi': s.totalSertifikasi,
      'Belum Sertifikasi': s.totalBelum,
      'Sertifikasi PNS': s.certPNS,
      'Sertifikasi PPPK': s.certPPPK,
      'Sertifikasi Non ASN': s.certNonASN,
      'Belum Sertifikasi PNS': s.belumPNS,
      'Belum Sertifikasi PPPK': s.belumPPPK,
      'Belum Sertifikasi Non ASN': s.belumNonASN,
      'Pendidikan S1': s.pendidikan.S1,
      'Pendidikan S2/S3': s.pendidikan.S2 + s.pendidikan.S3,
      'Pendidikan Diploma': s.pendidikan.Diploma,
      'Pendidikan SMA': s.pendidikan.SMA,
      'Pendidikan Lainnya': s.pendidikan.Lainnya
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Guru');
    XLSX.writeFile(workbook, 'Rekapitulasi_Guru.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Rekapitulasi Data Guru per Sekolah', 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const tableColumn = [
      'No', 'Sekolah', 'Jenjang', 'Kecamatan', 'Total Guru',
      'Sertifikasi', 'Belum Sert.', 'PNS Sert.', 'PPPK Sert.', 'S1', 'S2/S3'
    ];

    const tableRows = schoolData.map((s, idx) => [
      idx + 1,
      s.sekolah,
      s.jenjang,
      s.kecamatan,
      s.totalGuru,
      s.totalSertifikasi,
      s.totalBelum,
      s.certPNS,
      s.certPPPK,
      s.pendidikan.S1,
      s.pendidikan.S2 + s.pendidikan.S3
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [153, 27, 27] }, // #991b1b
    });

    doc.save('Rekapitulasi_Guru.pdf');
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fdfbf7' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#991b1b', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Rekapitulasi Guru...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* LEFT SIDEBAR: FILTERS */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#450a0a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <Filter size={20} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Filter Data</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Jenjang</label>
                <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fdfbf7', color: '#450a0a', fontSize: '0.95rem' }}>
                  <option value="">Semua Jenjang</option>
                  {availableFilters.jenjang.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kecamatan</label>
                <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fdfbf7', color: '#450a0a', fontSize: '0.95rem' }}>
                  <option value="">Semua Kecamatan</option>
                  {availableFilters.kecamatan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sekolah (Tempat Tugas)</label>
                <select value={sekolah} onChange={(e) => setSekolah(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fdfbf7', color: '#450a0a', fontSize: '0.95rem' }}>
                  <option value="">Semua Sekolah</option>
                  {availableFilters.sekolah.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <button 
                onClick={() => { setJenjang(''); setKecamatan(''); setSekolah(''); }}
                style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f3f0e7', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f0e7'}
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
              <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#450a0a', fontWeight: 'bold' }}>Rekapitulasi Guru per Sekolah</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Klik nama sekolah untuk melihat daftar lengkap tenaga pendidik di sekolah tersebut.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.9rem' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                <FileSpreadsheet size={18} /> Export Excel
              </button>
              <button 
                onClick={exportToPDF}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.9rem' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                <FileText size={18} /> Export PDF
              </button>
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
              Total Sekolah: <span style={{ fontWeight: '600', color: '#450a0a' }}>{schoolData.length}</span>
            </div>
          </div>

          {/* Expandable Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f0e7', borderBottom: '2px solid #e2e8f0' }}>
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
                    <th onClick={() => requestSort('totalSertifikasi')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>Sertifikasi {getSortIcon('totalSertifikasi')}</div>
                    </th>
                    <th onClick={() => requestSort('totalBelum')} style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>Belum {getSortIcon('totalBelum')}</div>
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
                          style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.2s', backgroundColor: isExpanded ? '#fdfbf7' : 'white' }}
                          onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.backgroundColor = '#fdfbf7' }}
                          onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.backgroundColor = 'white' }}
                        >
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#450a0a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <School size={18} color="#991b1b" /> {s.sekolah}
                          </td>
                          <td style={{ padding: '1rem', color: '#450a0a', fontSize: '0.9rem' }}>{s.jenjang}</td>
                          <td style={{ padding: '1rem', color: '#450a0a', fontSize: '0.9rem' }}>{s.kecamatan}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '1rem' }}>
                            {s.totalGuru}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0ea5e9', fontSize: '0.95rem' }}>
                            {s.totalSertifikasi}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#ef4444', fontSize: '0.95rem' }}>
                            {s.totalBelum}
                          </td>
                        </tr>

                        {/* Child Rows (Expanded) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="7" style={{ padding: 0 }}>
                              <div style={{ backgroundColor: '#fdfbf7', padding: '1.5rem 3rem', borderBottom: '2px solid #e2e8f0', borderLeft: '4px solid #991b1b' }}>
                                
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', gap: '2rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Sudah Sertifikasi</div>
                                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>PNS: <b>{s.certPNS}</b></span>
                                        <span>PPPK: <b>{s.certPPPK}</b></span>
                                        <span>Non ASN: <b>{s.certNonASN}</b></span>
                                      </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Belum Sertifikasi</div>
                                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>PNS: <b>{s.belumPNS}</b></span>
                                        <span>PPPK: <b>{s.belumPPPK}</b></span>
                                        <span>Non ASN: <b>{s.belumNonASN}</b></span>
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Status Pendidikan</div>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                      <span>S1: <b>{s.pendidikan.S1}</b></span>
                                      <span>S2/S3: <b>{s.pendidikan.S2 + s.pendidikan.S3}</b></span>
                                      <span>Diploma: <b>{s.pendidikan.Diploma}</b></span>
                                      <span>SMA: <b>{s.pendidikan.SMA}</b></span>
                                      <span>Lainnya: <b>{s.pendidikan.Lainnya}</b></span>
                                    </div>
                                  </div>
                                </div>

                                <h4 style={{ margin: '0 0 1rem 0', color: '#450a0a', fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Users size={16} /> Daftar Guru ({s.sekolah})
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                  {s.guruList.map((g, i) => (
                                    <div 
                                      key={i} 
                                      onClick={() => setSelectedGuru(g)}
                                      style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#991b1b'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#991b1b', flexShrink: 0 }}>
                                          <User size={16} />
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '600', color: '#450a0a', fontSize: '0.95rem', lineHeight: '1.2' }}>{g.nama}</div>
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
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
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
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#991b1b' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#450a0a', fontWeight: 'bold' }}>Profil Guru</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Detail Informasi & Kualifikasi</p>
                </div>
              </div>
              <button onClick={() => setSelectedGuru(null)} style={{ background: '#f3f0e7', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f0e7'}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Header Info */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: '#450a0a', fontWeight: 'bold' }}>{selectedGuru.nama}</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#f3f0e7', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
                    NUPTK: {selectedGuru.nuptk || '-'}
                  </span>
                  <span style={{ backgroundColor: '#f3f0e7', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
                    NIK: {selectedGuru.nik?.startsWith('TMP_') ? 'Belum Tersedia' : selectedGuru.nik}
                  </span>
                  <span style={{ backgroundColor: '#e0e7ff', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#991b1b', fontWeight: '600' }}>
                    {selectedGuru.status_kepegawaian || 'Status Tidak Diketahui'}
                  </span>
                </div>
              </div>

              {/* Grid Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* Data Pribadi */}
                <div style={{ backgroundColor: '#fdfbf7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#450a0a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="#991b1b" /> Data Pribadi
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
                <div style={{ backgroundColor: '#fdfbf7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#450a0a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div style={{ backgroundColor: '#fdfbf7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#450a0a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={18} color="#0ea5e9" /> Pendidikan & Sertifikasi
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <DetailRow label="Pendidikan Terakhir" value={selectedGuru.pendidikan} />
                    <DetailRow label="Bidang Studi Pendidikan" value={selectedGuru.bidang_studi_pendidikan} />
                    <DetailRow label="Bidang Studi Sertifikasi" value={selectedGuru.bidang_studi_sertifikasi} />
                  </div>
                </div>

                {/* Kepegawaian & Kinerja */}
                <div style={{ backgroundColor: '#fdfbf7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#450a0a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      <span style={{ color: '#450a0a', fontSize: '0.85rem', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
    </div>
  );
}
