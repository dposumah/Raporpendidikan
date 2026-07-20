'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminGuruPage() {
  const [file, setFile] = useState(null);
  const [periode, setPeriode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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
      setError('Silakan isi Periode (Misal: 2025/2026) terlebih dahulu.');
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('periode', periode.trim());

      const response = await fetch('/api/upload-guru', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(result.message);
        setFile(null);
      } else {
        throw new Error(result.error || 'Gagal mengunggah data guru');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '12px', color: '#4f46e5' }}>
            <Database size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Unggah Data Guru (SIDG)</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Impor data guru dari file Excel berformat standar Dapodik/Simpatika.</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
          
          {error && (
            <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
              <AlertCircle color="#ef4444" size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {message && (
            <div style={{ backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
              <CheckCircle color="#10b981" size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                Periode Data <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Misal: 2025/2026"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                File Excel (.xlsx) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              
              <div style={{ 
                border: '2px dashed #cbd5e1', 
                borderRadius: '12px', 
                padding: '2.5rem 1rem', 
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: loading ? 'not-allowed' : 'pointer' }}
                />
                
                <UploadCloud size={48} color={file ? '#4f46e5' : '#94a3b8'} style={{ margin: '0 auto 1rem auto' }} />
                
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
                  {file ? file.name : 'Pilih atau Tarik file Excel ke sini'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  {file ? `Ukuran: ${(file.size / 1024).toFixed(1)} KB` : 'Maksimal ukuran file: 10MB'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={handleUpload}
                disabled={loading || !file || !periode}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: (loading || !file || !periode) ? '#94a3b8' : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (loading || !file || !periode) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                {loading ? 'Memproses Data...' : 'Unggah Data'}
              </button>
              
              <Link href="/dashboard-guru" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.875rem 1.5rem',
                backgroundColor: 'white',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}>
                Batal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
