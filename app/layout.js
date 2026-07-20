import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard Rapor Pendidikan',
  description: 'Visualisasi dan Perbandingan Data Rapor Pendidikan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
          <footer style={{
            position: 'sticky',
            bottom: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '1rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem',
            fontWeight: '600',
            zIndex: 9999,
            boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            &copy; 2026 [DN] Sekretariat Dikbud Tomohon
          </footer>
        </div>
      </body>
    </html>
  );
}
