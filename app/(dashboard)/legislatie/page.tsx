'use client';
import Link from 'next/link';
import s from './legislatie.module.css';
import { useOrg } from '@/lib/context/OrgContext';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Card = { href: string; label: string; desc: string };

type LegeProprie = {
  id: string;
  numar: string;
  titlu: string;
  categorie: string;
  rezumat?: string;
  data_publicare?: string;
  status: 'in_vigoare' | 'modificat' | 'abrogat';
  sursa?: string;
  org_id: string;
  created_at: string;
};

const CARDS_SPITAL: Card[] = [
  { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie sanitara, pacienti, HR, fiscal, contabil, achizitii.' },
  { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
  { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
  { href: '/legislatie/medicale', label: 'Medicale', desc: 'Ordine MS, epidemiologie, dispozitive, transfuzii, sterilizare.' },
  { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'SCIM, etica, avertizori, ANI.' },
  { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, DES/telemedicina, arhivare.' },
  { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Civil si comercial, malpraxis, PI, anti-discriminare.' },
];

const CARDS_COMPANIE: Card[] = [
  { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie HR, fiscal, contabil, achizitii, comercial.' },
  { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
  { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
  { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, GDPR, arhivare.' },
  { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Drept comercial, contracte, PI, anti-discriminare.' },
  { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'Guvernanta corporativa, etica, avertizori, ANI.' },
];

const CARDS_INSTITUTIE: Card[] = [
  { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie administratie publica, HR, fiscal, contabil, achizitii publice.' },
  { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
  { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
  { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, GDPR, arhivare electronica.' },
  { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Drept administrativ, contencios, PI, anti-discriminare.' },
  { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'SCIM, transparenta, etica, avertizori, ANI.' },
];

const STATUS_LABELS = { in_vigoare: 'În vigoare', modificat: 'Modificat', abrogat: 'Abrogat' };
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  in_vigoare: { bg: '#F0FDF4', color: '#166534' },
  modificat: { bg: '#FFFBEB', color: '#92400E' },
  abrogat: { bg: '#FEF2F2', color: '#991B1B' },
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
};
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, color: '#374151',
};

export default function LegislatieHub() {
  const { orgType } = useOrg();
  const [legi, setLegi] = useState<LegeProprie[]>([]);
  const [orgId, setOrgId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    numar: '', titlu: '', categorie: 'generale',
    rezumat: '', data_publicare: '', status: 'in_vigoare' as LegeProprie['status'], sursa: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const cards =
    orgType === 'spital' ? CARDS_SPITAL :
    orgType === 'institutie_publica' ? CARDS_INSTITUTIE :
    CARDS_COMPANIE;

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase.from('organizations').select('id').eq('user_id', user.id).maybeSingle();
      if (!org) return;
      setOrgId(org.id);
      const { data } = await supabase.from('legislatie').select('*').eq('org_id', org.id).order('created_at', { ascending: false });
      setLegi(data ?? []);
    }
    load();
  }, []);

  async function addLege() {
    if (!form.numar.trim() || !form.titlu.trim()) { setMsg('Numărul și titlul sunt obligatorii.'); return; }
    setLoading(true); setMsg('');
    const { data, error } = await supabase.from('legislatie').insert({
      org_id: orgId,
      numar: form.numar,
      titlu: form.titlu,
      categorie: form.categorie,
      rezumat: form.rezumat || null,
      data_publicare: form.data_publicare || null,
      status: form.status,
      sursa: form.sursa || null,
    }).select().single();
    if (error) { setMsg('Eroare la salvare: ' + error.message); }
    else { setLegi(l => [data, ...l]); setShowForm(false); setForm({ numar: '', titlu: '', categorie: 'generale', rezumat: '', data_publicare: '', status: 'in_vigoare', sursa: '' }); }
    setLoading(false);
  }

  async function deleteLege(id: string) {
    if (!confirm('Ștergi această lege?')) return;
    await supabase.from('legislatie').delete().eq('id', id);
    setLegi(l => l.filter(x => x.id !== id));
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <Link href="/dashboard" className={s.back}>← Înapoi</Link>
        <h1 className={s.h1}>Legislație</h1>
      </div>

      {/* Categorii predefinite */}
      <div className={s.grid} style={{ display: 'grid' }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={s.card}>
            <div className={s.title}>{c.label}</div>
            <p className={s.desc}>{c.desc}</p>
            <div className={s.open}>Deschide →</div>
          </Link>
        ))}
      </div>

      {/* Secțiunea legi proprii */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Legi adăugate manual</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
              Acte normative specifice organizației tale, adăugate manual.
            </p>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            + Adaugă lege
          </button>
        </div>

        {/* Formular adăugare */}
        {showForm && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Lege nouă</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Număr act *</label>
                  <input style={inp} placeholder="ex: Legea 319/2006" value={form.numar} onChange={e => setForm(f => ({ ...f, numar: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Categorie</label>
                  <select style={inp} value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                    <option value="generale">Generale</option>
                    <option value="ssm-psi">SSM-PSI</option>
                    <option value="mediu">Mediu și sustenabilitate</option>
                    <option value="medicale">Medicale</option>
                    <option value="it">IT și cibernetic</option>
                    <option value="juridic">Juridic și administrativ</option>
                    <option value="guvernanta">Guvernanță și etică</option>
                    <option value="altele">Altele</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Titlu *</label>
                <input style={inp} placeholder="ex: Legea securității și sănătății în muncă" value={form.titlu} onChange={e => setForm(f => ({ ...f, titlu: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Rezumat</label>
                <textarea style={{ ...inp, height: 70, resize: 'none' } as React.CSSProperties} placeholder="Scurtă descriere a actului normativ..." value={form.rezumat} onChange={e => setForm(f => ({ ...f, rezumat: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Data publicării</label>
                  <input style={inp} type="date" value={form.data_publicare} onChange={e => setForm(f => ({ ...f, data_publicare: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LegeProprie['status'] }))}>
                    <option value="in_vigoare">În vigoare</option>
                    <option value="modificat">Modificat</option>
                    <option value="abrogat">Abrogat</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Sursă / URL</label>
                  <input style={inp} placeholder="ex: legislatie.just.ro" value={form.sursa} onChange={e => setForm(f => ({ ...f, sursa: e.target.value }))} />
                </div>
              </div>
              {msg && <div style={{ color: '#991B1B', fontSize: 13 }}>{msg}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={addLege} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {loading ? 'Se salvează...' : 'Salvează'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Anulează
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista legi proprii */}
        {legi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 24px', color: '#9CA3AF', border: '1.5px dashed #e5e7eb', borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nicio lege adăugată manual</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Apasă "+ Adaugă lege" pentru a adăuga primul act normativ specific organizației.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {legi.map(lege => (
              <div key={lege.id} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{lege.numar}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_COLORS[lege.status].bg, color: STATUS_COLORS[lege.status].color }}>
                        {STATUS_LABELS[lege.status]}
                      </span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }}>
                        {lege.categorie}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{lege.titlu}</div>
                    {lege.rezumat && <div style={{ fontSize: 13, color: '#6B7280' }}>{lege.rezumat}</div>}
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, display: 'flex', gap: 12 }}>
                      {lege.data_publicare && <span>Publicat: {new Date(lege.data_publicare).toLocaleDateString('ro-RO')}</span>}
                      {lege.sursa && <a href={lege.sursa.startsWith('http') ? lege.sursa : `https://${lege.sursa}`} target="_blank" rel="noreferrer" style={{ color: '#4F46E5' }}>Sursă →</a>}
                    </div>
                  </div>
                  <button onClick={() => deleteLege(lege.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}