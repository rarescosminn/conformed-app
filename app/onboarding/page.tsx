'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const ORG_TYPES = [
  { value: 'spital', label: 'Spital', placeholder: 'ex. Spitalul Județean de Urgență Bacău' },
  { value: 'institutie_publica', label: 'Instituție Publică', placeholder: 'ex. Primăria Municipiului Bacău' },
  { value: 'companie', label: 'Companie Privată', placeholder: 'ex. SC Exemplu SRL' },
];

const CATEGORII: Record<string, string[]> = {
  spital: ['Spital Universitar', 'Spital Clinic', 'Spital Județean', 'Spital Municipal', 'Spital Orășenesc', 'Spital Privat', 'Ambulator / SDZ'],
  institutie_publica: ['Primărie', 'Consiliu Județean', 'Școală / Liceu', 'Universitate', 'Spital Public', 'Altă instituție publică'],
  companie: ['Producție', 'Servicii', 'Comerț', 'Construcții', 'IT & Tehnologie', 'Sănătate Privată', 'Altele'],
};

export default function Onboarding() {
  const [orgType, setOrgType] = React.useState('');
  const [categorie, setCategorie] = React.useState('');
  const [denumire, setDenumire] = React.useState('');
  const [descriere, setDescriere] = React.useState('');
  const [nrAngajati, setNrAngajati] = React.useState('');
  const [cui, setCui] = React.useState('');
  const [adresa, setAdresa] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const selectedType = ORG_TYPES.find(t => t.value === orgType);

  async function submit() {
    if (!orgType) return setMessage('Selectați tipul organizației.');
    if (!categorie) return setMessage('Selectați categoria.');
    if (!denumire) return setMessage('Introduceți denumirea.');
    if (!adresa) return setMessage('Introduceți adresa.');

    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage('Sesiune expirată. Relogați-vă.'); setLoading(false); return; }

    const { error } = await supabase.from('organizations').upsert({
      user_id: user.id,
      org_type: orgType,
      denumire,
      descriere,
      nr_angajati: nrAngajati ? Number(nrAngajati) : null,
      cui,
      adresa,
    });

    setLoading(false);
    if (error) setMessage(error.message);
    else router.replace('/dashboard');
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '40px 16px', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>Configurare inițială</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Completați datele organizației pentru a activa platforma.</p>
        </div>

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>Tip organizație *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {ORG_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => { setOrgType(t.value); setCategorie(''); }}
              style={{ padding: '10px 8px', borderRadius: 10, border: orgType === t.value ? '2px solid #4F46E5' : '1.5px solid #e5e7eb', background: orgType === t.value ? '#EEF2FF' : '#fff', color: orgType === t.value ? '#4F46E5' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {orgType && (
          <>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Categorie *</label>
            <select className="input" value={categorie} onChange={e => setCategorie(e.target.value)} style={{ marginBottom: 16, width: '100%' }}>
              <option value="">— Selectează —</option>
              {CATEGORII[orgType].map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Denumire *</label>
            <input className="input" placeholder={selectedType?.placeholder} value={denumire} onChange={e => setDenumire(e.target.value)} style={{ marginBottom: 16, width: '100%' }} />

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Descriere</label>
            <textarea className="input" placeholder="Scurtă descriere..." value={descriere} onChange={e => setDescriere(e.target.value)} style={{ marginBottom: 16, minHeight: 80, resize: 'vertical', width: '100%' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Număr angajați</label>
                <input className="input" type="number" min={1} placeholder="ex. 50" value={nrAngajati} onChange={e => setNrAngajati(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>CUI / CIF</label>
                <input className="input" placeholder="ex. RO12345678" value={cui} onChange={e => setCui(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Adresă *</label>
            <input className="input" placeholder="Strada, numărul, orașul" value={adresa} onChange={e => setAdresa(e.target.value)} style={{ marginBottom: 24, width: '100%' }} />
          </>
        )}

        <button onClick={submit} disabled={loading || !orgType}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: !orgType ? '#e5e7eb' : '#4F46E5', color: !orgType ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: !orgType ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Se salvează...' : 'Finalizează configurarea'}
        </button>

        {message && <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
}