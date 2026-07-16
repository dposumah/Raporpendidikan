'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, Eye, EyeOff, Users, CheckCircle, School, AlertCircle, MapPin, X, ChevronDown, ChevronRight, User, Users as FamilyIcon, FileText, Briefcase, Download } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [rekapTab, setRekapTab] = useState('domisili'); // domisili, jk, agama_umur, grafik

  // Unmask state
  const [unmaskedRows, setUnmaskedRows] = useState(new Set());
  
  // Detail Modal
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [selectedSekolah, setSelectedSekolah] = useState(null);

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
  }, [searchQuery, jenjang, sekolah, kecamatanFilter, kelurahanFilter, kelas, statusPIP]);

  // Cascading Filter Logic (Reset downstream filters when upstream changes)
  useEffect(() => {
    setKecamatanFilter('');
    setKelurahanFilter('');
    setSekolah('');
  }, [jenjang]);

  useEffect(() => {
    setKelurahanFilter('');
    setSekolah('');
  }, [kecamatanFilter]);

  useEffect(() => {
    setSekolah('');
  }, [kelurahanFilter]);

  // Dynamic Filter Options
  const jenjangOptions = useMemo(() => {
    return Array.from(new Set(allData.map(s => s.jenjang).filter(Boolean))).sort();
  }, [allData]);

  const kecamatanOptions = useMemo(() => {
    return Array.from(new Set(allData
      .filter(s => !jenjang || s.jenjang === jenjang)
      .map(s => s.sekolah_kecamatan || s.kecamatan_siswa)
      .filter(Boolean)
    )).sort();
  }, [allData, jenjang]);

  const kelurahanOptions = useMemo(() => {
    return Array.from(new Set(allData
      .filter(s => !jenjang || s.jenjang === jenjang)
      .filter(s => !kecamatanFilter || (s.sekolah_kecamatan || s.kecamatan_siswa) === kecamatanFilter)
      .map(s => s.sekolah_desa_kelurahan || s.kelurahan_siswa)
      .filter(Boolean)
    )).sort();
  }, [allData, jenjang, kecamatanFilter]);

  const sekolahOptions = useMemo(() => {
    return Array.from(new Set(allData
      .filter(s => !jenjang || s.jenjang === jenjang)
      .filter(s => !kecamatanFilter || (s.sekolah_kecamatan || s.kecamatan_siswa) === kecamatanFilter)
      .filter(s => !kelurahanFilter || (s.sekolah_desa_kelurahan || s.kelurahan_siswa) === kelurahanFilter)
      .map(s => s.nama_sekolah)
      .filter(Boolean)
    )).sort();
  }, [allData, jenjang, kecamatanFilter, kelurahanFilter]);

  // 3. DERIVED STATS FROM FILTERED DATA
  const stats = useMemo(() => {
    const total = filteredData.length;
    let l = 0;
    let p = 0;
    let tomohon = 0;
    let luarTomohon = 0;
    
    filteredData.forEach(s => {
      if (s.jenis_kelamin?.toLowerCase() === 'l') l++;
      else if (s.jenis_kelamin?.toLowerCase() === 'p') p++;
      
      const kabRaw = (s.kabupaten_siswa || '').toLowerCase().trim();
      const kecRaw = (s.kecamatan_siswa || '').toLowerCase().replace(/^kecamatan\s+/i, '').replace(/^kec\.\s+/i, '').trim();
      
      const validFull = ['tomohon tengah', 'tomohon timur', 'tomohon barat', 'tomohon selatan', 'tomohon utara'];
      const validShort = ['tengah', 'timur', 'barat', 'selatan', 'utara'];
      
      let isTomohon = false;
      if (validFull.includes(kecRaw)) {
        isTomohon = true;
      } else if (kabRaw.includes('tomohon') && validShort.includes(kecRaw)) {
        isTomohon = true;
      }
      
      if (isTomohon) tomohon++;
      else luarTomohon++;
    });
    
    const uniqueSekolah = new Set(filteredData.map(s => s.nama_sekolah).filter(Boolean)).size;
    return {
      totalSiswa: total,
      totalLaki: l,
      totalPerempuan: p,
      totalSekolah: uniqueSekolah,
      domisiliTomohon: tomohon,
      domisiliLuar: luarTomohon
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

  // Custom Searchable Dropdown Component
  const SearchableSelect = ({ value, onChange, options, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>{label}</label>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: value ? '#0f172a' : '#94a3b8', background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
          <ChevronDown size={16} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        
        {isOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <input 
                type="text" 
                autoFocus
                placeholder="Ketik untuk mencari..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div 
                onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#64748b', background: !value ? '#f1f5f9' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = !value ? '#f1f5f9' : 'transparent'}
              >
                {placeholder} (Semua)
              </div>
              {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                <div 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#0f172a', background: value === opt ? '#e0f2fe' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = value === opt ? '#e0f2fe' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = value === opt ? '#e0f2fe' : 'transparent'}
                >
                  {opt}
                </div>
              )) : (
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>Tidak ditemukan</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Group data for Rekapitulasi Domisili: Tomohon (Kec -> Kel) / Luar Tomohon (Kab -> Kec)
  const domisiliRekapData = useMemo(() => {
    const grouped = {
      'Kota Tomohon': {},
      'Luar Kota Tomohon': {}
    };

    filteredData.forEach(s => {
      const kabRaw = (s.kabupaten_siswa || '').toLowerCase().trim();
      const kecRaw = (s.kecamatan_siswa || '').toLowerCase().replace(/^kecamatan\s+/i, '').replace(/^kec\.\s+/i, '').trim();
      
      let isTomohon = false;
      let matchedKec = s.kecamatan_siswa || 'Tanpa Kecamatan';

      if (kecRaw === 'tomohon tengah' || (kabRaw.includes('tomohon') && kecRaw === 'tengah')) { isTomohon = true; matchedKec = 'Tomohon Tengah'; }
      else if (kecRaw === 'tomohon timur' || (kabRaw.includes('tomohon') && kecRaw === 'timur')) { isTomohon = true; matchedKec = 'Tomohon Timur'; }
      else if (kecRaw === 'tomohon barat' || (kabRaw.includes('tomohon') && kecRaw === 'barat')) { isTomohon = true; matchedKec = 'Tomohon Barat'; }
      else if (kecRaw === 'tomohon selatan' || (kabRaw.includes('tomohon') && kecRaw === 'selatan')) { isTomohon = true; matchedKec = 'Tomohon Selatan'; }
      else if (kecRaw === 'tomohon utara' || (kabRaw.includes('tomohon') && kecRaw === 'utara')) { isTomohon = true; matchedKec = 'Tomohon Utara'; }
      
      const kec = matchedKec;
      const kel = s.kelurahan_siswa || 'Tanpa Kelurahan';
      const kabAsli = s.kabupaten_siswa || 'Tanpa Kabupaten';

      if (isTomohon) {
        if (!grouped['Kota Tomohon'][kec]) grouped['Kota Tomohon'][kec] = {};
        if (!grouped['Kota Tomohon'][kec][kel]) grouped['Kota Tomohon'][kec][kel] = { total: 0, pip: 0, l: 0, p: 0 };
        const node = grouped['Kota Tomohon'][kec][kel];
        node.total++;
        if (s.layak_pip) node.pip++;
        if (s.jenis_kelamin?.toLowerCase() === 'l') node.l++;
        else if (s.jenis_kelamin?.toLowerCase() === 'p') node.p++;
      } else {
        if (!grouped['Luar Kota Tomohon'][kabAsli]) grouped['Luar Kota Tomohon'][kabAsli] = {};
        if (!grouped['Luar Kota Tomohon'][kabAsli][kec]) grouped['Luar Kota Tomohon'][kabAsli][kec] = { total: 0, pip: 0, l: 0, p: 0 };
        const node = grouped['Luar Kota Tomohon'][kabAsli][kec];
        node.total++;
        if (s.layak_pip) node.pip++;
        if (s.jenis_kelamin?.toLowerCase() === 'l') node.l++;
        else if (s.jenis_kelamin?.toLowerCase() === 'p') node.p++;
      }
    });
    
    // Remove empty groups
    if (Object.keys(grouped['Kota Tomohon']).length === 0) delete grouped['Kota Tomohon'];
    if (Object.keys(grouped['Luar Kota Tomohon']).length === 0) delete grouped['Luar Kota Tomohon'];

    return grouped;
  }, [filteredData]);

  // General Rekapitulasi Aggregations
  const rekapitulasiAggregates = useMemo(() => {
    const agg = {
      jenisKelamin: { L: 0, P: 0, TidakDiketahui: 0 },
      agama: {},
      umur: {},
      kebutuhanKhusus: {},
      jenisTinggal: {},
      transportasi: {}
    };

    const parseDate = (d) => {
      if (!d) return null;
      if (!isNaN(d) && Number(d) > 20000) return new Date((d - 25569) * 86400 * 1000);
      const parts = String(d).split(/[-\/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1]-1, parts[2]);
        else return new Date(parts[2], parts[1]-1, parts[0]);
      }
      return new Date(d);
    };

    const today = new Date();

    filteredData.forEach(s => {
      const jk = (s.jenis_kelamin || '').toLowerCase();
      if (jk === 'l' || jk === 'laki-laki') agg.jenisKelamin.L++;
      else if (jk === 'p' || jk === 'perempuan') agg.jenisKelamin.P++;
      else agg.jenisKelamin.TidakDiketahui++;

      const agama = s.agama || 'Tidak Diketahui';
      agg.agama[agama] = (agg.agama[agama] || 0) + 1;

      let umurLabel = 'Tidak Diketahui';
      const tgl = parseDate(s.tanggal_lahir);
      if (tgl && !isNaN(tgl.getTime())) {
        let age = today.getFullYear() - tgl.getFullYear();
        const m = today.getMonth() - tgl.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < tgl.getDate())) age--;
        if (age >= 0 && age <= 30) umurLabel = `${age} Tahun`;
        else umurLabel = 'Lainnya';
      }
      agg.umur[umurLabel] = (agg.umur[umurLabel] || 0) + 1;

      const kk = s.kebutuhan_khusus || 'Tidak Ada';
      agg.kebutuhanKhusus[kk] = (agg.kebutuhanKhusus[kk] || 0) + 1;

      const jt = s.jenis_tinggal || 'Tidak Diketahui';
      agg.jenisTinggal[jt] = (agg.jenisTinggal[jt] || 0) + 1;

      const trans = s.alat_transportasi || 'Tidak Diketahui';
      agg.transportasi[trans] = (agg.transportasi[trans] || 0) + 1;
    });
    
    // Sort Age Object properly
    const sortedUmur = {};
    Object.keys(agg.umur).sort((a,b) => parseInt(a) - parseInt(b)).forEach(k => sortedUmur[k] = agg.umur[k]);
    agg.umur = sortedUmur;

    return agg;
  }, [filteredData]);

  // Rekapitulasi Per Sekolah
  const rekapSekolahData = useMemo(() => {
    const data = {};
    const today = new Date();
    
    const parseDate = (d) => {
      if (!d) return null;
      if (!isNaN(d) && Number(d) > 20000) return new Date((d - 25569) * 86400 * 1000);
      const parts = String(d).split(/[-\/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1]-1, parts[2]);
        else return new Date(parts[2], parts[1]-1, parts[0]);
      }
      return new Date(d);
    };

    filteredData.forEach(s => {
      const sek = s.nama_sekolah || 'Tanpa Sekolah';
      if (!data[sek]) {
        data[sek] = { total: 0, l: 0, p: 0, tomohon: 0, luar: 0, agama: {}, umur: {}, kelas: {} };
      }
      
      const node = data[sek];
      node.total++;
      
      // JK
      const jk = (s.jenis_kelamin || '').toLowerCase();
      if (jk === 'l' || jk === 'laki-laki') node.l++;
      else if (jk === 'p' || jk === 'perempuan') node.p++;
      
      // Domisili
      const kabRaw = (s.kabupaten_siswa || '').toLowerCase().trim();
      const kecRaw = (s.kecamatan_siswa || '').toLowerCase().replace(/^kecamatan\s+/i, '').replace(/^kec\.\s+/i, '').trim();
      let isTomohon = false;
      if (kecRaw === 'tomohon tengah' || (kabRaw.includes('tomohon') && kecRaw === 'tengah')) isTomohon = true;
      else if (kecRaw === 'tomohon timur' || (kabRaw.includes('tomohon') && kecRaw === 'timur')) isTomohon = true;
      else if (kecRaw === 'tomohon barat' || (kabRaw.includes('tomohon') && kecRaw === 'barat')) isTomohon = true;
      else if (kecRaw === 'tomohon selatan' || (kabRaw.includes('tomohon') && kecRaw === 'selatan')) isTomohon = true;
      else if (kecRaw === 'tomohon utara' || (kabRaw.includes('tomohon') && kecRaw === 'utara')) isTomohon = true;
      
      if (isTomohon) node.tomohon++;
      else node.luar++;
      
      // Agama
      const agama = s.agama || 'T/D';
      node.agama[agama] = (node.agama[agama] || 0) + 1;
      
      // Umur
      let umurLabel = 'Lainnya';
      const tgl = parseDate(s.tanggal_lahir);
      if (tgl && !isNaN(tgl.getTime())) {
        let age = today.getFullYear() - tgl.getFullYear();
        const m = today.getMonth() - tgl.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < tgl.getDate())) age--;
        if (age >= 0 && age <= 30) umurLabel = `${age}`;
      }
      node.umur[umurLabel] = (node.umur[umurLabel] || 0) + 1;
      
      // Kelas
      const kls = s.kelas || 'T/D';
      node.kelas[kls] = (node.kelas[kls] || 0) + 1;
    });
    
    // Sort Object entries by School name
    return Object.entries(data).sort((a,b) => a[0].localeCompare(b[0]));
  }, [filteredData]);

  // Export functions
  const exportToExcel = (dataArray, filename) => {
    const ws = XLSX.utils.json_to_sheet(dataArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToPDF = (headers, dataMatrix, title, filename) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: dataMatrix,
      startY: 25,
      styles: { fontSize: 9 }
    });
    doc.save(`${filename}.pdf`);
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

  // Premium Rekapitulasi Node
  const RekapNode = ({ label, dataObj, depth = 0 }) => {
    const [open, setOpen] = useState(depth < 1);
    
    // Check if leaf node (sekolah)
    const isLeaf = dataObj.total !== undefined;
    
    // Calculate aggregate totals for this node
    let aggTotal = 0;
    let aggL = 0;
    let aggP = 0;
    
    const calculateAggregates = (obj) => {
      if (obj.total !== undefined) {
        aggTotal += obj.total;
        aggL += obj.l;
        aggP += obj.p;
      } else {
        Object.values(obj).forEach(child => calculateAggregates(child));
      }
    };
    
    if (!isLeaf) {
      calculateAggregates(dataObj);
    } else {
      aggTotal = dataObj.total;
      aggL = dataObj.l;
      aggP = dataObj.p;
    }

    const paddingLeft = depth * 24 + 16;
    
    return (
      <div style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div 
          onClick={() => isLeaf ? setSelectedSekolah(label) : setOpen(!open)}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(250px, 2fr) 1fr 1fr 1fr', 
            gap: '1rem', 
            padding: '1rem', 
            background: depth === 0 ? '#f8fafc' : depth === 1 ? '#ffffff' : '#fcfcfc',
            cursor: 'pointer',
            alignItems: 'center',
            transition: 'background 0.2s',
            fontWeight: depth === 0 ? '700' : depth === 1 ? '600' : '500',
            color: depth === 0 ? '#0f172a' : '#334155'
          }}
          onMouseEnter={e => !isLeaf && (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => !isLeaf && (e.currentTarget.style.background = depth === 0 ? '#f8fafc' : depth === 1 ? '#ffffff' : '#fcfcfc')}
        >
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: `${paddingLeft}px` }}>
            {!isLeaf ? (
              <span style={{ marginRight: '8px', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
                <ChevronRight size={16} color="#64748b" />
              </span>
            ) : (
              <span style={{ marginRight: '8px', width: '16px', display: 'inline-block' }}></span>
            )}
            {label}
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>
              {aggTotal.toLocaleString('id-ID')} Siswa
            </span>
          </div>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>{aggL.toLocaleString('id-ID')} L</div>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>{aggP.toLocaleString('id-ID')} P</div>
        </div>
        
        {open && !isLeaf && (
          <div>
            {Object.entries(dataObj).map(([childLabel, childData]) => (
              <RekapNode key={childLabel} label={childLabel} dataObj={childData} depth={depth + 1} />
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
            Analisis & Rekap Sekolah
          </button>
          <button 
            onClick={() => setActiveTab('domisili')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: '600', color: activeTab === 'domisili' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'domisili' ? '3px solid #0284c7' : '3px solid transparent', marginBottom: '-9px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Rekapitulasi
          </button>
        </div>

        {activeTab === 'data' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                  <Users size={24} color="#3b82f6" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Total Siswa Terdata</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.totalSiswa.toLocaleString('id-ID')}</h2>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f0fdfa', padding: '1rem', borderRadius: '12px' }}>
                  <School size={24} color="#0d9488" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Total Sekolah</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.totalSekolah.toLocaleString('id-ID')}</h2>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                  <Users size={24} color="#0284c7" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Siswa Laki-laki</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.totalLaki.toLocaleString('id-ID')}</h2>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#fdf4ff', padding: '1rem', borderRadius: '12px' }}>
                  <Users size={24} color="#d946ef" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Siswa Perempuan</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.totalPerempuan.toLocaleString('id-ID')}</h2>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '12px' }}>
                  <MapPin size={24} color="#10b981" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Domisili Tomohon</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.domisiliTomohon.toLocaleString('id-ID')}</h2>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px' }}>
                  <MapPin size={24} color="#d97706" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Luar Tomohon</p>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' }}>{stats.domisiliLuar.toLocaleString('id-ID')}</h2>
                </div>
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
                    {jenjangOptions.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Kecamatan</label>
                  <select value={kecamatanFilter} onChange={e => setKecamatanFilter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none' }}>
                    <option value="">Semua Kecamatan</option>
                    {kecamatanOptions.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <SearchableSelect 
                    label="Kelurahan / Desa"
                    placeholder="Pilih Kelurahan"
                    value={kelurahanFilter}
                    onChange={setKelurahanFilter}
                    options={kelurahanOptions}
                  />
                </div>
                <div>
                  <SearchableSelect 
                    label="Sekolah"
                    placeholder="Pilih Sekolah"
                    value={sekolah}
                    onChange={setSekolah}
                    options={sekolahOptions}
                  />
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
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>
                  Tabel Analisis & Agregasi Multi-Level
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Klik pada baris Jenjang, Kecamatan, atau Kelurahan untuk melihat rincian datanya hingga tingkat Sekolah.
                </p>
              </div>
              
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ minWidth: '800px' }}>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 1fr 1fr 1fr', gap: '1rem', padding: '1rem', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <div>Klasifikasi Wilayah & Sekolah</div>
                    <div style={{ textAlign: 'center' }}>Total Siswa</div>
                    <div style={{ textAlign: 'center' }}>Laki-Laki</div>
                    <div style={{ textAlign: 'center' }}>Perempuan</div>
                  </div>
                  
                  {/* Table Body (Accordions) */}
                  <div style={{ padding: '0' }}>
                    {Object.entries(rekapData).length > 0 ? (
                      Object.entries(rekapData).map(([jenjangLabel, data]) => (
                        <RekapNode key={jenjangLabel} label={jenjangLabel} dataObj={data} depth={0} />
                      ))
                    ) : (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Pilih filter untuk melihat rekapitulasi data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domisili' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.4s ease' }}>
            
            {/* Sub-Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {[
                { id: 'domisili', label: 'Domisili' },
                { id: 'jk', label: 'Jenis Kelamin' },
                { id: 'agama_umur', label: 'Agama & Umur' },
                { id: 'sekolah', label: 'Per Sekolah' },
                { id: 'grafik', label: 'Grafik Demografi' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRekapTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: rekapTab === tab.id ? '#0284c7' : '#f1f5f9',
                    color: rekapTab === tab.id ? 'white' : '#64748b',
                    boxShadow: rekapTab === tab.id ? '0 4px 6px rgba(2, 132, 199, 0.2)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DOMISILI SUB-TAB */}
            {rekapTab === 'domisili' && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Tabel Rekapitulasi Berdasarkan Wilayah Domisili</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Dikelompokkan menjadi Kota Tomohon (Kecamatan → Kelurahan) dan Luar Kota Tomohon (Kabupaten → Kecamatan).</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        const flatData = [];
                        Object.entries(domisiliRekapData).forEach(([wil, d]) => {
                          flatData.push({ Kategori: wil, Total: d.count, 'Laki-Laki': d.l, Perempuan: d.p });
                          if (d.children) {
                            Object.entries(d.children).forEach(([kec, kecD]) => {
                              flatData.push({ Kategori: `  - ${kec}`, Total: kecD.count, 'Laki-Laki': kecD.l, Perempuan: kecD.p });
                            });
                          }
                        });
                        exportToExcel(flatData, 'Rekap_Domisili');
                      }}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    ><Download size={16} /> Export Excel</button>
                    <button 
                      onClick={() => {
                        const flatMatrix = [];
                        Object.entries(domisiliRekapData).forEach(([wil, d]) => {
                          flatMatrix.push([wil, d.count, d.l, d.p]);
                          if (d.children) {
                            Object.entries(d.children).forEach(([kec, kecD]) => {
                              flatMatrix.push([`  - ${kec}`, kecD.count, kecD.l, kecD.p]);
                            });
                          }
                        });
                        exportToPDF(['Status & Wilayah', 'Total', 'Laki-Laki', 'Perempuan'], flatMatrix, 'Rekapitulasi Berdasarkan Domisili', 'Rekap_Domisili');
                      }}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    ><Download size={16} /> Export PDF</button>
                  </div>
                </div>
                
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <div style={{ minWidth: '800px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 1fr 1fr 1fr', gap: '1rem', padding: '1rem', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      <div>Status & Wilayah Domisili</div>
                      <div style={{ textAlign: 'center' }}>Total Siswa</div>
                      <div style={{ textAlign: 'center' }}>Laki-Laki</div>
                      <div style={{ textAlign: 'center' }}>Perempuan</div>
                    </div>
                    
                    <div style={{ padding: '0' }}>
                      {Object.entries(domisiliRekapData).length > 0 ? (
                        Object.entries(domisiliRekapData).map(([wilayahLabel, data]) => (
                          <RekapNode key={wilayahLabel} label={wilayahLabel} dataObj={data} depth={0} />
                        ))
                      ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Pilih filter untuk melihat rekapitulasi domisili</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* JENIS KELAMIN SUB-TAB */}
            {rekapTab === 'jk' && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Rekapitulasi Jenis Kelamin</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Berdasarkan hasil saringan data saat ini.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => exportToExcel([
                        { Kategori: 'Laki-Laki', Total: rekapitulasiAggregates.jenisKelamin.L },
                        { Kategori: 'Perempuan', Total: rekapitulasiAggregates.jenisKelamin.P },
                        { Kategori: 'Tidak Diketahui', Total: rekapitulasiAggregates.jenisKelamin.TidakDiketahui },
                        { Kategori: 'Total', Total: filteredData.length }
                      ], 'Rekap_Jenis_Kelamin')}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Export Excel
                    </button>
                    <button 
                      onClick={() => exportToPDF(['Kategori', 'Total Siswa'], [
                        ['Laki-Laki', rekapitulasiAggregates.jenisKelamin.L],
                        ['Perempuan', rekapitulasiAggregates.jenisKelamin.P],
                        ['Tidak Diketahui', rekapitulasiAggregates.jenisKelamin.TidakDiketahui],
                        ['Total', filteredData.length]
                      ], 'Rekapitulasi Jenis Kelamin Siswa', 'Rekap_Jenis_Kelamin')}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Export PDF
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Kategori</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600', textAlign: 'right' }}>Total Siswa</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>Laki-Laki</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{rekapitulasiAggregates.jenisKelamin.L.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>Perempuan</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{rekapitulasiAggregates.jenisKelamin.P.toLocaleString('id-ID')}</td>
                      </tr>
                      {rekapitulasiAggregates.jenisKelamin.TidakDiketahui > 0 && (
                        <tr>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Tidak Diketahui</td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b' }}>{rekapitulasiAggregates.jenisKelamin.TidakDiketahui.toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                      <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                        <td style={{ padding: '1rem' }}>Total Keseluruhan</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>{filteredData.length.toLocaleString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AGAMA & UMUR SUB-TAB */}
            {rekapTab === 'agama_umur' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Tabel Agama */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Rekapitulasi Agama</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => exportToExcel(
                          Object.entries(rekapitulasiAggregates.agama).map(([k, v]) => ({ Agama: k, Total: v })),
                          'Rekap_Agama'
                        )}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      ><Download size={14} /> Excel</button>
                      <button 
                        onClick={() => exportToPDF(['Agama', 'Total Siswa'], Object.entries(rekapitulasiAggregates.agama), 'Rekapitulasi Agama Siswa', 'Rekap_Agama')}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      ><Download size={14} /> PDF</button>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Agama</th>
                          <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600', textAlign: 'right' }}>Total Siswa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(rekapitulasiAggregates.agama).sort((a,b) => b[1] - a[1]).map(([agama, total]) => (
                          <tr key={agama}>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>{agama}</td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{total.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabel Umur */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Rekapitulasi Umur</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => exportToExcel(
                          Object.entries(rekapitulasiAggregates.umur).map(([k, v]) => ({ Umur: k, Total: v })),
                          'Rekap_Umur'
                        )}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      ><Download size={14} /> Excel</button>
                      <button 
                        onClick={() => exportToPDF(['Umur', 'Total Siswa'], Object.entries(rekapitulasiAggregates.umur), 'Rekapitulasi Umur Siswa', 'Rekap_Umur')}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      ><Download size={14} /> PDF</button>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Rentang Umur</th>
                          <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600', textAlign: 'right' }}>Total Siswa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(rekapitulasiAggregates.umur).map(([umur, total]) => (
                          <tr key={umur}>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>{umur}</td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{total.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* GRAFIK SUB-TAB */}
            {rekapTab === 'grafik' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* Kebutuhan Khusus Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Grafik Kebutuhan Khusus</h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <BarChart data={Object.entries(rekapitulasiAggregates.kebutuhanKhusus).map(([n,v]) => ({name: n, Total: v}))} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="Total" fill="#0284c7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Jenis Tinggal Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Grafik Jenis Tinggal</h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <BarChart data={Object.entries(rekapitulasiAggregates.jenisTinggal).map(([n,v]) => ({name: n, Total: v}))} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="Total" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alat Transportasi Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Grafik Alat Transportasi</h3>
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer>
                      <BarChart data={Object.entries(rekapitulasiAggregates.transportasi).map(([n,v]) => ({name: n, Total: v}))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} interval={0} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* SEKOLAH SUB-TAB */}
            {rekapTab === 'sekolah' && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>Rekapitulasi Per Sekolah</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Ringkasan metrik demografi untuk setiap sekolah.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        const flatData = rekapSekolahData.map(([sekolah, d]) => ({
                          'Nama Sekolah': sekolah,
                          'Total Siswa': d.total,
                          'Laki-Laki': d.l,
                          'Perempuan': d.p,
                          'Tomohon': d.tomohon,
                          'Luar': d.luar,
                          'Agama': Object.entries(d.agama).map(([k,v]) => `${k}:${v}`).join(', '),
                          'Umur': Object.entries(d.umur).map(([k,v]) => `${k}:${v}`).join(', '),
                          'Kelas': Object.entries(d.kelas).map(([k,v]) => `${k}:${v}`).join(', ')
                        }));
                        exportToExcel(flatData, 'Rekap_Per_Sekolah');
                      }}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Export Excel
                    </button>
                    <button 
                      onClick={() => {
                        const flatMatrix = rekapSekolahData.map(([sekolah, d]) => [
                          sekolah,
                          d.total,
                          `${d.l} L / ${d.p} P`,
                          `${d.tomohon} T / ${d.luar} L`,
                          Object.entries(d.agama).map(([k,v]) => `${k}:${v}`).join(', '),
                          Object.entries(d.umur).map(([k,v]) => `${k}:${v}`).join(', '),
                          Object.entries(d.kelas).map(([k,v]) => `${k}:${v}`).join(', ')
                        ]);
                        exportToPDF(['Sekolah', 'Total', 'L/P', 'Domisili', 'Agama', 'Umur', 'Kelas'], flatMatrix, 'Rekapitulasi Per Sekolah', 'Rekap_Sekolah');
                      }}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Export PDF
                    </button>
                  </div>
                </div>
                
                <div style={{ width: '100%', overflowX: 'auto', maxHeight: '600px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Sekolah</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Total</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>L/P</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Domisili (T/L)</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Agama</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Umur</th>
                        <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Kelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapSekolahData.length > 0 ? rekapSekolahData.map(([sekolah, d], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{sekolah}</td>
                          <td style={{ padding: '1rem', color: '#0369a1', fontWeight: '600' }}>{d.total.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '1rem', color: '#334155', fontSize: '0.9rem' }}>{d.l} L / {d.p} P</td>
                          <td style={{ padding: '1rem', color: '#334155', fontSize: '0.9rem' }}>{d.tomohon} T / {d.luar} L</td>
                          <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', maxWidth: '200px' }}>{Object.entries(d.agama).map(([k,v]) => `${k}:${v}`).join(', ')}</td>
                          <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', maxWidth: '200px' }}>{Object.entries(d.umur).map(([k,v]) => `${k}:${v}`).join(', ')}</td>
                          <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', maxWidth: '150px' }}>{Object.entries(d.kelas).map(([k,v]) => `${k}:${v}`).join(', ')}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Pilih filter untuk melihat data sekolah</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal List Siswa per Sekolah */}
        {selectedSekolah && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '90%', maxWidth: '1000px', background: '#f8fafc', height: '90%', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f0fdfa', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
                    <School size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{selectedSekolah}</h2>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Daftar Siswa ({(allData.filter(s => s.nama_sekolah === selectedSekolah).length).toLocaleString('id-ID')} Siswa)
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedSekolah(null)} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>No</th>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Nama Siswa</th>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>NISN / NIK</th>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>L/P</th>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Kelas</th>
                        <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allData.filter(s => s.nama_sekolah === selectedSekolah).map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{s.nama_peserta_didik}</td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>{s.nisn || '-'} / {s.nik || '-'}</td>
                          <td style={{ padding: '1rem', color: '#334155' }}>{s.jenis_kelamin}</td>
                          <td style={{ padding: '1rem', color: '#334155' }}>{s.kelas}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button 
                              onClick={() => { setSelectedSekolah(null); setSelectedSiswa(s); }}
                              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                            >Detail</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Full Detail Siswa (60+ Columns) */}
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
                {/* Section 1: Akademik & Sekolah */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><School size={18} color="#0284c7"/> Data Akademik & Sekolah Asal</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Nama Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.nama_sekolah || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>NPSN</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.npsn || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Jenjang</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.jenjang || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Kelas</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.kelas || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Jurusan</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.nama_jurusan || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Rombel</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.nama_rombel || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Semester</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.semester || '-'}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Alamat Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.alamat_sekolah || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Provinsi Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_provinsi || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Kabupaten Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_kabupaten || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Kecamatan Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_kecamatan || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Kelurahan Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_desa_kelurahan || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Dusun Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_dusun || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Kode Pos Sekolah</div><div style={{ fontWeight: '600', color: '#334155' }}>{selectedSiswa.sekolah_kode_pos || '-'}</div></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Section 2: Profil Pribadi & Fisik */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><FileText size={18} color="#0284c7"/> Identitas & Fisik</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Jenis Kelamin</span> <strong style={{ color: '#334155' }}>{selectedSiswa.jenis_kelamin || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Tempat Lahir</span> <strong style={{ color: '#334155' }}>{selectedSiswa.tempat_lahir || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Tanggal Lahir</span> <strong style={{ color: '#334155' }}>{selectedSiswa.tanggal_lahir || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>No. Akta Lahir</span> <strong style={{ color: '#334155' }}>{selectedSiswa.no_akta_lahir || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Agama</span> <strong style={{ color: '#334155' }}>{selectedSiswa.agama || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kebutuhan Khusus</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kebutuhan_khusus || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Anak Ke-</span> <strong style={{ color: '#334155' }}>{selectedSiswa.anak_ke || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Jml Saudara Kandung</span> <strong style={{ color: '#334155' }}>{selectedSiswa.jumlah_saudara_kandung || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Tinggi Badan</span> <strong style={{ color: '#334155' }}>{selectedSiswa.tinggi_badan ? `${selectedSiswa.tinggi_badan} cm` : '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Berat Badan</span> <strong style={{ color: '#334155' }}>{selectedSiswa.berat_badan ? `${selectedSiswa.berat_badan} kg` : '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Lingkar Kepala</span> <strong style={{ color: '#334155' }}>{selectedSiswa.lingkar_kepala ? `${selectedSiswa.lingkar_kepala} cm` : '-'}</strong></div>
                    </div>
                  </div>

                  {/* Section 3: Kontak & Transportasi */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><MapPin size={18} color="#0284c7"/> Kontak & Domisili</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>No. HP / Telepon</span> <strong style={{ color: '#334155' }}>{selectedSiswa.nomor_telp || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Email</span> <strong style={{ color: '#334155', wordBreak: 'break-all', marginLeft: '1rem', textAlign: 'right' }}>{selectedSiswa.email || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Alamat Jalan</span> <strong style={{ color: '#334155', textAlign: 'right', marginLeft: '1rem' }}>{selectedSiswa.alamat_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Dusun</span> <strong style={{ color: '#334155' }}>{selectedSiswa.dusun_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kelurahan / Desa</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kelurahan_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kecamatan</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kecamatan_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kabupaten / Kota</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kabupaten_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Provinsi</span> <strong style={{ color: '#334155' }}>{selectedSiswa.provinsi_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Kode Pos</span> <strong style={{ color: '#334155' }}>{selectedSiswa.kode_pos_siswa || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Jenis Tinggal</span> <strong style={{ color: '#334155' }}>{selectedSiswa.jenis_tinggal || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Alat Transportasi</span> <strong style={{ color: '#334155' }}>{selectedSiswa.alat_transportasi || '-'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Data Keluarga (Ortu & Wali) */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><FamilyIcon size={18} color="#0284c7"/> Informasi Keluarga & Orang Tua</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <span style={{ color: '#64748b' }}>Nomor Kartu Keluarga (KK):</span>
                      <strong style={{ color: '#334155' }}>{selectedSiswa.no_kk || '-'}</strong>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    {/* Ayah */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Data Ayah</h4>
                      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama</span> <strong>{selectedSiswa.nama_ayah || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>NIK</span> <strong>{selectedSiswa.nik_ayah || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pendidikan</span> <strong>{selectedSiswa.pendidikan_ayah || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pekerjaan</span> <strong>{selectedSiswa.pekerjaan_ayah || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Penghasilan</span> <strong>{selectedSiswa.penghasilan_ayah || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Keb. Khusus</span> <strong>{selectedSiswa.kebutuhan_khusus_ayah || '-'}</strong></div>
                      </div>
                    </div>
                    {/* Ibu */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Data Ibu Kandung</h4>
                      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama</span> <strong>{selectedSiswa.nama_ibu_kandung || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>NIK</span> <strong>{selectedSiswa.nik_ibu || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pendidikan</span> <strong>{selectedSiswa.pendidikan_ibu || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pekerjaan</span> <strong>{selectedSiswa.pekerjaan_ibu || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Penghasilan</span> <strong>{selectedSiswa.penghasilan_ibu || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Keb. Khusus</span> <strong>{selectedSiswa.kebutuhan_khusus_ibu || '-'}</strong></div>
                      </div>
                    </div>
                    {/* Wali */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Data Wali</h4>
                      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama</span> <strong>{selectedSiswa.nama_wali || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pekerjaan</span> <strong>{selectedSiswa.pekerjaan_wali || '-'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Penghasilan</span> <strong>{selectedSiswa.penghasilan_wali || '-'}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Section 5: Kesejahteraan (PIP/KIP) */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><Briefcase size={18} color="#0284c7"/> Kesejahteraan Sosial (PIP & KIP)</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Status Layak PIP</span> 
                        {selectedSiswa.layak_pip ? <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Layak PIP</span> : <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Tidak Layak</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Alasan Layak PIP</span> <strong style={{ color: '#334155', textAlign: 'right', maxWidth: '150px' }}>{selectedSiswa.alasan_layak_pip || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Penerima KIP</span> 
                        {selectedSiswa.penerima_kip ? <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Ya (Penerima)</span> : <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Bukan Penerima</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>No. KIP</span> <strong style={{ color: '#334155' }}>{selectedSiswa.no_kip || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Nama Tertera di KIP</span> <strong style={{ color: '#334155' }}>{selectedSiswa.nama_kip || '-'}</strong></div>
                    </div>
                  </div>

                  {/* Section 6: Lokasi & Peta (Koordinat) */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}><MapPin size={18} color="#0284c7"/> Peta Koordinat Domisili</h3>
                    
                    <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'grid', gap: '0.5rem', color: '#334155', fontSize: '0.95rem' }}>
                        <div><strong>Lintang (Latitude):</strong> {selectedSiswa.lintang || '-'}</div>
                        <div><strong>Bujur (Longitude):</strong> {selectedSiswa.bujur || '-'}</div>
                      </div>

                      {selectedSiswa.lintang && selectedSiswa.bujur ? (
                        <div style={{ width: '100%', flex: 1, minHeight: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
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
                      ) : (
                        <div style={{ width: '100%', flex: 1, minHeight: '180px', padding: '2rem', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <MapPin size={32} color="#cbd5e1"/>
                          <span style={{ fontSize: '0.9rem' }}>Koordinat (Lintang/Bujur) kosong.<br/>Mini Map Google tidak dapat dirender.</span>
                        </div>
                      )}
                    </div>
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
