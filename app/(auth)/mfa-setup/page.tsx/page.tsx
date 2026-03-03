'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function MfaSetup() {
  const [qr, setQr] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [factorId, setFactorId] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  React.useEffect(() => {
    async function enroll() {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'eConformed' });
      if (error) { setMessage(error.message); return; }
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
    enroll();
  }, []);

  async function verify() {
    if (!code) return setMessage('Introduceți codul.');
    setLoading(true);
    setMessage('');
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setMessage(challengeError.message); setLoading(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code });
    setLoading(false);
    if (error) setMessage(error.message);
    else router.replace('/dashboard');
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 400, textAlign: 'center' }}>
        <h1 className="h1">Configurare autentificare în doi pași</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Scanează codul QR cu Google Authenticator sau Authy, apoi introdu codul generat.
        </p>
        {qr && <img src={qr} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 16px' }} />}
        {secret && (
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16, wordBreak: 'break-all' }}>
            Cod manual: {secret}
          </p>
        )}
        <input className="input" placeholder="Cod din aplicație (6 cifre)" value={code} onChange={e => setCode(e.target.value)} style={{ textAlign: 'center', letterSpacing: 6, fontSize: 20 }} />
        <div style={{ height: 12 }} />
        <button className="btn" onClick={verify} disabled={loading}>
          {loading ? 'Se verifică...' : 'Activează MFA'}
        </button>
        {message && <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
}