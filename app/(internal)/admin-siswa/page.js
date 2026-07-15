'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminSiswaPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const supabase = createClient();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // Map Excel columns to database schema
          // Expected Excel columns: Nama Peserta Didik, NISN, NIK, No KK, Jenis Kelamin, Kelas, Rombel, Sekolah, Jenjang, Layak PIP, KIP, Penghasilan Ortu
          const formattedData = json.map(row => {
            // Helper to handle boolean variations in Excel (Ya/Tidak, Yes/No, True/False, 1/0)
            const parseBoolean = (val) => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') {
                const lower = val.toLowerCase().trim();
                return ['ya', 'yes', 'true', '1', 'layak'].includes(lower);
              }
              if (val === 1) return true;
              return false;
            };

            return {
              nama_peserta_didik: row['Nama Peserta Didik'] || row['NAMA'] || '-',
              nisn: String(row['NISN'] || ''),
              nik: String(row['NIK'] || ''),
              no_kk: String(row['No KK'] || row['NO_KK'] || ''),
              jenis_kelamin: row['Jenis Kelamin'] || row['JK'] || '',
              kelas: String(row['Kelas'] || ''),
              nama_rombel: String(row['Rombel'] || row['Nama Rombel'] || ''),
              nama_sekolah: row['Sekolah'] || row['Nama Sekolah'] || '',
              jenjang: row['Jenjang'] || '',
              layak_pip: parseBoolean(row['Layak PIP']),
              penerima_kip: parseBoolean(row['Penerima KIP'] || row['KIP']),
              penghasilan_ortu: String(row['Penghasilan Ortu'] || row['Penghasilan'] || '')
            };
          }).filter(row => row.nisn && row.nik); // Filter out rows without NISN or NIK (as they are required unique)

          if (formattedData.length === 0) {
            throw new Error("Tidak ada data valid yang ditemukan (Pastikan ada kolom NISN dan NIK).");
          }

          // Insert into Supabase (upsert based on NISN or NIK)
          // Since Supabase RPC or upsert with multiple unique constraints can be tricky, 
          // we use standard upsert assuming 'nisn' is the primary conflict target if set up in schema.
          // For simplicity, we just do a bulk insert. If unique constraint fails, it throws an error.
          const { error: dbError } = await supabase
            .from('siswa')
            .upsert(formattedData, { onConflict: 'nisn', ignoreDuplicates: false });

          if (dbError) throw dbError;

          setMessage(`Berhasil menyimpan ${formattedData.length} data siswa ke database.`);
        } catch (err) {
          setError(err.message || 'Gagal memproses file Excel.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Gagal membaca file.');
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#0284c7', color: 'white', padding: '1rem', borderRadius: '12px' }}>
            <Database size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Unggah Data Siswa (SIDS)</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Upload file Excel berisi data induk siswa untuk diperbarui ke database terpusat.</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          {message && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500' }}>
              <CheckCircle size={20} /> {message}
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500' }}>
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div 
            style={{ 
              border: '2px dashed #cbd5e1', 
              borderRadius: '12px', 
              padding: '3rem 2rem', 
              textAlign: 'center',
              background: '#f8fafc',
              marginBottom: '1.5rem',
              transition: 'border-color 0.2s'
            }}
          >
            <UploadCloud size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Pilih File Excel Data Siswa</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Format yang didukung: .xlsx, .xls</p>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="file-upload"
              style={{ 
                background: 'white', border: '1px solid #cbd5e1', color: '#334155', 
                padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '500', 
                cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s' 
              }}
            >
              Cari File di Perangkat
            </label>
            
            {file && (
              <div style={{ marginTop: '1.5rem', color: '#0284c7', fontWeight: '500', fontSize: '0.95rem' }}>
                File terpilih: {file.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Link href="/data-pendidikan" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500', padding: '0.6rem 1.25rem' }}>
              Batal
            </Link>
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              style={{
                background: '#0284c7', color: 'white', border: 'none', 
                padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: '600', 
                cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                opacity: (!file || loading) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              Mulai Unggah
            </button>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f1f5f9', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#334155', fontWeight: '600', marginBottom: '0.75rem' }}>Panduan Kolom Excel yang Diwajibkan:</h4>
            <ul style={{ color: '#64748b', fontSize: '0.85rem', paddingLeft: '1.25rem', margin: 0, lineHeight: '1.6' }}>
              <li><strong>Nama Peserta Didik</strong> (wajib)</li>
              <li><strong>NISN</strong> (wajib, unik)</li>
              <li><strong>NIK</strong> (wajib, unik)</li>
              <li><strong>No KK</strong> (wajib)</li>
              <li><strong>Sekolah</strong> & <strong>Jenjang</strong></li>
              <li><strong>Kelas</strong> & <strong>Rombel</strong></li>
              <li><strong>Layak PIP</strong> (Ya/Tidak)</li>
            </ul>
          </div>
        </div>

      </div>
      <style jsx global>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
