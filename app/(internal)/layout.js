import Link from 'next/link';
import { Home, Users, BookOpen, Settings, School, Map } from 'lucide-react';

export default function InternalLayout({ children }) {
  
  return (
    <>
      <nav className="navbar" style={{ padding: '0.75rem 2rem', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Logo Kota Tomohon" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.3' }}>
              Pemerintah Kota Tomohon<br/>
              Dinas Pendidikan dan Kebudayaan Daerah
            </div>
            <div className="title" style={{ fontSize: '1.25rem', margin: 0, lineHeight: '1.2', color: 'var(--primary-color)' }}>Rapor Pendidikan</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/rapor" style={{ display: 'flex', alignItems: 'center' }}><BookOpen size={16} style={{marginRight: '6px'}}/> Rapor Daerah</Link>
          <Link href="/capaian-daerah" style={{ display: 'flex', alignItems: 'center' }}><Map size={16} style={{marginRight: '6px'}}/> Capaian Daerah</Link>
          <Link href="/rapor-sekolah" style={{ display: 'flex', alignItems: 'center' }}><School size={16} style={{marginRight: '6px'}}/> Capaian Sekolah</Link>
          <Link href="/pembenahan" style={{ display: 'flex', alignItems: 'center' }}><BookOpen size={16} style={{marginRight: '6px'}}/> Referensi Pembenahan</Link>
          <Link href="/partisipasi" style={{ display: 'flex', alignItems: 'center' }}><Users size={16} style={{marginRight: '6px'}}/> Angka Partisipasi</Link>
          <Link href="/glosarium" style={{ display: 'flex', alignItems: 'center' }}><BookOpen size={16} style={{marginRight: '6px'}}/> Glosarium</Link>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center' }}><Settings size={16} style={{marginRight: '6px'}}/> Upload (Admin)</Link>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
          <Link href="/" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Kembali ke Portal
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
