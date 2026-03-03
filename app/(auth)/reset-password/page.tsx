'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
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
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) setMessage(error.message);
    else {
      setMessage('Parola a fost schimbată cu succes!');
      setTimeout(() => router.push('/login'), 2000);
    }
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 380 }}>
        <h1 className="h1">Parolă nouă</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Introduceți noua parolă pentru contul dvs.
        </p>
        <input className="input" type="password" placeholder="Parolă nouă" value={pass} onChange={e => setPass(e.target.value)} />
        <div style={{ height: 8 }} />
        <input className="input" type="password" placeholder="Confirmă parola" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <div style={{ height: 12 }} />
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Se salvează...' : 'Salvează parola'}
        </button>
        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.includes('succes') ? 'green' : 'red' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
