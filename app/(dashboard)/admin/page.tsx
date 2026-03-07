'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';

const ADMIN_EMAIL = 'contact@econformed.io'; // emailul tău de super admin

export default function AdminPage() {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  async function createAccount() {
    if (!email.endsWith('@econformed.io')) return setMessage('Doar conturi @econformed.io pot fi create aici.');
    if (pass.length < 8) return setMessage('Parola trebuie să aibă minim 8 caractere.');
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { emailRedirectTo: 'https://app.econformed.io/login' }
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage(`✅ Cont creat: ${email}`);
    setEmail('');
    setPass('');
  }

  if (isAdmin === null) return null;

  if (!isAdmin) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#991B1B' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2>Acces interzis</h2>
        <p>Această pagină este disponibilă doar administratorului.</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Creare cont @econformed.io</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Creați conturi pentru echipa internă eConformed.</p>

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Email</label>
        <input
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
          placeholder="nume@econformed.io"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Parolă inițială</label>
        <input
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 24, boxSizing: 'border-box' }}
          type="password"
          placeholder="Minim 8 caractere"
          value={pass}
          onChange={e => setPass(e.target.value)}
        />

        <button
          onClick={createAccount}
          disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Se creează...' : 'Creează cont'}
        </button>

        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.startsWith('✅') ? '#166534' : '#991B1B' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}