import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard Rapor Pendidikan',
  description: 'Visualisasi dan Perbandingan Data Rapor Pendidikan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <nav className="navbar" style={{ padding: '0.75rem 2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/logo.png" alt="Logo Kota Tomohon" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.3' }}>
                Pemerintah Kota Tomohon<br/>
                Dinas Pendidikan dan Kebudayaan Daerah
              </div>
              <div className="title" style={{ fontSize: '1.25rem', margin: 0, lineHeight: '1.2' }}>Rapor Pendidikan</div>
            </div>
          </div>
          <div className="nav-links">
            <Link href="/">Dashboard</Link>
            <Link href="/partisipasi">Angka Partisipasi</Link>
            <Link href="/glosarium">Glosarium</Link>
            <Link href="/admin">Upload (Admin)</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
