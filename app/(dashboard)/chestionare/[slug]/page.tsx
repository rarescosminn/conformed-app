'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const SLUG_LABELS: Record<string, string> = {
  'ati': 'ATI', 'bloc-operator': 'Bloc operator', 'boli-infectioase': 'Boli infecțioase',
  'cardiologie': 'Cardiologie', 'chirurgie-generala': 'Chirurgie generală',
  'calitate-iso9001': 'Calitate (ISO 9001)', 'mediu-iso14001': 'Mediu (ISO 14001)',
  'ssm-iso45001': 'SSM (ISO 45001)', 'securitate-informatii': 'Securitate informații (ISO 27001)',
  'continuitate-afaceri': 'Continuitate afaceri (ISO 22301)', 'energie-iso50001': 'Energie (ISO 50001)',
  'responsabilitate-sociala': 'Responsabilitate socială (SA8000)', 'esg': 'ESG',
  'guvernanta-corporativa': 'Guvernanță corporativă', 'transparenta-anticoruptie': 'Transparență și anticorupție',
  'upu': 'UPU', 'pediatrie': 'Pediatrie', 'oncologie': 'Oncologie',
  'neurologie': 'Neurologie', 'neonatologie': 'Neonatologie', 'nefrologie': 'Nefrologie',
  'hematologie': 'Hematologie', 'gastroenterologie': 'Gastroenterologie',
  'endocrinologie': 'Endocrinologie', 'dermatologie': 'Dermatologie',
  'diabet-nutritie': 'Diabet, nutriție și boli metabolice', 'farmacie': 'Farmacie',
  'laborator': 'Laborator', 'oftalmologie': 'Oftalmologie', 'orl': 'ORL',
  'ortopedie': 'Ortopedie', 'pneumologie': 'Pneumologie', 'psihiatrie': 'Psihiatrie',
  'radiologie-imagistica': 'Radiologie–Imagistică', 'recuperare-medicala': 'Recuperare medicală',
  'obstetrica-ginecologie': 'Obstetrică–Ginecologie', 'cssd-sterilizare': 'CSSD/CPIVD (Sterilizare)',
};

type Intrebare = {
  id: string;
  text: string;
  tip: 'da_nu' | 'nota' | 'text';
  raspuns?: string | number;
};

type Chestionar = {
  id: string;
  titlu: string;
  slug: string;
  org_id: string;
  intrebari: Intrebare[];
  created_at: string;
};

type Raspuns = {
  id: string;
  chestionar_id: string;
  org_id: string;
  raspunsuri: Record<string, string | number>;
  scor?: number;
  completat_la: string;
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
};
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, color: '#374151',
};

export default function ChestionarSlugPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';
  const label = SLUG_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [orgId, setOrgId] = useState('');
  const [chestionare, setChestionare] = useState<Chestionar[]>([]);
  const [raspunsuri, setRaspunsuri] = useState<Raspuns[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChestionar, setActiveChestionar] = useState<Chestionar | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIntrebari, setNewIntrebari] = useState<Intrebare[]>([
    { id: '1', text: '', tip: 'da_nu' },
  ]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase.from('organizations').select('id').eq('user_id', user.id).maybeSingle();
      if (!org) return;
      setOrgId(org.id);

      const { data: ch } = await supabase.from('chestionare_generic').select('*').eq('org_id', org.id).eq('slug', slug).order('created_at', { ascending: false });
      setChestionare(ch ?? []);

      const { data: r } = await supabase.from('chestionare_raspunsuri').select('*').eq('org_id', org.id).order('completat_la', { ascending: false });
      setRaspunsuri(r ?? []);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function saveChestionar() {
    if (!newTitle.trim()) { setMsg('Titlul este obligatoriu.'); return; }
    if (newIntrebari.some(i => !i.text.trim())) { setMsg('Completează toate întrebările.'); return; }
    setSaving(true); setMsg('');
    const { data, error } = await supabase.from('chestionare_generic').insert({
      org_id: orgId,
      slug,
      titlu: newTitle,
      intrebari: newIntrebari,
    }).select().single();
    if (error) { setMsg('Eroare: ' + error.message); }
    else {
      setChestionare(c => [data, ...c]);
      setShowCreate(false);
      setNewTitle('');
      setNewIntrebari([{ id: '1', text: '', tip: 'da_nu' }]);
    }
    setSaving(false);
  }

  async function submitRaspuns(ch: Chestionar) {
    setSaving(true);
    const scor = ch.intrebari.reduce((acc, i) => {
      if (i.tip === 'da_nu') return acc + (answers[i.id] === 'da' ? 1 : 0);
      if (i.tip === 'nota') return acc + (Number(answers[i.id]) || 0) / 10;
      return acc;
    }, 0);
    const scorPct = ch.intrebari.length > 0 ? Math.round((scor / ch.intrebari.length) * 100) : 0;

    const { data, error } = await supabase.from('chestionare_raspunsuri').insert({
      org_id: orgId,
      chestionar_id: ch.id,
      raspunsuri: answers,
      scor: scorPct,
    }).select().single();

    if (!error && data) {
      setRaspunsuri(r => [data, ...r]);
    }
    setActiveChestionar(null);
    setAnswers({});
    setSaving(false);
  }

  function addIntrebare() {
    setNewIntrebari(i => [...i, { id: String(Date.now()), text: '', tip: 'da_nu' }]);
  }

  function deleteIntrebare(id: string) {
    setNewIntrebari(i => i.filter(x => x.id !== id));
  }

  async function deleteChestionar(id: string) {
    if (!confirm('Ștergi acest chestionar?')) return;
    await supabase.from('chestionare_generic').delete().eq('id', id);
    setChestionare(c => c.filter(x => x.id !== id));
  }

  const raspunsuriPentruSlug = raspunsuri.filter(r =>
    chestionare.some(c => c.id === r.chestionar_id)
  );

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Link href="/chestionare" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>← Chestionare</Link>
        <span style={{ opacity: 0.3 }}>/</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{label}</h1>
          <div style={{ fontSize: 13, color: '#6B7280' }}>{chestionare.length} chestionare · {raspunsuriPentruSlug.length} completări</div>
        </div>
        <button onClick={() => setShowCreate(s => !s)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Chestionar nou
        </button>
      </div>

      {/* Formular creare chestionar */}
      {showCreate && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Chestionar nou — {label}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Titlu chestionar *</label>
              <input style={inp} placeholder="ex: Audit intern ISO 9001 - Q1 2026" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Întrebări *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {newIntrebari.map((i, idx) => (
                  <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                    <input style={inp} placeholder={`Întrebarea ${idx + 1}...`} value={i.text} onChange={e => setNewIntrebari(arr => arr.map(x => x.id === i.id ? { ...x, text: e.target.value } : x))} />
                    <select style={{ ...inp, width: 'auto' }} value={i.tip} onChange={e => setNewIntrebari(arr => arr.map(x => x.id === i.id ? { ...x, tip: e.target.value as Intrebare['tip'] } : x))}>
                      <option value="da_nu">Da / Nu</option>
                      <option value="nota">Notă (1-10)</option>
                      <option value="text">Text liber</option>
                    </select>
                    <button onClick={() => deleteIntrebare(i.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addIntrebare} style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + Adaugă întrebare
              </button>
            </div>

            {msg && <div style={{ color: '#991B1B', fontSize: 13 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveChestionar} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Se salvează...' : 'Salvează chestionar'}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chestionar activ - completare */}
      {activeChestionar && (
        <div style={{ background: '#fff', border: '1px solid #C7D2FE', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Completează: {activeChestionar.titlu}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeChestionar.intrebari.map((i, idx) => (
              <div key={i.id}>
                <label style={lbl}>{idx + 1}. {i.text}</label>
                {i.tip === 'da_nu' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['da', 'nu'].map(v => (
                      <button key={v} onClick={() => setAnswers(a => ({ ...a, [i.id]: v }))} style={{ padding: '8px 20px', borderRadius: 8, border: answers[i.id] === v ? '2px solid #4F46E5' : '1px solid #e5e7eb', background: answers[i.id] === v ? '#EEF2FF' : '#fff', color: answers[i.id] === v ? '#4F46E5' : '#374151', fontWeight: 600, cursor: 'pointer' }}>
                        {v === 'da' ? 'Da ✓' : 'Nu ✗'}
                      </button>
                    ))}
                  </div>
                )}
                {i.tip === 'nota' && (
                  <input type="number" min={1} max={10} style={{ ...inp, maxWidth: 120 }} placeholder="1-10" value={answers[i.id] ?? ''} onChange={e => setAnswers(a => ({ ...a, [i.id]: Number(e.target.value) }))} />
                )}
                {i.tip === 'text' && (
                  <textarea style={{ ...inp, height: 70, resize: 'none' } as React.CSSProperties} placeholder="Răspuns liber..." value={answers[i.id] ?? ''} onChange={e => setAnswers(a => ({ ...a, [i.id]: e.target.value }))} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => submitRaspuns(activeChestionar)} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Se trimite...' : 'Trimite răspunsuri'}
              </button>
              <button onClick={() => { setActiveChestionar(null); setAnswers({}); }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista chestionare */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Se încarcă...</div>
      ) : chestionare.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', border: '1.5px dashed #e5e7eb', borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Niciun chestionar pentru {label}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Apasă "+ Chestionar nou" pentru a crea primul chestionar.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chestionare.map(ch => {
            const rCh = raspunsuri.filter(r => r.chestionar_id === ch.id);
            const ultimul = rCh[0];
            return (
              <div key={ch.id} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{ch.titlu}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
                      <span>{ch.intrebari?.length ?? 0} întrebări</span>
                      <span>{rCh.length} completări</span>
                      {ultimul && <span>Ultimul scor: <strong style={{ color: '#4F46E5' }}>{ultimul.scor}%</strong></span>}
                      <span>Creat: {new Date(ch.created_at).toLocaleDateString('ro-RO')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setActiveChestionar(ch); setAnswers({}); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Completează
                    </button>
                    <button onClick={() => deleteChestionar(ch.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Șterge
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}