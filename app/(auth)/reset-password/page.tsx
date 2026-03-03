'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [pass, setPass] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [ready, setReady] = React.useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  React.useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
  }, []);

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

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:16 }}>
      {show ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 380 }}>
        <h1 className="h1">Parolă nouă</h1>
        {!ready ? (
          <p style={{ fontSize: 13, color: '#6B7280' }}>Se verifică linkul...</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Introduceți noua parolă pentru contul dvs.</p>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Parolă nouă" value={pass} onChange={e => setPass(e.target.value)} style={{ paddingRight: 36, width: '100%' }} />
              {eyeBtn(showPass, () => setShowPass(!showPass))}
            </div>
            <div style={{ height: 8 }} />
            <div style={{ position: 'relative' }}>
              <input className="input" type={showConfirm ? 'text' : 'password'} placeholder="Confirmă parola" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ paddingRight: 36, width: '100%' }} />
              {eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
            </div>
            <div style={{ height: 12 }} />
            <button className="btn" onClick={submit} disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează parola'}
            </button>
            {message && <p style={{ marginTop: 12, fontSize: 13, color: message.includes('succes') ? 'green' : 'red' }}>{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}