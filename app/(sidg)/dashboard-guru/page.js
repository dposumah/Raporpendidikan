'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, GraduationCap, MapPin, Search, 
  ChevronDown, BookOpen, Briefcase, Filter, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, DefaultTooltipContent
} from 'recharts';

export default function DashboardGuruPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [jenjang, setJenjang] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [sekolah, setSekolah] = useState('');

  const [availableFilters, setAvailableFilters] = useState({
    jenjang: [],
    kecamatan: [],
    sekolah: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data-guru');
      if (!response.ok) throw new Error('Gagal memuat data');
      const result = await response.json();
      
      setData(result || []);

      // Extract unique values for filters
      const uniqueJenjang = [...new Set(result.map(d => d.jenjang).filter(Boolean))].sort();
      const uniqueKec = [...new Set(result.map(d => d.kecamatan).filter(Boolean))].sort();
      
      setAvailableFilters(prev => ({ ...prev, jenjang: uniqueJenjang, kecamatan: uniqueKec }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update available sekolah based on jenjang and kecamatan
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

  // Aggregate Data for Cards
  const totalGuru = filteredData.length;
  const totalLaki = filteredData.filter(d => d.jenis_kelamin?.toUpperCase() === 'L').length;
  const totalPerempuan = filteredData.filter(d => d.jenis_kelamin?.toUpperCase() === 'P').length;

  const countDominant = (key) => {
    if (totalGuru === 0) return { name: '-', count: 0, percent: 0 };
    const counts = {};
    filteredData.forEach(d => {
      const val = d[key] || 'Tidak Diketahui';
      counts[val] = (counts[val] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const dominant = sorted[0];
    return { name: dominant[0], count: dominant[1], percent: Math.round((dominant[1] / totalGuru) * 100) };
  };

  const statusPegawaiDominan = countDominant('status_kepegawaian');
  const pendidikanDominan = countDominant('pendidikan');

  // Aggregate Data for Charts
  const aggregateChart = (key, limit = 10) => {
    const counts = {};
    filteredData.forEach(d => {
      let val = d[key];
      if (!val || val.trim() === '') val = 'Tidak Diketahui';
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  };

  const dataJenisPTK = aggregateChart('jenis_ptk');
  const dataBidangStudi = aggregateChart('bidang_studi_sertifikasi', 8);
  const dataStatusPegawai = aggregateChart('status_kepegawaian', 5);

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Data Guru...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Dashboard Data Guru</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Sistem Informasi Data Guru (SIDG)</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Download size={16} /> Unduh Rekap
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#334155' }}>
            <Filter size={18} />
            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Filter Data</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Jenjang</label>
              <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' }}>
                <option value="">Semua Jenjang</option>
                {availableFilters.jenjang.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Kecamatan</label>
              <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' }}>
                <option value="">Semua Kecamatan</option>
                {availableFilters.kecamatan.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Sekolah (Tempat Tugas)</label>
              <select value={sekolah} onChange={(e) => setSekolah(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' }}>
                <option value="">Semua Sekolah</option>
                {availableFilters.sekolah.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #4f46e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Guru</p>
                <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '1.75rem', fontWeight: 'bold' }}>{totalGuru.toLocaleString()}</h3>
              </div>
              <div style={{ backgroundColor: '#e0e7ff', padding: '0.6rem', borderRadius: '8px', color: '#4f46e5' }}><Users size={24} /></div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Jenis Kelamin</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <div><span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalLaki.toLocaleString()}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>L</span></div>
                  <div><span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalPerempuan.toLocaleString()}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>P</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: '#dcfce7', padding: '0.6rem', borderRadius: '8px', color: '#10b981' }}><UserCheck size={24} /></div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Kepegawaian Terbanyak</p>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>{statusPegawaiDominan.name}</h3>
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {statusPegawaiDominan.percent}% dari total
                </span>
              </div>
              <div style={{ backgroundColor: '#fef3c7', padding: '0.6rem', borderRadius: '8px', color: '#f59e0b' }}><Briefcase size={24} /></div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Pendidikan Terbanyak</p>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>{pendidikanDominan.name}</h3>
                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {pendidikanDominan.percent}% dari total
                </span>
              </div>
              <div style={{ backgroundColor: '#e0f2fe', padding: '0.6rem', borderRadius: '8px', color: '#0ea5e9' }}><GraduationCap size={24} /></div>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Sertifikasi Bidang Studi</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataBidangStudi}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                  >
                    {dataBidangStudi.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value, 'Jumlah Guru']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Jenis PTK</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataJenisPTK}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#475569'}} />
                  <RechartsTooltip formatter={(value) => [value, 'Jumlah Guru']} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                    {dataJenisPTK.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Status Kepegawaian</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataStatusPegawai}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#475569'}} angle={-45} textAnchor="end" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [value, 'Jumlah Guru']} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
