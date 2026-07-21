'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh(); // Refresh to update server components and middleware state
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '1rem',
      position: 'relative'
    }}>


      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3rem 2.5rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Logo Tomohon" style={{ height: '60px', marginBottom: '1rem' }} />
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Portal Pendidikan Tomohon</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Masuk dengan kredensial Anda untuk mengakses data pendidikan yang bersifat rahasia.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="admin@tomohon.go.id"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Masuk Sistem'}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
