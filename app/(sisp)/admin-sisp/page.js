'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminSispPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [periode, setPeriode] = useState('');
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    // Optionally auto-fill if needed, but manual input is safer
  }, []);


  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      readExcel(selected);
    }
  };

  const readExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      setPreview(json.slice(0, 5));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: 'Pilih file Excel terlebih dahulu', type: 'error' });
      return;
    }
    if (!periode) {
      setMessage({ text: 'Periode aktif tidak ditemukan', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Membaca dan memproses file Excel (SISP)...', type: 'info' });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);

          if (json.length === 0) throw new Error('File kosong');
          
          setMessage({ text: `Mengunggah ${json.length} data sekolah ke server...`, type: 'info' });

          const response = await fetch('/api/upload-sisp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: json, periode })
          });

          const result = await response.json();
          if (response.ok) {
            setMessage({ text: `Berhasil mengunggah data Sekolah (SISP)!`, type: 'success' });
            setFile(null);
            setPreview([]);
          } else {
            throw new Error(result.error || 'Gagal mengunggah data');
          }
        } catch (error) {
          setMessage({ text: error.message, type: 'error' });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMessage({ text: 'Gagal memproses file', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 75px)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', backgroundColor: '#e0e7ff', borderRadius: '50%', color: '#4f46e5', marginBottom: '1rem' }}>
            <Upload size={32} />
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#0f172a' }}>Unggah Data Satuan Pendidikan (SISP)</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Impor data sekolah dari file Excel.</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
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

        {/* Upload Box */}
        <div 
          style={{ 
            border: '2px dashed #cbd5e1', 
            borderRadius: '12px', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        >
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            disabled={loading}
          />
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1.2rem' }}>
            {file ? file.name : 'Pilih atau Tarik File Excel Ke Sini'}
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Format yang didukung: .xlsx, .xls</p>
        </div>

        {/* Messages */}
        {message.text && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            backgroundColor: message.type === 'error' ? '#fef2f2' : message.type === 'success' ? '#f0fdf4' : '#eff6ff',
            color: message.type === 'error' ? '#ef4444' : message.type === 'success' ? '#10b981' : '#3b82f6',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : message.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`
          }}>
            {message.type === 'error' ? <AlertCircle size={20} /> : message.type === 'success' ? <CheckCircle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
            <span style={{ fontWeight: '500' }}>{message.text}</span>
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            backgroundColor: !file || loading ? '#94a3b8' : '#4f46e5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <><RefreshCw size={20} className="animate-spin" /> Memproses Data...</>
          ) : (
            <><Upload size={20} /> Unggah Sekarang</>
          )}
        </button>

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1.1rem' }}>Pratinjau Data SISP (5 baris pertama)</h3>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Nama Satuan Pendidikan</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>NPSN</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Bentuk Pendidikan</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status Sekolah</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>{row['Nama Satuan Pendidikan']}</td>
                      <td style={{ padding: '0.75rem' }}>{row['NPSN']}</td>
                      <td style={{ padding: '0.75rem' }}>{row['Bentuk Pendidikan']}</td>
                      <td style={{ padding: '0.75rem' }}>{row['Status Sekolah']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
