'use client';

import React from 'react';
import Link from 'next/link';
import { School, Database, Home, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function SispLayout({ children }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* Top Navbar specifically for SISP */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '0 2rem', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#3b82f6', padding: '0.5rem', borderRadius: '8px' }}>
            <School size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Sistem Informasi Satuan Pendidikan</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Modul Pendataan Sekolah (SISP)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
            <Home size={18} /> Portal Utama
          </Link>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>
          
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard-sisp" style={{
              color: pathname === '/dashboard-sisp' ? '#38bdf8' : 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              padding: '0.5rem',
              borderBottom: pathname === '/dashboard-sisp' ? '2px solid #38bdf8' : '2px solid transparent',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.borderBottomColor = pathname === '/dashboard-sisp' ? '#38bdf8' : 'transparent'}>
              Dashboard Sekolah
            </Link>
            <Link href="/admin-sisp" style={{
              color: pathname === '/admin-sisp' ? '#38bdf8' : 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              padding: '0.5rem',
              borderBottom: pathname === '/admin-sisp' ? '2px solid #38bdf8' : '2px solid transparent',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.borderBottomColor = pathname === '/admin-sisp' ? '#38bdf8' : 'transparent'}>
              Admin Upload (SISP)
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative' }}>
        {children}
      </main>

    </div>
  );
}
