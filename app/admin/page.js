'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [tahun, setTahun] = useState('2025');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

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
      } else {
        setStatus({ loading: false, error: data.error, success: null });
      }
    } catch (err) {
      setStatus({ loading: false, error: 'Terjadi kesalahan jaringan.', success: null });
    }
  };

  return (
    <main className="container">
      <div className="header">
        <h1 className="title">Upload Data Rapor Pendidikan</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <label className="form-label">Tahun Data</label>
          <select 
            className="form-select" 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)}
          >
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
    </main>
  );
}
