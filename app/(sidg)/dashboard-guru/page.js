'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, GraduationCap, MapPin, Search, 
  ChevronDown, BookOpen, Briefcase, Filter, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
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

  // Aggregate Data
  const totalGuru = filteredData.length;
  const totalLaki = filteredData.filter(d => d.jenis_kelamin?.toUpperCase() === 'L').length;
  const totalPerempuan = filteredData.filter(d => d.jenis_kelamin?.toUpperCase() === 'P').length;

  // Dynamic Status Kepegawaian Cards
  const statusKepegawaianCounts = useMemo(() => {
    const counts = {};
    filteredData.forEach(d => {
      let val = d.status_kepegawaian;
      if (!val || val.trim() === '') val = 'Tidak Diketahui';
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredData]);

  // Aggregate for Charts
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

  const dataBidangStudi = aggregateChart('bidang_studi_sertifikasi', 10);
  const dataPendidikan = aggregateChart('pendidikan', 6);

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
      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* LEFT SIDEBAR: FILTERS */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <Filter size={20} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Filter Data</h2>
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Dashboard Analitik Guru</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Visualisasi sebaran dan kualifikasi tenaga pendidik</p>
            </div>
          </div>

          {/* DYNAMIC SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Kartu Utama: Total Guru */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #4f46e5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Guru</p>
                  <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '1.8rem', fontWeight: 'bold' }}>{totalGuru.toLocaleString()}</h3>
                </div>
                <div style={{ backgroundColor: '#e0e7ff', padding: '0.6rem', borderRadius: '8px', color: '#4f46e5' }}><Users size={24} /></div>
              </div>
            </div>

            {/* Kartu Utama: Jenis Kelamin */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Laki-laki / Perempuan</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <div><span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.25rem' }}>{totalLaki.toLocaleString()}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>L</span></div>
                    <div><span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.25rem' }}>{totalPerempuan.toLocaleString()}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>P</span></div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#dcfce7', padding: '0.6rem', borderRadius: '8px', color: '#10b981' }}><UserCheck size={24} /></div>
              </div>
            </div>

            {/* Kartu Status Kepegawaian (Dinamis) */}
            {statusKepegawaianCounts.map(([statusName, count], idx) => {
              const colors = ['#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#ef4444'];
              const color = colors[idx % colors.length];
              const bgColor = `${color}20`; // 20% opacity approx

              return (
                <div key={statusName} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{statusName}</p>
                      <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>{count.toLocaleString()}</h3>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>
                        {totalGuru > 0 ? Math.round((count / totalGuru) * 100) : 0}% dari total
                      </span>
                    </div>
                    <div style={{ backgroundColor: bgColor, padding: '0.6rem', borderRadius: '8px', color: color }}><Briefcase size={24} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            
            {/* Bar Chart: Sertifikasi Bidang Studi */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Sertifikasi Bidang Studi</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataBidangStudi}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 11, fill: '#475569'}} />
                    <RechartsTooltip formatter={(value) => [value, 'Jumlah Guru']} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                      {dataBidangStudi.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Pendidikan */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Tingkat Pendidikan</h3>
              <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPendidikan}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                    >
                      {dataPendidikan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [value, 'Jumlah Guru']} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
