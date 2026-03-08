'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';

const ADMIN_EMAIL = 'contact@econformed.io';

const input: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 };
const btn = (color: string): React.CSSProperties => ({ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: color, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' });
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 24 };

export default function AdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  // Cont intern
  const [intEmail, setIntEmail] = React.useState('');
  const [intPass, setIntPass] = React.useState('');
  const [intMsg, setIntMsg] = React.useState('');
  const [intLoading, setIntLoading] = React.useState(false);

  // Cont client extern
  const [extEmail, setExtEmail] = React.useState('');
  const [extPass, setExtPass] = React.useState('');
  const [extDenumire, setExtDenumire] = React.useState('');
  const [extOrgType, setExtOrgType] = React.useState<'spital' | 'companie' | 'institutie_publica'>('companie');
  const [extMsg, setExtMsg] = React.useState('');
  const [extLoading, setExtLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  async function createIntern() {
    if (!intEmail.endsWith('@econformed.io')) return setIntMsg('Doar conturi @econformed.io pot fi create aici.');
    if (intPass.length < 8) return setIntMsg('Parola trebuie sa aiba minim 8 caractere.');
    setIntLoading(true); setIntMsg('');
    const { error } = await supabase.auth.signUp({
      email: intEmail, password: intPass,
      options: { emailRedirectTo: 'https://app.econformed.io/login' }
    });
    setIntLoading(false);
    if (error) setIntMsg(error.message);
    else { setIntMsg(`✅ Cont creat: ${intEmail}`); setIntEmail(''); setIntPass(''); }
  }

  async function createClient() {
    if (!extEmail || !extEmail.includes('@')) return setExtMsg('Email invalid.');
    if (extPass.length < 8) return setExtMsg('Parola trebuie sa aiba minim 8 caractere.');
    if (!extDenumire.trim()) return setExtMsg('Denumirea organizatiei este obligatorie.');
    setExtLoading(true); setExtMsg('');

    // 1. Creaza contul
    const { data, error } = await supabase.auth.signUp({
      email: extEmail, password: extPass,
      options: { emailRedirectTo: 'https://app.econformed.io/login' }
    });

    if (error) { setExtLoading(false); return setExtMsg(error.message); }

    const userId = data.user?.id;
    if (!userId) { setExtLoading(false); return setExtMsg('Eroare: user ID lipsa.'); }

    // 2. Creaza organizatia
    const { error: orgError } = await supabase.from('organizations').insert({
      user_id: userId,
      denumire: extDenumire.trim(),
      org_type: extOrgType,
      onboarding_completed: false,
    });

    setExtLoading(false);
    if (orgError) setExtMsg(`Cont creat dar eroare organizatie: ${orgError.message}`);
    else { setExtMsg(`✅ Cont client creat: ${extEmail} (${extDenumire})`); setExtEmail(''); setExtPass(''); setExtDenumire(''); }
  }

  if (isAdmin === null) return null;

  if (!isAdmin) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#991B1B' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2>Acces interzis</h2>
        <p>Aceasta pagina este disponibila doar administratorului.</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 16px' }}>

      {/* Cont intern */}
      <div style={card}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cont intern @econformed.io</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Pentru echipa interna eConformed.</p>

        <label style={label}>Email</label>
        <input style={input} placeholder="nume@econformed.io" value={intEmail} onChange={e => setIntEmail(e.target.value)} />

        <label style={label}>Parola initiala</label>
        <input style={input} type="password" placeholder="Minim 8 caractere" value={intPass} onChange={e => setIntPass(e.target.value)} />

        <button onClick={createIntern} disabled={intLoading} style={btn('#4F46E5')}>
          {intLoading ? 'Se creeaza...' : 'Creeaza cont intern'}
        </button>
        {intMsg && <p style={{ marginTop: 12, fontSize: 13, color: intMsg.startsWith('✅') ? '#166534' : '#991B1B' }}>{intMsg}</p>}
      </div>

      {/* Cont client extern */}
      <div style={card}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cont client extern</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Creeaza cont pentru un client nou (spital, companie, institutie).</p>

        <label style={label}>Email client</label>
        <input style={input} placeholder="client@firma.ro" value={extEmail} onChange={e => setExtEmail(e.target.value)} />

        <label style={label}>Parola initiala</label>
        <input style={input} type="password" placeholder="Minim 8 caractere" value={extPass} onChange={e => setExtPass(e.target.value)} />

        <label style={label}>Denumire organizatie</label>
        <input style={input} placeholder="ex: Spitalul Municipal Cluj" value={extDenumire} onChange={e => setExtDenumire(e.target.value)} />

        <label style={label}>Tip organizatie</label>
        <select style={{ ...input, marginBottom: 24 }} value={extOrgType} onChange={e => setExtOrgType(e.target.value as any)}>
          <option value="companie">Companie</option>
          <option value="spital">Spital</option>
          <option value="institutie_publica">Institutie publica</option>
        </select>

        <button onClick={createClient} disabled={extLoading} style={btn('#16a34a')}>
          {extLoading ? 'Se creeaza...' : 'Creeaza cont client'}
        </button>
        {extMsg && <p style={{ marginTop: 12, fontSize: 13, color: extMsg.startsWith('✅') ? '#166534' : '#991B1B' }}>{extMsg}</p>}
      </div>

    </div>
  );
}