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
      color: '#7f1d1d',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 2rem', // Reduced padding
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Wave Full Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 0, opacity: 0.15 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'absolute', display: 'block', width: 'calc(100% + 2px)', height: '100%', top: 0, left: 0 }}>
          <path className="wave-animation" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".3" fill="#fca5a5" />
          <path className="wave-animation-reverse" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-23.89V0Z" opacity=".5" fill="#f87171" />
          <path className="wave-animation" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" opacity=".7" fill="#ef4444" />
        </svg>
      </div>
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
        <img src="/logo.png" alt="Logo Tomohon" style={{ height: '100px', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(153,27,27,0.2))' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '2px', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.25rem', textAlign: 'center' }}>
          Pemerintah Kota Tomohon
        </h2>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '1px', color: '#b91c1c', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
          Dinas Pendidikan dan Kebudayaan Daerah
        </h2>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0 0 0', textAlign: 'center', lineHeight: '1.2', background: 'linear-gradient(90deg, #991b1b, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(153,27,27,0.1))' }}>
          Portal Pendidikan Daerah
        </h1>
        <p style={{ marginTop: '1.25rem', color: '#475569', fontSize: '1.15rem', maxWidth: '650px', textAlign: 'center', lineHeight: '1.7', fontWeight: '500' }}>
          Pusat integrasi informasi dan capaian pendidikan untuk memajukan kualitas belajar mengajar di Kota Tomohon.
        </p>
      </div>

      {/* MAIN MODULES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', width: '100%', maxWidth: '700px', zIndex: 1, animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}>
        
        {/* Modul 1: Rapor Pendidikan */}
        <Link href="/rapor" style={{ textDecoration: 'none' }}>
          <div className="portal-card" style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(254, 202, 202, 0.5)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            height: '100%',
            boxShadow: '0 8px 30px rgba(153, 27, 27, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(153, 27, 27, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(254, 202, 202, 0.5)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(153, 27, 27, 0.08)';
          }}>
            <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', color: '#b91c1c', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 10px rgba(185,28,28,0.1)' }}>
              <BarChart2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7f1d1d', marginBottom: '0.75rem' }}>Rapor Pendidikan</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Lihat dan analisis indeks pencapaian SPM dan kinerja pendidikan lainnya secara menyeluruh.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: '700', fontSize: '0.95rem', marginTop: 'auto', background: '#fef2f2', padding: '0.5rem 1rem', borderRadius: '999px', transition: 'all 0.3s ease' }}>
              Akses Modul <ChevronRight size={16} />
            </div>
          </div>
        </Link>

        {/* Modul 2: Data Pendidikan */}
        <div 
          onClick={() => setShowData(!showData)}
          style={{
            background: showData ? 'rgba(254, 242, 242, 0.9)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: showData ? '#fca5a5' : 'rgba(254, 202, 202, 0.5)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            height: '100%',
            boxShadow: showData ? '0 12px 40px rgba(153, 27, 27, 0.12)' : '0 8px 30px rgba(153, 27, 27, 0.08)',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            if(!showData) {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(153, 27, 27, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if(!showData) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(254, 202, 202, 0.5)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(153, 27, 27, 0.08)';
            }
          }}>
          <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', color: '#b91c1c', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 10px rgba(185,28,28,0.1)' }}>
            <Database size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7f1d1d', marginBottom: '0.75rem' }}>Data Pendidikan</h3>
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Pusat data referensi pendidikan: Data Sekolah (SISP), Data Guru (SIDG), dan Data Siswa (SIDS).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: showData ? '#b91c1c' : '#991b1b', fontWeight: '700', fontSize: '0.95rem', marginTop: 'auto', background: showData ? '#fee2e2' : '#fef2f2', padding: '0.5rem 1rem', borderRadius: '999px', transition: 'all 0.3s ease' }}>
            {showData ? 'Tutup Pilihan' : 'Lihat Aplikasi'} <ChevronRight size={16} style={{ transform: showData ? 'rotate(90deg)' : 'none', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>

      </div>

      {/* SUB APPS (DATA PENDIDIKAN) */}
      {showData && (
        <div style={{ width: '100%', maxWidth: '1000px', marginTop: '3rem', animation: 'fadeInUp 0.4s ease-out' }}>
          <h3 style={{ textAlign: 'center', color: '#7f1d1d', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '800' }}>
            Aplikasi Data Pendidikan
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* SISP */}
            <Link href="/dashboard-sisp" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(254,202,202,0.4)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(153,27,27,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(153,27,27,0.1)'; e.currentTarget.style.background = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(254,202,202,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(153,27,27,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
              >
                <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#b91c1c', padding: '1.25rem', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}><School size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#7f1d1d', fontSize: '1.15rem', fontWeight: '800' }}>Data Sekolah (SISP)</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>Profil & fasilitas sekolah</p>
                </div>
              </div>
            </Link>

            {/* SIDG */}
            <Link href="/dashboard-guru" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(254,202,202,0.4)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(153,27,27,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(153,27,27,0.1)'; e.currentTarget.style.background = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(254,202,202,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(153,27,27,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
              >
                <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#b91c1c', padding: '1.25rem', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}><UserCheck size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#7f1d1d', fontSize: '1.15rem', fontWeight: '800' }}>Data Guru (SIDG)</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>Statistik & kualifikasi guru</p>
                </div>
              </div>
            </Link>

            {/* SIDS */}
            <Link href="/dashboard-analitik" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(254,202,202,0.4)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(153,27,27,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(153,27,27,0.1)'; e.currentTarget.style.background = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(254,202,202,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(153,27,27,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
              >
                <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#b91c1c', padding: '1.25rem', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}><Users size={28}/></div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#7f1d1d', fontSize: '1.15rem', fontWeight: '800' }}>Data Siswa (SIDS)</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>Demografi peserta didik</p>
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
        @keyframes moveWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wave-animation {
          animation: moveWave 15s linear infinite;
          transform-origin: bottom center;
        }
        .wave-animation-reverse {
          animation: moveWave 20s linear infinite reverse;
          transform-origin: bottom center;
        }
        /* Tweak SVG to fill bottom correctly */
        svg {
          margin-bottom: -5px;
        }
      `}</style>
    </div>
  );
}
