'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SidgLayout({ children }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        backgroundColor: '#0f172a',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/logo.png" alt="Logo Tomohon" width={40} height={45} style={{ objectFit: 'contain' }} priority />
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'white', fontWeight: '600' }}>Sistem Informasi Data Guru (SIDG)</h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Dinas Pendidikan Daerah Kota Tomohon</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/dashboard-guru" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              padding: '0.5rem',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
              Dashboard Guru
            </Link>
            <Link href="/admin-guru" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              padding: '0.5rem',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
              Admin Upload (SIDG)
            </Link>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#334155' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #334155',
              transition: 'background 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              Kembali ke Portal
            </Link>
            <button onClick={handleLogout} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#b91c1c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#991b1b'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#b91c1c'}>
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
