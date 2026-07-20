'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart2, Database, ChevronRight, X, School } from 'lucide-react';

export default function PortalPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Premium Dark Navy
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient light effects */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

      {/* Header / Logo section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4rem', zIndex: 1, animation: 'fadeInDown 0.8s ease-out' }}>
        <img src="/logo.png" alt="Logo Tomohon" style={{ height: '90px', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: '500', letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
          Pemerintah Kota Tomohon
        </h2>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, textAlign: 'center', lineHeight: '1.2', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Portal Data Pendidikan
        </h1>
        <p style={{ marginTop: '1rem', color: '#cbd5e1', fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center', lineHeight: '1.6' }}>
          Pusat integrasi informasi dan capaian pendidikan untuk memajukan kualitas belajar mengajar di Kota Tomohon.
        </p>
      </div>

      {/* Cards section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1200px', zIndex: 1, animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}>
        
        {/* Card 1: Rapor Pendidikan */}
        <Link href="/rapor" style={{ textDecoration: 'none' }}>
          <div className="portal-card" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            height: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
          }}
          >
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
              <BarChart2 size={40} color="white" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '0.75rem' }}>Rapor Pendidikan</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Lihat dan analisis indeks pencapaian SPM dan kinerja pendidikan lainnya.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
              Akses Dashboard <ChevronRight size={18} />
            </div>
          </div>
        </Link>

        {/* Card 2: Data Sekolah (SISP) */}
        <Link href="/dashboard-sisp" style={{ textDecoration: 'none' }}>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(245,158,11,0.4)' }}>
              <School size={40} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Data Sekolah (SISP)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Sistem Informasi Satuan Pendidikan. Pemetaan lokasi, fasilitas, dan profil lengkap sekolah.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
              Akses SISP <ChevronRight size={18} />
            </div>
          </div>
        </Link>

        {/* Card 3: Data Guru */}
        <Link href="/dashboard-guru" style={{ textDecoration: 'none' }}>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
              <Database size={40} color="white" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '0.75rem' }}>Data Guru (SIDG)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Pusat Informasi Data Guru dan Tenaga Kependidikan (Persebaran dan kualifikasi).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
              Akses SIDG <ChevronRight size={18} />
            </div>
          </div>
        </Link>

        {/* Card 4: Data Siswa (SIDS) */}
        <Link href="/dashboard-analitik" style={{ textDecoration: 'none' }}>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}>
              <Database size={40} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Data Siswa (SIDS)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Sistem Informasi Data Siswa. Statistik demografi dan daftar siswa aktif.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: '600', fontSize: '1rem', marginTop: 'auto' }}>
              Akses SIDS <ChevronRight size={18} />
            </div>
          </div>
        </Link>
        
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '2rem', zIndex: 1, color: '#64748b', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} Dinas Pendidikan dan Kebudayaan Kota Tomohon
      </div>

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
