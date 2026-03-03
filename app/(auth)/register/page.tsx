'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    if (pass !== confirm) return setMessage('Parolele nu coincid.');
    if (pass.length < 8) return setMessage('Parola trebuie să aibă minim 8 caractere.');
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Cont creat! Verifică emailul pentru confirmare.');
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 380 }}>
        <h1 className="h1">Creează cont</h1>
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <div style={{ height: 8 }} />
        <input className="input" type="password" placeholder="Parolă" value={pass} onChange={e => setPass(e.target.value)} />
        <div style={{ height: 8 }} />
        <input className="input" type="password" placeholder="Confirmă parola" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <div style={{ height: 12 }} />
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Se creează...' : 'Creează cont'}
        </button>
        {message && <p style={{ marginTop: 12, fontSize: 13, color: message.includes('creat') ? 'green' : 'red' }}>{message}</p>}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          Ai deja cont? <a href="/login" style={{ color: '#4F46E5', fontWeight: 700 }}>Autentifică-te</a>
        </div>
      </div>
    </div>
  );
}
