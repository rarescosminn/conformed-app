'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    if (!email || !pass) { setError('Completați email-ul și parola.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasMfa = factors?.totp && factors.totp.length > 0;
    if (!hasMfa) {
      router.replace('/mfa-setup');
    } else {
      const al = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (al.data?.nextLevel === 'aal2') router.replace('/mfa-verify');
      else router.replace('/dashboard');
    }
    setLoading(false);
  }

  async function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') await submit();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
      {/* Stânga – branding */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, color: '#fff' }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, marginBottom: 12 }}>
          e<span style={{ opacity: 0.7 }}>Conformed</span>
        </div>
        <div style={{ fontSize: 18, opacity: 0.85, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Platformă SaaS pentru conformare ISO, ESG și trasabilitate operațională.
        </div>
        <div style={{ marginTop: 48, display: 'grid', gap: 16, width: '100%', maxWidth: 300 }}>
          {['ISO 9001 · 14001 · 45001', 'ESG & Sustenabilitate', 'Audit & Conformare', 'Legislație & Documente'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: 0.9 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Dreapta – formular */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, background: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 6 }}>Bun venit înapoi</h1>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Autentifică-te în contul tău eConformed.</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              placeholder="nume@companie.ro"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              type="email"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Parolă</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={handleKey}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <a href="/forgot-password" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Ai uitat parola?</a>
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button
            onClick={submit}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#a5b4fc' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? 'Se verifică...' : 'Intră în cont'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7280' }}>
            Nu ai cont?{' '}
            <a href="/register" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>Înregistrează-te</a>
          </p>
        </div>
      </div>
    </div>
  );
}