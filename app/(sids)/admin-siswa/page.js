'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminSiswaPage() {
  const [file, setFile] = useState(null);
  const [periode, setPeriode] = useState('');
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
    if (!file) {
      setError('Silakan pilih file Excel terlebih dahulu.');
      return;
    }
    if (!periode.trim()) {
      setError('Silakan isi Periode (Tahun Ajaran & Semester) terlebih dahulu.');
      return;
    }
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
            // Helper to handle boolean variations in Excel
            const parseBoolean = (val) => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') {
                const lower = val.toLowerCase().trim();
                return ['ya', 'yes', 'true', '1', 'layak', 'v'].includes(lower);
              }
              if (val === 1) return true;
              return false;
            };

            const toStringOrEmpty = (val) => val !== undefined && val !== null ? String(val).trim() : '';

            // Flexible column matching logic (ignores case and some spaces)
            const getVal = (possibleKeys) => {
              const rowKeys = Object.keys(row);
              for (const pk of possibleKeys) {
                const foundKey = rowKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
                if (foundKey) return toStringOrEmpty(row[foundKey]);
              }
              return '';
            };

            return {
              periode: periode.trim(),
              nama_peserta_didik: getVal(['nama peserta didik', 'nama', 'nama siswa']),
              nama_sekolah: getVal(['nama sekolah', 'sekolah']),
              npsn: getVal(['npsn']),
              jenjang: getVal(['jenjang']),
              alamat_sekolah: getVal(['alamat sekolah']),
              sekolah_kabupaten: getVal(['kabupaten sekolah', 'kabupaten']),
              sekolah_kecamatan: getVal(['kecamatan sekolah', 'kecamatan']),
              sekolah_desa_kelurahan: getVal(['desa_kelurahan sekolah', 'desa kelurahan sekolah', 'desa_kelurahan']),
              sekolah_dusun: getVal(['nama_dusun sekolah', 'dusun sekolah', 'nama_dusun']),
              sekolah_provinsi: getVal(['provinsi sekolah', 'provinsi']),
              sekolah_kode_pos: getVal(['kode_pos sekolah', 'kode pos sekolah', 'kode pos', 'kode_pos']),
              
              jenis_kelamin: getVal(['Jenis Kelamin siswa', 'Jenis Kelamin', 'jk', 'l/p']),
              nisn: getVal(['NISN', 'nisn']),
              nik: getVal(['NIK', 'nik']),
              no_kk: getVal(['No KK', 'NO_KK']),
              tempat_lahir: getVal(['Tempat Lahir siswa', 'Tempat Lahir']),
              tanggal_lahir: getVal(['Tanggal Lahir siswa', 'Tanggal Lahir']),
              agama: getVal(['Agama siswa', 'Agama']),
              kebutuhan_khusus: getVal(['Kebutuhan Khusus siswa', 'Kebutuhan Khusus']),
              
              alamat_siswa: getVal(['Alamat siswa', 'Alamat_1', 'Alamat']),
              dusun_siswa: getVal(['Nama Dusun siswa', 'Nama Dusun_1', 'Dusun_1', 'Nama Dusun', 'Dusun']),
              kelurahan_siswa: getVal(['Desa Kelurahan siswa', 'Desa Kelurahan_1', 'Kelurahan_1', 'Desa_1', 'Desa Kelurahan', 'Kelurahan', 'Desa']),
              kecamatan_siswa: getVal(['Kecamatan siswa', 'Kecamatan_1', 'Kecamatan_2', 'Kecamatan Tempat Tinggal', 'Kecamatan Domisili', 'Kec. Tempat Tinggal', 'Kecamatan']),
              kabupaten_siswa: getVal(['Kabupaten siswa', 'Kabupaten_1', 'Kabupaten_2', 'Kabupaten Tempat Tinggal', 'Kabupaten Domisili', 'Kab. Tempat Tinggal', 'Kota Tempat Tinggal', 'Kabupaten', 'Kota']),
              provinsi_siswa: getVal(['Propinsi siswa', 'Provinsi siswa', 'Propinsi_1', 'Provinsi_1', 'Propinsi', 'Provinsi']),
              kode_pos_siswa: getVal(['Kode Pos siswa', 'Kode Pos_1', 'Kode Pos']),
              
              lintang: getVal(['Lintang siswa', 'Lintang', 'Latitude', 'Lat']),
              bujur: getVal(['Bujur siswa', 'Bujur', 'Longitude', 'Long', 'Lng']),
              jenis_tinggal: getVal(['Jenis Tinggal siswa', 'Jenis Tinggal']),
              alat_transportasi: getVal(['Alat Transportasi siswa', 'Alat Transportasi']),
              
              nik_ayah: getVal(['NIK Ayah']),
              nik_ibu: getVal(['Nik Ibu', 'NIK Ibu']),
              anak_ke: getVal(['Anak ke']),
              nomor_telp: getVal(['nomor telp siswa', 'nomor telp', 'no telp', 'telepon', 'hp']),
              email: getVal(['email siswa', 'email']),
              
              layak_pip: parseBoolean(getVal(['Layak PIP'])),
              alasan_layak_pip: getVal(['Alasan Layak PIP']),
              penerima_kip: parseBoolean(getVal(['Penerima KIP', 'KIP'])),
              no_kip: getVal(['No KIP']),
              nama_kip: getVal(['Nama KIP']),
              
              no_akta_lahir: getVal(['No Akta Lahir', 'Akta Lahir']),
              nama_ayah: getVal(['Nama Ayah']),
              pendidikan_ayah: getVal(['Pendidikan Ayah']),
              pekerjaan_ayah: getVal(['pekerjaan ayah', 'Pekerjaan Ayah']),
              penghasilan_ayah: getVal(['penghasilan ayah', 'Penghasilan Ayah']),
              kebutuhan_khusus_ayah: getVal(['kebutuhan khusus ayah']),
              
              nama_ibu_kandung: getVal(['nama ibu kandung', 'nama ibu']),
              pendidikan_ibu: getVal(['pendidikan ibu']),
              pekerjaan_ibu: getVal(['pekerjaan ibu']),
              penghasilan_ibu: getVal(['penghasilan ibu']),
              kebutuhan_khusus_ibu: getVal(['kebutuhan khusus ibu']),
              
              nama_wali: getVal(['nama wali']),
              pekerjaan_wali: getVal(['pekerjaan wali']),
              penghasilan_wali: getVal(['penghasilan wali']),
              
              kelas: getVal(['kelas']),
              nama_jurusan: getVal(['nama jurusan', 'jurusan']),
              nama_rombel: getVal(['nama rombel', 'rombel']),
              tinggi_badan: getVal(['tinggi badan']),
              berat_badan: getVal(['berat bahan', 'berat badan']),
              lingkar_kepala: getVal(['lingkar kepala']),
              jumlah_saudara_kandung: getVal(['jumlah saudara kandung'])
            };
          }).filter(row => row.nama_peserta_didik); // Hanya wajibkan nama agar siswa tanpa NIK/NISN tidak terbuang

          // Berikan fallback untuk NISN dan NIK yang kosong
          formattedData.forEach(row => {
            if (!row.nisn || String(row.nisn).trim() === '') {
              row.nisn = (row.nik && String(row.nik).trim() !== '') ? row.nik : `TMP_${row.nama_peserta_didik.replace(/\s+/g, '')}_${row.tanggal_lahir || ''}`;
            }
            if (!row.nik || String(row.nik).trim() === '') {
              row.nik = row.nisn; // Samakan agar tidak null
            }
          });

          if (formattedData.length === 0) {
            throw new Error("Tidak ada data valid yang ditemukan (Pastikan ada kolom Nama Peserta Didik).");
          }

          // Deduplicate the data based on NISN and Periode before sending to database.
          // This prevents the PostgreSQL ON CONFLICT error within the same chunk.
          const uniqueNisnMap = new Map();
          formattedData.forEach(row => {
            const key = `${row.nisn}_${row.periode}`;
            uniqueNisnMap.set(key, row);
          });
          
          let deduplicatedData = Array.from(uniqueNisnMap.values());

          const CHUNK_SIZE = 1000;
          let successCount = 0;
          
          for (let i = 0; i < deduplicatedData.length; i += CHUNK_SIZE) {
            const chunk = deduplicatedData.slice(i, i + CHUNK_SIZE);
            setMessage(`Memproses data: ${Math.min(i + CHUNK_SIZE, deduplicatedData.length)} dari ${deduplicatedData.length} baris...`);
            
            const { error: dbError } = await supabase
              .from('siswa')
              .upsert(chunk, { onConflict: 'nisn, periode' });

            if (dbError) {
              console.error('Database Error on Chunk:', dbError);
              throw new Error(`Gagal menyimpan baris ${i+1} sampai ${i+chunk.length}. Pesan Error: ${dbError.message}`);
            }
            successCount += chunk.length;
          }

          setMessage(`✅ Berhasil menyimpan total ${successCount} data siswa untuk periode ${periode}!`);
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

          {/* PANDUAN KOLOM */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="#3b82f6"/> Panduan Struktur Excel
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
              Pastikan baris pertama (header) pada file Excel Anda memiliki judul kolom berikut (tidak harus berurutan, namun <strong>NISN</strong> dan <strong>NIK</strong> wajib ada):<br/>
              <em>Nama Peserta Didik, NISN, NIK, No KK, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Kebutuhan Khusus, Alamat Jalan, RT, RW, Nama Dusun, Nama Kelurahan/Desa, Kecamatan, Kode Pos, Jenis Tinggal, Alat Transportasi, Layak PIP, Alasan Layak PIP, Penerima KIP, No KIP, Anak Ke-, dsb.</em>
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '500', color: '#334155', marginBottom: '0.5rem' }}>Periode (Tahun Ajaran & Semester) <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              placeholder="Contoh: Genap 2025/2026"
              value={periode}
              onChange={e => setPeriode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Setiap kali mengunggah data untuk periode baru, pastikan untuk menggunakan penamaan periode yang konsisten (Misal: Ganjil 2025/2026, Genap 2025/2026).
            </p>
          </div>

          {/* INPUT FILE */}
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
              disabled={!file || !periode || loading}
              style={{
                background: '#0284c7', color: 'white', border: 'none', 
                padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: '600', 
                cursor: (!file || !periode || loading) ? 'not-allowed' : 'pointer',
                opacity: (!file || !periode || loading) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              Mulai Unggah
            </button>
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
