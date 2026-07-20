'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, UserCheck, School, CheckCircle, Info, Layers, CheckSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';

// Dynamically import the map to prevent SSR issues with leaflet
const SispMap = dynamic(() => import('../../../../components/SispMap'), { ssr: false, loading: () => <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: '12px' }}>Memuat Peta Lokasi...</div> });

export default function DetailSekolahPage() {
  const { npsn } = useParams();
  const router = useRouter();

  const [sekolah, setSekolah] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Aggregate Stats
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (npsn) {
      fetchDetail();
    }
  }, [npsn]);

  const fetchDetail = async () => {
    try {
      const response = await fetch('/api/data-sisp');
      if (!response.ok) throw new Error('Gagal memuat data SISP');
      const result = await response.json();
      
      const found = result.find(s => s.npsn === npsn);
      if (found) {
        setSekolah(found);
        fetchStats(found);
      } else {
        setSekolah(null);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchStats = async (sekolahData) => {
    try {
      // Fetch SIDS Count
      const { count: countSiswa, error: errSiswa } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true })
        .or(`npsn.eq.${sekolahData.npsn},nama_sekolah.ilike.%${sekolahData.nama_satuan_pendidikan}%`);
        
      if (errSiswa) console.error('Error count siswa:', errSiswa);

      // Fetch SIDG Count
      const { count: countGuru, error: errGuru } = await supabase
        .from('guru')
        .select('*', { count: 'exact', head: true })
        .or(`npsn.eq.${sekolahData.npsn},tempat_tugas.ilike.%${sekolahData.nama_satuan_pendidikan}%`);

      if (errGuru) console.error('Error count guru:', errGuru);

      setTotalSiswa(countSiswa || 0);
      setTotalGuru(countGuru || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Memuat Profil Satuan Pendidikan...</p>
        </div>
      </div>
    );
  }

  if (!sekolah) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a' }}>Data sekolah tidak ditemukan</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>NPSN: {npsn}</p>
        <button onClick={() => router.back()} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginBottom: '2rem', fontWeight: '500' }}
        >
          <ArrowLeft size={18} /> Kembali
        </button>

        {/* HEADER SECTION */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4f46e5', flexShrink: 0 }}>
            <School size={40} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 'bold' }}>{sekolah.nama_satuan_pendidikan}</h1>
              <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>NPSN: {sekolah.npsn}</span>
              <span style={{ backgroundColor: '#dcfce7', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.9rem', fontWeight: '600' }}>{sekolah.status_sekolah}</span>
            </div>
            <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} /> {sekolah.alamat}, Kel. {sekolah.kelurahan}, Kec. {sekolah.kecamatan}, {sekolah.kabupaten_kota} {sekolah.kode_pos}
            </p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Bentuk Pendidikan</span>
                <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '1.1rem' }}>{sekolah.bentuk_pendidikan}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Akreditasi</span>
                <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '1.1rem' }}>{sekolah.akreditasi || '-'} <span style={{fontSize:'0.85rem', color:'#94a3b8', fontWeight:'normal'}}>({sekolah.tmt_akreditasi || '-'})</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS FROM SIDS & SIDG */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Siswa Terdaftar</p>
                {loadingStats ? (
                  <div className="animate-pulse" style={{ height: '36px', width: '100px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '0.5rem' }}></div>
                ) : (
                  <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}>{totalSiswa.toLocaleString()} <span style={{fontSize:'1rem', color:'#64748b', fontWeight:'normal'}}>Siswa</span></h3>
                )}
              </div>
              <div style={{ backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '12px', color: '#10b981' }}><Users size={28} /></div>
            </div>
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>*Data diambil sinkron dari modul SIDS berdasarkan NPSN</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #4f46e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Guru Bertugas</p>
                {loadingStats ? (
                  <div className="animate-pulse" style={{ height: '36px', width: '100px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '0.5rem' }}></div>
                ) : (
                  <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}>{totalGuru.toLocaleString()} <span style={{fontSize:'1rem', color:'#64748b', fontWeight:'normal'}}>Guru</span></h3>
                )}
              </div>
              <div style={{ backgroundColor: '#e0e7ff', padding: '0.75rem', borderRadius: '12px', color: '#4f46e5' }}><UserCheck size={28} /></div>
            </div>
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>*Data diambil sinkron dari modul SIDG berdasarkan NPSN</p>
          </div>

        </div>

        {/* MAP & FACILITIES GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* MAP */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin color="#ef4444" /> Lokasi Sekolah
            </h3>
            <div style={{ height: '350px', borderRadius: '12px', overflow: 'hidden' }}>
              <SispMap data={[sekolah]} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
              <span>Lintang: {sekolah.lintang || '-'}</span>
              <span>Bujur: {sekolah.bujur || '-'}</span>
            </div>
          </div>

          {/* SARANA PRASARANA UTAMA */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare color="#f59e0b" /> Ringkasan Fasilitas
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <FacilityRow label="Total Rombel" value={sekolah.jumlah_rombel} />
              <FacilityRow label="Total Ruang Kelas" value={sekolah.jumlah_ruang_kelas} />
              <FacilityRow label="Total Ruang Guru" value={sekolah.jumlah_ruang_guru} />
              <div style={{ borderTop: '1px dashed #cbd5e1', margin: '0.5rem 0' }}></div>
              <FacilityRow label="Meja Siswa" value={sekolah.meja_siswa} />
              <FacilityRow label="Kursi Siswa" value={sekolah.kursi_siswa} />
              <FacilityRow label="Papan Tulis" value={sekolah.papan_tulis} />
              <FacilityRow label="Komputer" value={sekolah.komputer} />
            </div>
          </div>

        </div>

        {/* DETAILED TABLES - KONDISI RUANGAN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Kondisi Ruang Kelas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <CondRow label="Baik" val={sekolah.ruang_kelas_baik} color="#10b981" />
                <CondRow label="Rusak Ringan" val={sekolah.ruang_kelas_rusak_ringan} color="#f59e0b" />
                <CondRow label="Rusak Sedang" val={sekolah.ruang_kelas_rusak_sedang} color="#f97316" />
                <CondRow label="Rusak Berat" val={sekolah.ruang_kelas_rusak_berat} color="#ef4444" />
                <CondRow label="Rusak Total" val={sekolah.ruang_kelas_rusak_total} color="#b91c1c" />
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>Kondisi Fasilitas Sanitasi (WC)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <CondRow label="WC Siswa Laki-laki (Total)" val={sekolah.jumlah_wc_siswa_laki} color="#4f46e5" />
                <CondRow label="WC Siswa Perempuan (Total)" val={sekolah.jumlah_wc_siswa_perempuan} color="#ec4899" />
                <CondRow label="WC Guru Laki-laki (Total)" val={sekolah.jumlah_wc_guru_laki} color="#0ea5e9" />
                <CondRow label="WC Guru Perempuan (Total)" val={sekolah.jumlah_wc_guru_perempuan} color="#8b5cf6" />
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}

function FacilityRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#475569', fontWeight: '500' }}>{label}</span>
      <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', color: '#0f172a', fontWeight: 'bold' }}>{value || 0}</span>
    </div>
  );
}

function CondRow({ label, val, color }) {
  return (
    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
      <td style={{ padding: '0.75rem 0', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
          {label}
        </div>
      </td>
      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{val || 0}</td>
    </tr>
  );
}
