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
        {children}
      </body>
    </html>
  );
}
