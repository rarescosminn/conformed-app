'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { importCSVRows, listTrainings, percentCompliance, TrainingRow, upsertTraining } from '@/lib/ssm/store';

const chip = (c: string) => ({ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, color: c === 'ok' ? '#166534' : c === 'warn' ? '#92400e' : '#111827' });

export default function Page() {
    const [rows, setRows] = useState<TrainingRow[]>([]);
    const [y, setY] = useState(new Date().getFullYear());
    const [m, setM] = useState<number | ''>('');
    useEffect(() => { const r = () => setRows(listTrainings()); r(); window.addEventListener('ssmpsi-change', r); return () => window.removeEventListener('ssmpsi-change', r); }, []);
    const filtered = useMemo(() => rows.filter(t => {
        const d = new Date(t.date); return d.getFullYear() === y && (m === '' || d.getMonth() === m);
    }), [rows, y, m]);

    const pct = percentCompliance({ y, m: m === '' ? undefined : m });

    return (
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Instruiri</h1>
                <div style={{ margin: '10px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label> An:
                        <input type="number" value={y} onChange={e => setY(parseInt(e.target.value || String(new Date().getFullYear()), 10))} style={{ marginLeft: 6, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </label>
                    <label> Luna:
                        <select value={m} onChange={e => setM(e.target.value === '' ? '' : parseInt(e.target.value))} style={{ marginLeft: 6, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <option value="">— toate —</option>
                            {['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((n, i) => <option key={i} value={i}>{n}</option>)}
                        </select>
                    </label>
                    <span style={{ ...chip('ok') }}>Conformare: <b style={{ marginLeft: 6 }}>{pct}%</b></span>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    {filtered.map(t => <Row key={t.id} row={t} />)}
                    {!filtered.length && <div style={{ opacity: 0.7 }}>Nu există instruiri pentru filtrul curent.</div>}
                </div>
            </div>

            {/* Sidebar */}
            <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'grid', gap: 14 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, background: '#fff' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Import plan HR (CSV)</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>Format: <code>Nume;Departament;Titlu instruire;Data(YYYY-MM-DD)</code></div>
                    <input type="file" accept=".csv" onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const r = new FileReader(); r.onload = () => { importCSVRows(String(r.result || '')); };
                        r.readAsText(f);
                    }} />
                </div>

                <div style={{ border: '1px solid #bfdbfe', borderRadius: 16, padding: 16, background: 'linear-gradient(180deg,#eff6ff,#f8fbff)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>Descarcă listă prezență</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>Apasă pe “Listă prezență” pe rândul unei instruiri pentru a tipări foaia cu semnături.</div>
                </div>
            </aside>
        </div>
    );
}

function Row({ row }: { row: TrainingRow }) {
    const [me, setMe] = useState(row);
    useEffect(() => setMe(row), [row]);

    const status = me.finalized ? 'Finalizată' : (me.proofUrl ? 'Dovadă încărcată' : 'Planificată');

    const downloadPresence = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Lista prezență</title></head><body style="font-family:system-ui">
      <h3>Lista prezență — ${me.title}</h3>
      <div><b>Data:</b> ${me.date} &nbsp; <b>Departament:</b> ${me.department}</div>
      <ol style="margin-top:12px;">
        ${me.planned.map(n => `<li style="margin:6px 0;display:flex;gap:12px;align-items:center;"><span style="min-width:280px;display:inline-block">${n}</span><span style="flex:1;border-bottom:1px dashed #888;height:16px;"></span></li>`).join('')}
      </ol>
      <script>window.print()</script>
    </body></html>`);
        w.document.close();
    };

    const onProof = (file: File) => {
        const url = URL.createObjectURL(file);
        const updated: TrainingRow = { ...me, proofUrl: url };
        setMe(updated); upsertTraining(updated);
    };

    const toggleMotivated = (name: string) => {
        const set = new Set(me.absentsMotivated);
        set.has(name) ? set.delete(name) : set.add(name);
        const updated = { ...me, absentsMotivated: Array.from(set) };
        setMe(updated); upsertTraining(updated);
    };

    const finalize = () => {
        const updated = { ...me, finalized: true, present: me.planned.filter(p => !me.absentsMotivated.includes(p)) };
        setMe(updated); upsertTraining(updated);
    };

    const missingProof = !me.proofUrl;

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>{me.title}</div>
                <span style={{ marginLeft: 'auto', ...chip(me.finalized ? 'ok' : missingProof ? '' : 'warn') }}>{status}</span>
                <span style={{ ...chip('') }}>Data: {me.date}</span>
                <span style={{ ...chip('') }}>Dep.: {me.department}</span>
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={downloadPresence} style={btn()}>Listă prezență</button>
                <label style={btn()}>
                    Încarcă dovadă
                    <input type="file" accept="application/pdf,image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onProof(f); }} style={{ display: 'none' }} />
                </label>
                <button onClick={finalize} disabled={missingProof} title={missingProof ? 'Necesită dovadă încărcată' : ''} style={btn(undefined, missingProof)}>
                    Finalizează instruire
                </button>
            </div>

            {!!me.planned.length && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Absenți motivați (nu scad conformarea):</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {me.planned.map(n => (
                            <label key={n} style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: 999 }}>
                                <input type="checkbox" checked={me.absentsMotivated.includes(n)} onChange={() => toggleMotivated(n)} /> {n}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
function btn(outline?: boolean, disabled?: boolean): React.CSSProperties {
    return {
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
        border: outline ? '1px solid #e5e7eb' : '1px solid #bfdbfe', background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1
    };
}
