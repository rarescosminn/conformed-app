'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Exercise = {
    id: string;
    data: string;          // YYYY-MM-DD
    zona: string;          // clădire/etaj/secție
    tip?: 'trimestrial' | 'anual' | 'ad-hoc';
    dovada?: string;       // foto/video
    pv?: string;           // proces-verbal
    note?: string;
    finalizat: boolean;    // se activează doar când există dovadă sau PV
    createdAt: string;
};

const STORAGE_KEY = 'psi-evacuare-v1';
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const card: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', padding: 16 };
const pill = (text: string, tone: 'gray' | 'blue' | 'green' | 'amber') => {
    const tones: Record<typeof tone, React.CSSProperties> = {
        gray: { border: '1px solid #e5e7eb', background: '#f8fafc', color: '#0f172a' },
        blue: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' },
        green: { border: '1px solid #bbf7d0', background: '#ecfdf5', color: '#047857' },
        amber: { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412' },
    };
    return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 12, ...tones[tone] }}>{text}</span>;
};

function loadAll(): Exercise[] {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
}
function saveAll(list: Exercise[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); window.dispatchEvent(new Event('storage')); } catch { }
}

export default function EvacuarePage() {
    const [items, setItems] = useState<Exercise[]>([]);
    const [q, setQ] = useState('');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [addOpen, setAddOpen] = useState(false);
    const [draft, setDraft] = useState<Partial<Exercise>>({ data: ymd(new Date()), zona: '', tip: 'trimestrial', note: '' });

    useEffect(() => {
        setItems(loadAll());
        const on = () => setItems(loadAll());
        window.addEventListener('storage', on);
        return () => window.removeEventListener('storage', on);
    }, []);

    const save = (next: Exercise[]) => { setItems(next); saveAll(next); };

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return items
            .filter(e => e.data.startsWith(String(year)) && (!s || e.zona.toLowerCase().includes(s)))
            .sort((a, b) => b.data.localeCompare(a.data) || b.createdAt.localeCompare(a.createdAt));
    }, [items, q, year]);

    const stats = useMemo(() => {
        const base = items.filter(e => e.data.startsWith(String(year)));
        const trimestrial = base.filter(e => e.tip === 'trimestrial').length;
        const anual = base.filter(e => e.tip === 'anual').length;
        const adHoc = base.filter(e => e.tip === 'ad-hoc').length;
        const finalizate = base.filter(e => e.finalizat).length;
        return { total: base.length, trimestrial, anual, adHoc, finalizate };
    }, [items, year]);

    const setProof = (id: string, f?: File | null) => {
        save(items.map(e => e.id === id ? { ...e, dovada: f?.name } : e));
    };
    const setPV = (id: string, f?: File | null) => {
        save(items.map(e => e.id === id ? { ...e, pv: f?.name } : e));
    };
    const finalize = (id: string) => {
        save(items.map(e => e.id === id ? { ...e, finalizat: !!(e.dovada || e.pv) } : e));
    };

    const exportPV = (e: Exercise) => {
        // simplu .doc compatibil
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Proces-verbal evacuare</title></head>
<body>
  <h2>Proces-verbal exercițiu de evacuare</h2>
  <p><b>Data:</b> ${e.data}</p>
  <p><b>Zonă:</b> ${e.zona}</p>
  <p><b>Tip:</b> ${e.tip}</p>
  <p><b>Note:</b> ${e.note || '—'}</p>
  <p><b>Dovadă:</b> ${e.dovada || '—'} | <b>PV atașat:</b> ${e.pv || '—'}</p>
  <hr/>
  <p style="font-size:12px;opacity:.8">Generat din aplicație – ${new Date().toLocaleString()}</p>
</body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `PV_Evacuare_${e.zona.replace(/\s+/g, '_')}_${e.data}.doc`; a.click();
        URL.revokeObjectURL(url);
    };

    const addItem = () => {
        if (!draft.data || !draft.zona) return;
        const it: Exercise = {
            id: 'EX' + Date.now(),
            data: draft.data!,
            zona: draft.zona!,
            tip: (draft.tip as any) || 'trimestrial',
            note: draft.note || '',
            dovada: undefined,
            pv: undefined,
            finalizat: false,
            createdAt: new Date().toISOString(),
        };
        save([it, ...items]);
        setAddOpen(false);
        setDraft({ data: ymd(new Date()), zona: '', tip: 'trimestrial', note: '' });
    };

    return (
        <div style={{ padding: 20 }}>
            {/* Înapoi */}
            <div style={{ marginBottom: 10 }}>
                <Link href="/ssm-psi" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', textDecoration: 'none', fontSize: 13 }}>
                    ← Înapoi
                </Link>
            </div>

            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Exerciții de evacuare (PSI)</h1>
            <p style={{ margin: '6px 0 18px', opacity: 0.8 }}>Planificare, dovezi foto/video, procese-verbale, recurență trimestrială/anuală.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
                {/* stânga */}
                <div>
                    {/* bară control */}
                    <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700 }}>Filtre</div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            An:
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))}
                                style={{ width: 110, padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                            />
                        </label>
                        <input
                            value={q} onChange={e => setQ(e.target.value)} placeholder="Caută zonă…"
                            style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb', minWidth: 260 }}
                        />
                        <button onClick={() => setAddOpen(true)} type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                            + Planifică exercițiu
                        </button>
                    </div>

                    {/* listă */}
                    <div style={{ display: 'grid', gap: 12 }}>
                        {filtered.map(e => (
                            <div key={e.id} style={card}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 700 }}>{e.zona}</div>
                                    <div style={{ display: 'inline-flex', gap: 6 }}>
                                        {pill(e.data, 'gray')}
                                        {pill(e.tip || '—', 'blue')}
                                        {e.finalizat ? pill('Finalizat', 'green') : pill('În curs', 'amber')}
                                    </div>
                                    <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
                                        Înregistrat: {new Date(e.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <div style={{ marginTop: 8, fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <span>Dovadă: <b>{e.dovada || '—'}</b></span>
                                    <span>Proces-verbal: <b>{e.pv || '—'}</b></span>
                                </div>

                                <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' as any }}>
                                        <input type="file" accept=".jpg,.jpeg,.png,.mp4,.mov,.pdf" style={{ display: 'none' }} onChange={ev => setProof(e.id, ev.target.files?.[0])} />
                                        {pill(e.dovada ? 'Schimbă dovadă' : 'Încarcă dovadă', 'gray')}
                                    </label>

                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' as any }}>
                                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={ev => setPV(e.id, ev.target.files?.[0])} />
                                        {pill(e.pv ? 'Schimbă PV' : 'Încarcă PV', 'gray')}
                                    </label>

                                    <button
                                        onClick={() => finalize(e.id)}
                                        disabled={e.finalizat || !(e.dovada || e.pv)}
                                        type="button"
                                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: e.finalizat || !(e.dovada || e.pv) ? '#f1f5f9' : '#fff', fontSize: 13, cursor: e.finalizat || !(e.dovada || e.pv) ? 'not-allowed' : 'pointer' }}
                                    >
                                        Finalizează
                                    </button>

                                    <button
                                        onClick={() => exportPV(e)}
                                        disabled={!e.finalizat}
                                        type="button"
                                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: !e.finalizat ? '#f1f5f9' : '#fff', fontSize: 13, cursor: !e.finalizat ? 'not-allowed' : 'pointer' }}
                                    >
                                        Descarcă PV
                                    </button>
                                </div>

                                {e.note && <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>Note: {e.note}</div>}
                            </div>
                        ))}
                        {filtered.length === 0 && <div style={{ ...card, opacity: 0.75 }}>Nu există exerciții pentru anul selectat.</div>}
                    </div>
                </div>

                {/* dreapta — raport anual */}
                <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'grid', gap: 12 }}>
                    <div style={{ ...card, border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Raport anual</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>An: <strong>{year}</strong></div>
                            <div>Total exerciții: <strong>{stats.total}</strong></div>
                            <div>{pill('Trimestrial', 'blue')} <strong>{stats.trimestrial}</strong></div>
                            <div>{pill('Anual', 'blue')} <strong>{stats.anual}</strong></div>
                            <div>{pill('Ad-hoc', 'gray')} <strong>{stats.adHoc}</strong></div>
                            <div>{pill('Finalizate', 'green')} <strong>{stats.finalizate}</strong></div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* modal adăugare */}
            {addOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
                    <div style={{ width: 'min(720px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                            <b style={{ color: '#1e3a8a' }}>Planifică exercițiu evacuare</b>
                            <button onClick={() => setAddOpen(false)} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>Data *
                                    <input type="date" value={draft.data || ymd(new Date())} onChange={e => setDraft(d => ({ ...d, data: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>Tip
                                    <select value={(draft.tip as any) || 'trimestrial'} onChange={e => setDraft(d => ({ ...d, tip: e.target.value as any }))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                        <option value="trimestrial">Trimestrial</option>
                                        <option value="anual">Anual</option>
                                        <option value="ad-hoc">Ad-hoc</option>
                                    </select>
                                </label>
                            </div>
                            <label style={{ display: 'grid', gap: 6 }}>Zonă / Locație *
                                <input value={draft.zona || ''} onChange={e => setDraft(d => ({ ...d, zona: e.target.value }))} placeholder="ex: Clădire principală / Etaj 2 / Secția X" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>Note
                                <textarea value={draft.note || ''} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} rows={3} placeholder="Detalii organizare, scenariu, participanți…" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', resize: 'vertical' }} />
                            </label>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setAddOpen(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Anulează</button>
                                <button type="button" onClick={addItem} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Salvează</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
