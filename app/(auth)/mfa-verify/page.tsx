'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function MfaVerify() {
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function verify() {
    if (!code) return setMessage('Introduceți codul.');
    setLoading(true);
    setMessage('');
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factors.totp.length) { setMessage('Nu există MFA configurat.'); setLoading(false); return; }
    const factorId = factors.totp[0].id;
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setMessage(challengeError.message); setLoading(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code });
    setLoading(false);
    if (error) {
      setMessage('Cod incorect. Încearcă din nou.');
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        const { data: onb } = await supabase.from('onboarding').select('id').eq('user_id', user.id).single();
        if (!onb) router.replace('/onboarding');
        else router.replace('/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: 380, textAlign: 'center' }}>
        <h1 className="h1">Verificare în doi pași</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Introduceți codul din Google Authenticator sau Authy.
        </p>
        <input
          className="input"
          placeholder="Cod 6 cifre"
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={6}
          style={{ textAlign: 'center', letterSpacing: 6, fontSize: 20 }}
        />
        <div style={{ height: 12 }} />
        <button className="btn" onClick={verify} disabled={loading}>
          {loading ? 'Se verifică...' : 'Verifică'}
        </button>
        {message && <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
}