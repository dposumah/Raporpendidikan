'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { BarChart2, Database, ChevronRight, School, Users, UserCheck, LogOut } from 'lucide-react';

export default function PortalPage() {
  const [showData, setShowData] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdfbf7 0%, #f3f0e7 100%)', // Putih gading
      color: '#1e293b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient light effects - Merah elegan */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(153,27,27,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(185,28,28,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

      {/* Logout button */}
      <button 
        onClick={handleLogout} 
        style={{ position: 'absolute', top: '1.5rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#991b1b', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
      >
        <LogOut size={16} /> Keluar
      </button>

      {/* Header / Logo section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4rem', zIndex: 1, animation: 'fadeInDown 0.8s ease-out' }}>
        <img src="/logo.png" alt="Logo Tomohon" style={{ height: '100px', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '2px', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
          Pemerintah Kota Tomohon
        </h2>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, textAlign: 'center', lineHeight: '1.2', color: '#1e293b' }}>
          Portal Pendidikan Daerah
        </h1>
        <p style={{ marginTop: '1rem', color: '#475569', fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center', lineHeight: '1.6' }}>
          Pusat integrasi informasi dan capaian pendidikan untuk memajukan kualitas belajar mengajar di Kota Tomohon.
        </p>
      </div>

      {/* MAIN MODULES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%', maxWidth: '800px', zIndex: 1, animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}>
        
        {/* Modul 1: Rapor Pendidikan */}
        <Link href="/rapor" style={{ textDecoration: 'none' }}>
          <div className="portal-card" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            height: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.borderColor = '#991b1b';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(153,27,27,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
          }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.5rem', color: '#b91c1c' }}>
              <BarChart2 size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>Rapor Pendidikan</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Lihat dan analisis indeks pencapaian SPM dan kinerja pendidikan lainnya secara menyeluruh.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
              Akses Modul <ChevronRight size={18} />
            </div>
          </div>
        </Link>

        {/* Modul 2: Data Pendidikan */}
        <div 
          onClick={() => setShowData(!showData)}
          style={{
            background: showData ? '#fef2f2' : 'white',
            border: '1px solid',
            borderColor: showData ? '#fca5a5' : '#e2e8f0',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            height: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(153,27,27,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
          }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.5rem', color: '#334155' }}>
            <Database size={40} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>Data Pendidikan</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            Pusat data referensi pendidikan: Data Sekolah (SISP), Data Guru (SIDG), dan Data Siswa (SIDS).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
            {showData ? 'Tutup Pilihan' : 'Lihat Aplikasi'} <ChevronRight size={18} style={{ transform: showData ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
          </div>
        </div>

      </div>

      {/* SUB APPS (DATA PENDIDIKAN) */}
      {showData && (
        <div style={{ width: '100%', maxWidth: '1000px', marginTop: '3rem', animation: 'fadeInUp 0.4s ease-out' }}>
          <h3 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '700' }}>
            Aplikasi Data Pendidikan
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* SISP */}
            <Link href="/dashboard-sisp" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#991b1b'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px' }}><School size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Data Sekolah (SISP)</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Profil & fasilitas sekolah</p>
                </div>
              </div>
            </Link>

            {/* SIDG */}
            <Link href="/dashboard-guru" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#991b1b'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px' }}><UserCheck size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Data Guru (SIDG)</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Statistik & kualifikasi guru</p>
                </div>
              </div>
            </Link>

            {/* SIDS */}
            <Link href="/dashboard-analitik" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#991b1b'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px' }}><Users size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Data Siswa (SIDS)</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Demografi peserta didik</p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
