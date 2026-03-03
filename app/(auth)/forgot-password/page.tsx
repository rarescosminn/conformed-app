'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function ForgotPassword() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    if (!email) return setMessage('Introduceți emailul.');
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.econformed.io/reset-password',
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Email trimis! Verifică inbox-ul.');
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 380 }}>
        <h1 className="h1">Recuperare parolă</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Introduceți emailul și vă trimitem un link de resetare.
        </p>
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <div style={{ height: 12 }} />
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Se trimite...' : 'Trimite link'}
        </button>
        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.includes('trimis') ? 'green' : 'red' }}>
            {message}
          </p>
        )}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          <a href="/login" style={{ color: '#4F46E5', fontWeight: 700 }}>Înapoi la login</a>
        </div>
      </div>
    </div>
  );
}