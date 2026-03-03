'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const CATEGORII = [
  'Spital Universitar',
  'Spital Clinic',
  'Spital Județean',
  'Spital Municipal',
  'Spital Orășenesc',
  'Spital Privat',
  'Ambulator / SDZ',
];

export default function Onboarding() {
  const [categorie, setCategorie] = React.useState('');
  const [denumire, setDenumire] = React.useState('');
  const [descriere, setDescriere] = React.useState('');
  const [paturi, setPaturi] = React.useState('');
  const [multilocatie, setMultilocatie] = React.useState(false);
  const [adresa, setAdresa] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    if (!categorie) return setMessage('Selectați categoria spitalului.');
    if (!denumire) return setMessage('Introduceți denumirea spitalului.');
    if (!paturi || Number(paturi) < 1) return setMessage('Introduceți numărul de paturi.');
    if (!adresa) return setMessage('Introduceți adresa.');

    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage('Sesiune expirată. Relogați-vă.'); setLoading(false); return; }

    const { error } = await supabase.from('onboarding').upsert({
      user_id: user.id,
      spital_categorie: categorie,
      spital_denumire: denumire,
      spital_descriere: descriere,
      nr_paturi: Number(paturi),
      multilocatie,
      adresa,
    });

    setLoading(false);
    if (error) setMessage(error.message);
    else router.replace('/dashboard');
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '40px 16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        <h1 className="h1" style={{ marginBottom: 6 }}>Configurare inițială</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
          Completați datele spitalului pentru a activa platforma.
        </p>

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Categorie spital *</label>
        <select className="input" value={categorie} onChange={e => setCategorie(e.target.value)} style={{ marginBottom: 12 }}>
          <option value="">— Selectează —</option>
          {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Denumire spital *</label>
        <input className="input" placeholder="ex. Spitalul Județean de Urgență Bacău" value={denumire} onChange={e => setDenumire(e.target.value)} style={{ marginBottom: 12 }} />

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Descriere</label>
        <textarea className="input" placeholder="Scurtă descriere a spitalului..." value={descriere} onChange={e => setDescriere(e.target.value)} style={{ marginBottom: 12, minHeight: 80, resize: 'vertical' }} />

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Număr paturi *</label>
        <input className="input" type="number" min={1} placeholder="ex. 350" value={paturi} onChange={e => setPaturi(e.target.value)} style={{ marginBottom: 12 }} />

        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>Adresă *</label>
        <input className="input" placeholder="Strada, numărul, orașul" value={adresa} onChange={e => setAdresa(e.target.value)} style={{ marginBottom: 12 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={multilocatie} onChange={e => setMultilocatie(e.target.checked)} />
          Spital cu mai multe locații (multi-locație)
        </label>

        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Se salvează...' : 'Finalizează configurarea'}
        </button>

        {message && <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
}