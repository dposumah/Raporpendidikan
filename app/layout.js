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
        <nav className="navbar">
          <div className="title" style={{ fontSize: '1.5rem' }}>Rapor Pendidikan</div>
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
