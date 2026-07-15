'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Info, BarChart3, TrendingUp, Download, X, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndikator, setSelectedIndikator] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [spmData, setSpmData] = useState([]);
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartYear, setExportStartYear] = useState('');
  const [exportEndYear, setExportEndYear] = useState('');
  const [exportSelectedIndicators, setExportSelectedIndicators] = useState([]);
  const [exportSelectedJenis, setExportSelectedJenis] = useState([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat data');
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
        // Set default berjenjang jika ada data
        if (jsonData.length > 0) {
          const uniqueJenis = [...new Set(jsonData.map(item => item.jenis_satuan_pendidikan))];
          const allowedJenis = ['SD Umum', 'SMP Umum', 'PAUD'];
          const filteredJenis = allowedJenis.filter(j => uniqueJenis.includes(j));
          
          if (filteredJenis.length > 0) {
            const firstJenis = filteredJenis[0];
            setSelectedJenis(firstJenis);
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetch('/api/spm', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat SPM');
        return res.json();
      })
      .then(data => setSpmData(data || []))
      .catch(err => console.error('Error load SPM:', err));
  }, []);

  const jenisList = useMemo(() => {
    const allowedJenis = ['SD Umum', 'SMP Umum', 'PAUD'];
    const uniqueJenis = [...new Set(data.map(item => item.jenis_satuan_pendidikan))];
    return allowedJenis.filter(jenis => uniqueJenis.includes(jenis));
  }, [data]);

  const indikatorList = useMemo(() => {
    if (!selectedJenis) return [];
    const list = [];
    const map = new Map();
    
    // Daftar indikator SD/SMP
    const allowedIndicatorsSD_SMP = [
      'kemampuan literasi',
      'kemampuan numerasi',
      'iklim keamanan sekolah',
      'iklim inklusivitas',
      'iklim kebinekaan',
      'karakter'
    ];
    
    // Daftar indikator PAUD
    const allowedIndicatorsPAUD = [
      'proporsi jumlah satuan paud terakreditasi minimal b',
      'indeks distribusi guru',
      'proses belajar yang sesuai bagi anak usia dini',
      'kemitraan dengan orang tua/wali',
      'penyediaan layanan holistik integratif'
    ];

    const allowedIndicators = selectedJenis === 'PAUD' ? allowedIndicatorsPAUD : allowedIndicatorsSD_SMP;
    
    for (const item of data) {
      if (item.jenis_satuan_pendidikan === selectedJenis) {
        
        const nameLower = item.nama_indikator.toLowerCase();
        // Cek apakah indikator ini ada di daftar (exact match)
        const isAllowed = allowedIndicators.some(allowed => nameLower === allowed);
        
        // Memastikan tidak mengambil varian skor
        if (isAllowed && !item.kode_indikator.toLowerCase().endsWith('.skor') && !map.has(item.kode_indikator)) {
          map.set(item.kode_indikator, true);
          list.push({ kode: item.kode_indikator, nama: item.nama_indikator, definisi: item.definisi_capaian });
        }
      }
    }
    return list.sort((a, b) => a.kode.localeCompare(b.kode));
  }, [data, selectedJenis]);

  useEffect(() => {
    if (selectedIndikator !== 'SPM' && indikatorList.length > 0 && !indikatorList.some(i => i.kode === selectedIndikator)) {
      setSelectedIndikator(indikatorList[0].kode);
    }
  }, [indikatorList, selectedIndikator]);

  const availableYears = useMemo(() => {
    const years = new Set();
    data.forEach(d => years.add(d.tahun));
    spmData.forEach(d => years.add(d.tahun));
    return Array.from(years).sort();
  }, [data, spmData]);

  const allAvailableIndicators = useMemo(() => {
    const inds = [{ kode: 'SPM', nama: 'Indeks Pencapaian SPM' }];
    const uniqueKodes = new Set();
    
    const allowed = [
      'kemampuan literasi', 'kemampuan numerasi', 'iklim keamanan sekolah', 
      'iklim inklusivitas', 'iklim kebinekaan', 'karakter',
      'proporsi jumlah satuan paud terakreditasi minimal b', 'indeks distribusi guru',
      'proses belajar yang sesuai bagi anak usia dini', 'kemitraan dengan orang tua/wali',
      'penyediaan layanan holistik integratif'
    ];

    data.forEach(d => {
      const nameLower = d.nama_indikator?.toLowerCase();
      if (nameLower && allowed.includes(nameLower) && !d.kode_indikator?.toLowerCase().endsWith('.skor')) {
        if (!uniqueKodes.has(d.kode_indikator)) {
          uniqueKodes.add(d.kode_indikator);
          inds.push({ kode: d.kode_indikator, nama: d.nama_indikator });
        }
      }
    });
    return inds;
  }, [data]);

  // Set default export years when available
  useEffect(() => {
    if (availableYears.length > 0 && !exportStartYear && !exportEndYear) {
      setExportStartYear(availableYears[0]);
      setExportEndYear(availableYears[availableYears.length - 1]);
      // Also pre-select all indicators by default
      setExportSelectedIndicators(allAvailableIndicators.map(i => i.kode));
      // Also pre-select all jenis by default
      setExportSelectedJenis([...jenisList]);
    }
  }, [availableYears, allAvailableIndicators, jenisList]);

  const handleSelectIndicator = (kode) => {
    if (exportSelectedIndicators.includes(kode)) {
      setExportSelectedIndicators(exportSelectedIndicators.filter(k => k !== kode));
    } else {
      setExportSelectedIndicators([...exportSelectedIndicators, kode]);
    }
  };

  const handleSelectJenis = (jenis) => {
    if (exportSelectedJenis.includes(jenis)) {
      setExportSelectedJenis(exportSelectedJenis.filter(j => j !== jenis));
    } else {
      setExportSelectedJenis([...exportSelectedJenis, jenis]);
    }
  };

  const handleExportData = () => {
    if (exportSelectedIndicators.length === 0) {
      alert('Pilih setidaknya satu indikator untuk di-export.');
      return;
    }

    const start = parseInt(exportStartYear);
    const end = parseInt(exportEndYear);
    const excelData = [];

    if (exportSelectedIndicators.includes('SPM')) {
      const spmFiltered = spmData.filter(d => parseInt(d.tahun) >= start && parseInt(d.tahun) <= end);
      spmFiltered.forEach(d => {
        excelData.push({
          "Tahun": d.tahun,
          "Jenis Satuan Pendidikan": "Semua",
          "Indikator": d.indeks_spm,
          "Nilai Capaian": d.nilai_capaian,
          "Label Capaian": d.label_capaian || ''
        });
      });
    }

    const regularSelected = exportSelectedIndicators.filter(k => k !== 'SPM');
    if (regularSelected.length > 0) {
      const regFiltered = data.filter(d => 
        parseInt(d.tahun) >= start && 
        parseInt(d.tahun) <= end && 
        regularSelected.includes(d.kode_indikator) &&
        exportSelectedJenis.includes(d.jenis_satuan_pendidikan)
      );
      regFiltered.forEach(d => {
        excelData.push({
          "Tahun": d.tahun,
          "Jenis Satuan Pendidikan": d.jenis_satuan_pendidikan,
          "Indikator": d.nama_indikator,
          "Nilai Capaian": d.nilai_capaian,
          "Label Capaian": d.label_capaian || ''
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Capaian");
    XLSX.writeFile(wb, `Export_Capaian_${start}-${end}.xlsx`);
    
    setShowExportModal(false);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;
    
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const title = selectedIndikator === 'SPM' ? 'Indeks Pencapaian SPM' : selectedIndikatorInfo?.nama || 'Laporan Capaian';
      pdf.setFontSize(14);
      pdf.text("Laporan Rapor Pendidikan - " + title, 10, 10);
      
      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Rapor_${selectedIndikator}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Gagal menghasilkan PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const selectedData = useMemo(() => {
    const filtered = data.filter((item) => 
      item.kode_indikator === selectedIndikator &&
      item.jenis_satuan_pendidikan === selectedJenis
    );
    
    const grouped = {};
    for (const item of filtered) {
      if (!grouped[item.tahun]) {
        grouped[item.tahun] = { tahun: item.tahun, labels: {}, nilai_teks: {} };
      }
      grouped[item.tahun][item.status_satuan_pendidikan] = item.nilai_angka;
      grouped[item.tahun].labels[item.status_satuan_pendidikan] = item.label_capaian;
      grouped[item.tahun].nilai_teks[item.status_satuan_pendidikan] = item.nilai_teks;
    }
    
    return Object.values(grouped).sort((a, b) => a.tahun - b.tahun);
  }, [data, selectedIndikator, selectedJenis]);

  const currentIndikatorInfo = indikatorList.find(i => i.kode === selectedIndikator);

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Memuat Data...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Membaca database lokal</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px' }}>
          Error: {error}
        </div>
      </main>
    );
  }

  if (data.length === 0) {
    return (
      <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Belum ada data tersedia</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Silakan masuk ke halaman Admin dan upload file Excel Rapor Pendidikan.
        </p>
        <a href="/admin" className="btn btn-primary">Ke Halaman Upload</a>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="title" style={{ margin: 0 }}>Analisis Detail Capaian</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--primary-color)', cursor: isExportingPDF ? 'wait' : 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(37,99,235,0.1)' }}
          >
            <Printer size={18} />
            {isExportingPDF ? 'Memproses...' : 'Download PDF Laporan'}
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
          >
            <Download size={18} />
            Export Data Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        {/* Panel Kiri: Pemilihan Indikator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '500' }}>Highlight Rapor</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSelectedIndikator('SPM')}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndikator === 'SPM' ? 'var(--primary-color)' : '#f8fafc',
                    color: selectedIndikator === 'SPM' ? 'white' : 'var(--text-main)',
                    fontWeight: selectedIndikator === 'SPM' ? '600' : '500',
                    transition: 'all 0.2s',
                    boxShadow: selectedIndikator === 'SPM' ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                    border: selectedIndikator !== 'SPM' ? '1px solid var(--border-color)' : '1px solid transparent'
                  }}
                >
                  Indeks Pencapaian SPM
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0 1.5rem 0' }} />

            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} color="var(--primary-color)" />
              Pilih Indikator
            </h3>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jenis Satuan Pendidikan</label>
              <select 
                className="form-select" 
                value={selectedJenis} 
                onChange={(e) => setSelectedJenis(e.target.value)}
              >
                {jenisList.map((jenis) => <option key={jenis} value={jenis}>{jenis}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '500' }}>Menu Indikator</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {indikatorList.length > 0 ? indikatorList.map((ind) => (
                  <button 
                    key={ind.kode}
                    onClick={() => setSelectedIndikator(ind.kode)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedIndikator === ind.kode ? 'var(--primary-color)' : '#f8fafc',
                      color: selectedIndikator === ind.kode ? 'white' : 'var(--text-main)',
                      fontWeight: selectedIndikator === ind.kode ? '600' : '500',
                      transition: 'all 0.2s',
                      boxShadow: selectedIndikator === ind.kode ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                      border: selectedIndikator !== ind.kode ? '1px solid var(--border-color)' : '1px solid transparent'
                    }}
                  >
                    {ind.nama}
                  </button>
                )) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    Tidak ada data indikator
                  </div>
                )}
              </div>
            </div>
            
            {currentIndikatorInfo && selectedIndikator !== 'SPM' && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Definisi:</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                  {currentIndikatorInfo.definisi || 'Tidak ada definisi tersedia untuk indikator ini.'}
                </p>
              </div>
            )}
          </div>


        </div>

        {/* Panel Kanan: Grafik atau SPM */}
        <div id="pdf-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', backgroundColor: 'white' }}>
          {selectedIndikator === 'SPM' ? (
            <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, marginBottom: '2rem', color: 'var(--primary-color)', fontSize: '1.4rem' }}>
                <TrendingUp size={28} color="var(--primary-color)" />
                Highlight Rapor Pendidikan: Indeks Pencapaian SPM
              </h3>
              {spmData.length > 0 ? (
                <>
                  {/* KPI Highlight Card */}
                  {(() => {
                    const sortedSpm = [...spmData].sort((a, b) => a.tahun - b.tahun);
                    const latest = sortedSpm[sortedSpm.length - 1];
                    const previous = sortedSpm.length > 1 ? sortedSpm[sortedSpm.length - 2] : null;
                    const diff = previous ? (latest.nilai_capaian - previous.nilai_capaian).toFixed(2) : null;
                    const isUp = diff > 0;
                    const isDown = diff < 0;

                    return (
                      <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ 
                          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
                          borderRadius: '16px', 
                          padding: '2.5rem 2rem', 
                          color: 'white',
                          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Decorative circles */}
                          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                          <div style={{ position: 'absolute', bottom: '-50px', right: '50px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                          
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Capaian Tahun {latest.tahun}</div>
                              <div style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1', marginBottom: '0.5rem' }}>{latest.nilai_capaian}</div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <span style={{ 
                                  padding: '0.5rem 1.25rem', 
                                  borderRadius: '30px', 
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  backdropFilter: 'blur(8px)',
                                  fontWeight: '600',
                                  fontSize: '1rem',
                                  border: '1px solid rgba(255,255,255,0.3)'
                                }}>
                                  {latest.label_capaian || 'Tidak ada label'}
                                </span>
                              </div>
                            </div>

                            {diff && (
                              <div style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', 
                                backgroundColor: 'rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '12px',
                                backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Dibanding Tahun {previous.tahun}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: '700', color: isUp ? '#86efac' : isDown ? '#fca5a5' : 'white' }}>
                                  {isUp ? '↑ Naik' : isDown ? '↓ Turun' : '≈ Sama'} {Math.abs(diff)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    <BarChart3 size={18} color="var(--primary-color)" />
                    Grafik Perkembangan Indeks SPM
                  </h3>
                  <div style={{ height: '320px', marginBottom: '3rem', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spmData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                        <RechartsTooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}>
                                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>Tahun {label}</h4>
                                  <div style={{ marginBottom: '0.25rem', color: 'var(--text-main)' }}><strong>Nilai Capaian:</strong> {data.nilai_capaian}</div>
                                  {data.label_capaian && data.label_capaian.trim() !== '' && (
                                    <div>
                                      <strong>Label:</strong> <span style={{
                                        padding: '0.15rem 0.4rem', 
                                        borderRadius: '4px', 
                                        backgroundColor: data.label_capaian.toLowerCase().includes('tuntas') || data.label_capaian.toLowerCase().includes('baik') ? '#dcfce7' : 
                                                         data.label_capaian.toLowerCase().includes('belum') || data.label_capaian.toLowerCase().includes('kurang') ? '#fee2e2' : '#f1f5f9',
                                        color: data.label_capaian.toLowerCase().includes('tuntas') || data.label_capaian.toLowerCase().includes('baik') ? '#166534' : 
                                               data.label_capaian.toLowerCase().includes('belum') || data.label_capaian.toLowerCase().includes('kurang') ? '#991b1b' : '#334155',
                                      }}>{data.label_capaian}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="nilai_capaian" 
                          fill="#3b82f6" 
                          radius={[6, 6, 0, 0]} 
                          barSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      <TrendingUp size={18} color="var(--primary-color)" />
                      Rincian Histori Capaian
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Tahun</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Indeks SPM</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Nilai Capaian</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Label Capaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spmData.map((row) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>{row.tahun}</td>
                          <td style={{ padding: '1rem 0.5rem', color: 'var(--primary-color)', fontWeight: '500' }}>{row.indeks_spm}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>{row.nilai_capaian}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{ 
                              padding: '0.3rem 0.75rem', 
                              borderRadius: '6px', 
                              backgroundColor: row.label_capaian?.toLowerCase().includes('tuntas') || row.label_capaian?.toLowerCase().includes('baik') ? '#dcfce7' : 
                                               row.label_capaian?.toLowerCase().includes('belum') || row.label_capaian?.toLowerCase().includes('kurang') ? '#fee2e2' : '#f1f5f9',
                              color: row.label_capaian?.toLowerCase().includes('tuntas') || row.label_capaian?.toLowerCase().includes('baik') ? '#166534' : 
                                     row.label_capaian?.toLowerCase().includes('belum') || row.label_capaian?.toLowerCase().includes('kurang') ? '#991b1b' : '#334155',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {row.label_capaian || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Belum ada data SPM. Silakan input dari menu Admin.
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BarChart3 size={20} color="var(--primary-color)" />
              Grafik Progress Capaian
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setChartType('bar')}
                style={{
                  border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', fontSize: '0.85rem',
                  backgroundColor: chartType === 'bar' ? 'white' : 'transparent',
                  boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: chartType === 'bar' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
              >Bar</button>
              <button 
                onClick={() => setChartType('line')}
                style={{
                  border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', fontSize: '0.85rem',
                  backgroundColor: chartType === 'line' ? 'white' : 'transparent',
                  boxShadow: chartType === 'line' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: chartType === 'line' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
              >Line</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {['Semua', 'Negeri', 'Swasta'].map((status) => {
              // Cek apakah ada data untuk status ini di selectedData
              const hasData = selectedData.some(row => row[status] !== undefined);
              if (!hasData) return null;

              const statusColors = {
                'Semua': 'var(--primary-color)',
                'Negeri': '#10b981',
                'Swasta': '#f59e0b'
              };

              return (
                <div key={status} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: statusColors[status], fontSize: '1rem' }}>{status}</h4>
                  <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={selectedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                            formatter={(value, name, props) => {
                              const lbl = props.payload.labels ? props.payload.labels[status] : '';
                              return [value, `${status} ${lbl ? `(${lbl})` : ''}`];
                            }}
                          />
                          <Bar dataKey={status} fill={statusColors[status]} radius={[4, 4, 0, 0]} name={status} barSize={25} />
                        </BarChart>
                      ) : (
                        <LineChart data={selectedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                            formatter={(value, name, props) => {
                              const lbl = props.payload.labels ? props.payload.labels[status] : '';
                              return [value, `${status} ${lbl ? `(${lbl})` : ''}`];
                            }}
                          />
                          <Line type="monotone" dataKey={status} stroke={statusColors[status]} strokeWidth={3} activeDot={{ r: 6 }} name={status} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedData.length === 0 && (
            <div className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Data tidak tersedia atau tidak memiliki nilai numerik untuk dibuatkan grafik.
            </div>
          )}
          
          {/* Rincian Per Tahun di dalam Panel Kanan */}
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              <TrendingUp size={20} color="var(--primary-color)" />
              Rincian Per Tahun
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {selectedData.length > 0 ? selectedData.map((row) => (
                <div key={row.tahun} className="card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    Tahun {row.tahun}
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.5rem' }}>Status</th>
                          <th style={{ padding: '0.5rem' }}>Nilai</th>
                          <th style={{ padding: '0.5rem' }}>Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Semua', 'Negeri', 'Swasta'].map(status => {
                          if (row[status] === undefined) return null;
                          const label = row.labels[status];
                          return (
                            <tr key={status} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{status}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{row.nilai_teks[status]}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '4px', 
                                  backgroundColor: label?.toLowerCase().includes('baik') || label?.toLowerCase().includes('atas') ? '#dcfce7' : 
                                                   label?.toLowerCase().includes('kurang') || label?.toLowerCase().includes('bawah') ? '#fee2e2' : '#f1f5f9',
                                  color: label?.toLowerCase().includes('baik') || label?.toLowerCase().includes('atas') ? '#166534' : 
                                         label?.toLowerCase().includes('kurang') || label?.toLowerCase().includes('bawah') ? '#991b1b' : '#334155',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}>
                                  {label || '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )) : (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  Belum ada data untuk indikator ini
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={22} /> Export Data Capaian
              </h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Tahun Awal</label>
                <select className="form-select" value={exportStartYear} onChange={e => setExportStartYear(e.target.value)}>
                  {availableYears.map(y => <option key={`start-${y}`} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tahun Akhir</label>
                <select className="form-select" value={exportEndYear} onChange={e => setExportEndYear(e.target.value)}>
                  {availableYears.map(y => <option key={`end-${y}`} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Pilih Jenis Satuan Pendidikan</label>
                <button 
                  onClick={() => {
                    if (exportSelectedJenis.length === jenisList.length) {
                      setExportSelectedJenis([]);
                    } else {
                      setExportSelectedJenis([...jenisList]);
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  {exportSelectedJenis.length === jenisList.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', maxHeight: '150px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                {jenisList.map(jenis => (
                  <label key={jenis} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', borderRadius: '4px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'white'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <input 
                      type="checkbox" 
                      checked={exportSelectedJenis.includes(jenis)} 
                      onChange={() => handleSelectJenis(jenis)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{jenis}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Pilih Indikator</label>
                <button 
                  onClick={() => {
                    if (exportSelectedIndicators.length === allAvailableIndicators.length) {
                      setExportSelectedIndicators([]);
                    } else {
                      setExportSelectedIndicators(allAvailableIndicators.map(i => i.kode));
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  {exportSelectedIndicators.length === allAvailableIndicators.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                {allAvailableIndicators.map(ind => (
                  <label key={ind.kode} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', borderRadius: '4px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'white'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <input 
                      type="checkbox" 
                      checked={exportSelectedIndicators.includes(ind.kode)} 
                      onChange={() => handleSelectIndicator(ind.kode)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{ind.nama}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleExportData}
              style={{ width: '100%', backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Download size={20} />
              Download Format Excel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
