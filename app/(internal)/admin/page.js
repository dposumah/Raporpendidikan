'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Database, School } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' atau 'spm'

  // State untuk Upload Rapor
  const [file, setFile] = useState(null);
  const [tahun, setTahun] = useState('2025');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [sekolahStatus, setSekolahStatus] = useState({ loading: false, error: null, success: null });

  // State untuk Input SPM
  const [spmTahun, setSpmTahun] = useState('2025');
  const [spmNilai, setSpmNilai] = useState('');
  const [spmLabel, setSpmLabel] = useState('');
  const [spmStatus, setSpmStatus] = useState({ loading: false, error: null, success: null });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ ...status, error: 'Silakan pilih file Excel terlebih dahulu.' });
      return;
    }

    setStatus({ loading: true, error: null, success: null });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tahun', tahun);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ loading: false, error: null, success: data.message });
        setFile(null); // reset
        router.refresh();
      } else {
        setStatus({ loading: false, error: data.error, success: null });
      }
    } catch (err) {
      setStatus({ loading: false, error: 'Terjadi kesalahan jaringan.', success: null });
    }
  };

  
  const handleUploadSekolah = async () => {
    if (!file) {
      setSekolahStatus({ ...sekolahStatus, error: 'Silakan pilih file Excel terlebih dahulu.' });
      return;
    }

    setSekolahStatus({ loading: true, error: null, success: null });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tahun', tahun);

    try {
      const response = await fetch('/api/upload-sekolah', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSekolahStatus({ loading: false, error: null, success: data.message });
        setFile(null); // reset
        router.refresh();
      } else {
        setSekolahStatus({ loading: false, error: data.error, success: null });
      }
    } catch (err) {
      setSekolahStatus({ loading: false, error: 'Terjadi kesalahan jaringan.', success: null });
    }
  };

  const handleSpmSubmit = async (e) => {
    e.preventDefault();
    if (!spmTahun || !spmNilai) {
      setSpmStatus({ loading: false, error: 'Tahun dan Nilai wajib diisi.', success: null });
      return;
    }

    setSpmStatus({ loading: true, error: null, success: null });

    try {
      const response = await fetch('/api/spm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tahun: spmTahun,
          indeks_spm: 'Indeks Pencapaian SPM',
          nilai_capaian: spmNilai,
          label_capaian: spmLabel
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSpmStatus({ loading: false, error: null, success: 'Data SPM berhasil disimpan!' });
        // Kosongkan form yang tidak perlu disimpan default-nya
        setSpmNilai('');
        setSpmLabel('');
        router.refresh();
      } else {
        setSpmStatus({ loading: false, error: data.error, success: null });
      }
    } catch (err) {
      setSpmStatus({ loading: false, error: 'Terjadi kesalahan jaringan.', success: null });
    }
  };

  return (
    <main className="container">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Halaman Administrator</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('upload')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
            backgroundColor: activeTab === 'upload' ? 'var(--primary-color)' : '#f1f5f9',
            color: activeTab === 'upload' ? 'white' : 'var(--text-main)',
            transition: 'all 0.2s'
          }}
        >
          <Database size={20} />
          Upload Rapor Pendidikan
        </button>
        <button 
          onClick={() => setActiveTab('spm')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
            backgroundColor: activeTab === 'spm' ? 'var(--primary-color)' : '#f1f5f9',
            color: activeTab === 'spm' ? 'white' : 'var(--text-main)',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={20} />
          Input Indeks SPM
        </button>
        <button 
          onClick={() => setActiveTab('upload_sekolah')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
            backgroundColor: activeTab === 'upload_sekolah' ? 'var(--primary-color)' : '#f1f5f9',
            color: activeTab === 'upload_sekolah' ? 'white' : 'var(--text-main)',
            transition: 'all 0.2s'
          }}
        >
          <School size={20} />
          Upload Capaian Sekolah
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Upload Data Rapor Pendidikan</h2>
          <div className="form-group">
            <label className="form-label">Tahun Data</label>
            <select 
              className="form-select" 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">File Excel (.xlsx)</label>
            <div className="dropzone" onClick={() => document.getElementById('fileUpload').click()}>
              <UploadCloud className="dropzone-icon" />
              {file ? (
                <p style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{file.name}</p>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Klik atau drag file ke sini</p>
              )}
              <input 
                id="fileUpload" 
                type="file" 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          {status.error && (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {status.error}
            </div>
          )}

          {status.success && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} />
              {status.success}
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={handleUpload}
            disabled={status.loading}
          >
            {status.loading ? 'Mengunggah dan Memproses...' : 'Upload Data'}
          </button>
        </div>
      )}

      
      {activeTab === 'upload_sekolah' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Upload Capaian Per Sekolah (Format DASMEN)</h2>
          <div className="form-group">
            <label className="form-label">Tahun Data</label>
            <select 
              className="form-select" 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">File Excel Horizontal (.xlsx)</label>
            <div className="dropzone" onClick={() => document.getElementById('fileUploadSekolah').click()}>
              <UploadCloud className="dropzone-icon" />
              {file ? (
                <p style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{file.name}</p>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Klik atau drag file Rapor Sekolah ke sini</p>
              )}
              <input 
                id="fileUploadSekolah" 
                type="file" 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          {sekolahStatus.error && (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {sekolahStatus.error}
            </div>
          )}

          {sekolahStatus.success && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} />
              {sekolahStatus.success}
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', backgroundColor: '#0f766e' }}
            onClick={handleUploadSekolah}
            disabled={sekolahStatus.loading}
          >
            {sekolahStatus.loading ? 'Menganalisis & Mengunggah Data Sekolah...' : 'Upload Data Rapor Sekolah'}
          </button>
        </div>
      )}

      {activeTab === 'spm' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Input Indeks Pencapaian SPM</h2>
          
          <form onSubmit={handleSpmSubmit}>
            <div className="form-group">
              <label className="form-label">Tahun</label>
              <select 
                className="form-select" 
                value={spmTahun} 
                onChange={(e) => setSpmTahun(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nilai Capaian</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                placeholder="0.00"
                value={spmNilai}
                onChange={(e) => setSpmNilai(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Label Capaian (Contoh: Tuntas, Baik, Kurang)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Masukkan label capaian"
                value={spmLabel}
                onChange={(e) => setSpmLabel(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}
              />
            </div>

            {spmStatus.error && (
              <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} />
                {spmStatus.error}
              </div>
            )}

            {spmStatus.success && (
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} />
                {spmStatus.success}
              </div>
            )}

            <button 
              type="submit"
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={spmStatus.loading}
            >
              {spmStatus.loading ? 'Menyimpan...' : 'Simpan Data SPM'}
            </button>
          </form>
        </div>
      )}

    </main>
  );
}
