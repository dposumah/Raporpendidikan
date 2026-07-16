'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSiswaData } from '../../../context/SiswaDataContext';
import { Search, Filter, Eye, EyeOff, Users, CheckCircle, School, AlertCircle, MapPin, X, ChevronDown, ChevronRight, User, Users as FamilyIcon, FileText, Briefcase, Download } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DataPendidikanPage() {
  const { allData, periodeOptions, selectedPeriode, setSelectedPeriode, loading } = useSiswaData();
  
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

  // Data is now fetched globally from Context

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

  const kelasOptions = useMemo(() => {
    return Array.from(new Set(allData
      .filter(s => !jenjang || s.jenjang === jenjang)
      .filter(s => !sekolah || s.nama_sekolah === sekolah)
      .map(s => String(s.kelas))
      .filter(k => k && k !== 'undefined' && k !== 'null')
    )).sort();
  }, [allData, jenjang, sekolah]);

  // 3. DERIVED STATS FROM FILTERED DATA
  const stats = useMemo(() => {
    const total = filteredData.length;
    let l = 0;
    let p = 0;
    let tomohon = 0;
    let luarTomohon = 0;
    const agamaCount = { Islam: 0, Kristen: 0, Katolik: 0, Hindu: 0, Buddha: 0, Konghucu: 0, Lainnya: 0 };
    const umurCount = { 
      '<4': 0, '5': 0, '6': 0, 
      '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0,
      '13': 0, '14': 0, '15': 0,
      '16': 0, '17': 0, '18': 0, '>19': 0 
    };
    
    const parseDate = (d) => {
      if (!d) return null;
      if (!isNaN(d) && Number(d) > 20000) return new Date((d - 25569) * 86400 * 1000);
      const parts = String(d).split(/[-\/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1]-1, parts[2]);
        return new Date(parts[2], parts[1]-1, parts[0]);
      }
      return new Date(d);
    };

    const today = new Date(2026, 6, 1); // 1 Juli 2026
    
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

      // Agama
      const agm = (s.agama || '').trim();
      if (agm.match(/islam/i)) agamaCount.Islam++;
      else if (agm.match(/kristen/i)) agamaCount.Kristen++;
      else if (agm.match(/kat[h]?olik/i)) agamaCount.Katolik++;
      else if (agm.match(/hindu/i)) agamaCount.Hindu++;
      else if (agm.match(/bud[d]?ha/i)) agamaCount.Buddha++;
      else if (agm.match(/k[h]?onghucu/i)) agamaCount.Konghucu++;
      else if (agm) agamaCount.Lainnya++;

      // Umur
      const birthDate = parseDate(s.tanggal_lahir);
      if (birthDate && !isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 4) umurCount['<4']++;
        else if (age >= 19) umurCount['>19']++;
        else if (umurCount[age.toString()] !== undefined) umurCount[age.toString()]++;
      }
    });
    
    const uniqueSekolah = new Set(filteredData.map(s => s.nama_sekolah).filter(Boolean)).size;
    return {
      totalSiswa: total,
      totalLaki: l,
      totalPerempuan: p,
      totalSekolah: uniqueSekolah,
      domisiliTomohon: tomohon,
      domisiliLuar: luarTomohon,
      agamaCount,
      umurCount
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

    const today = new Date(2026, 6, 1); // 1 Juli 2026

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
    const today = new Date(2026, 6, 1); // 1 Juli 2026
    
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

  const exportToPDF = (headers, dataMatrix, title, filename, orientation = 'portrait') => {
    const doc = new jsPDF({ orientation });
    doc.text(title, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: dataMatrix,
      startY: 25,
      styles: { fontSize: orientation === 'landscape' ? 7 : 9, cellPadding: orientation === 'landscape' ? 1.5 : 3 }
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* SIDEBAR FILTER */}
        <div style={{ width: '300px', flexShrink: 0, background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'sticky', top: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', color: '#64748b' }}><Filter size={20} /></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Menu Filter</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Jenjang</label>
              <select value={jenjang} onChange={e => setJenjang(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none', fontSize: '0.9rem' }}>
                <option value="">Semua Jenjang</option>
                {jenjangOptions.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <SearchableSelect label="Kecamatan" options={kecamatanOptions} value={kecamatanFilter} onChange={setKecamatanFilter} placeholder="Semua Kecamatan" />
            </div>
            <div>
              <SearchableSelect label="Kelurahan" options={kelurahanOptions} value={kelurahanFilter} onChange={setKelurahanFilter} placeholder="Semua Kelurahan" />
            </div>
            <div>
              <SearchableSelect label="Sekolah" options={sekolahOptions} value={sekolah} onChange={setSekolah} placeholder="Semua Sekolah" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Kelas</label>
              <select value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none', fontSize: '0.9rem' }}>
                <option value="">Semua Kelas</option>
                {kelasOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Status PIP</label>
              <select value={statusPIP} onChange={e => setStatusPIP(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', outline: 'none', fontSize: '0.9rem' }}>
                <option value="">Semua Status</option>
                <option value="layak">Layak PIP</option>
                <option value="tidak_layak">Tidak Layak</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header Dashboard */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Analisis & Rekapitulasi</h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem', marginBottom: 0 }}>Sistem Informasi Data Siswa (SIDS) - Tomohon</p>
            </div>
          </div>

          {/* TABEL REKAPITULASI (EXISTING) */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '600' }}>Tabel Analisis & Rekapitulasi</h3>
            
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
                    padding: '0.6rem 1.25rem',
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

            {/* We will inject the existing sub-tab content here by using the old lines */}
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
                        const allAgama = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.agama)))).sort();
                        const allUmur = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.umur)))).sort((a,b) => parseInt(a) - parseInt(b));
                        const allKelas = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.kelas)))).sort();

                        const flatData = rekapSekolahData.map(([sekolah, d]) => {
                          const row = {
                            'Nama Sekolah': sekolah,
                            'Total Siswa': d.total,
                            'Laki-Laki': d.l,
                            'Perempuan': d.p,
                            'Tomohon': d.tomohon,
                            'Luar': d.luar,
                          };
                          allAgama.forEach(a => row[`Agama: ${a}`] = d.agama[a] || 0);
                          allUmur.forEach(u => row[`Umur: ${u}`] = d.umur[u] || 0);
                          allKelas.forEach(k => row[`Kelas: ${k}`] = d.kelas[k] || 0);
                          return row;
                        });
                        exportToExcel(flatData, 'Rekap_Per_Sekolah');
                      }}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Export Excel
                    </button>
                    <button 
                      onClick={() => {
                        const allAgama = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.agama)))).sort();
                        const allUmur = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.umur)))).sort((a,b) => parseInt(a) - parseInt(b));
                        const allKelas = Array.from(new Set(rekapSekolahData.flatMap(([_, d]) => Object.keys(d.kelas)))).sort();

                        const headers = ['Sekolah', 'Total', 'L', 'P', 'T', 'L', ...allAgama, ...allUmur, ...allKelas.map(k => `Kls ${k}`)];
                        
                        const flatMatrix = rekapSekolahData.map(([sekolah, d]) => [
                          sekolah,
                          d.total,
                          d.l,
                          d.p,
                          d.tomohon,
                          d.luar,
                          ...allAgama.map(a => d.agama[a] || 0),
                          ...allUmur.map(u => d.umur[u] || 0),
                          ...allKelas.map(k => d.kelas[k] || 0)
                        ]);
                        exportToPDF(headers, flatMatrix, 'Rekapitulasi Per Sekolah', 'Rekap_Sekolah', 'landscape');
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
        </div>
      </div>
    </div>
  );
}
