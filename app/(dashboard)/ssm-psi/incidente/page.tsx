'use client';
import React, { useEffect, useState } from 'react';
import { Incident, listIncidents, upsertIncident } from '@/lib/ssm/store';

export default function Page() {
    const [list, setList] = useState<Incident[]>([]);
    useEffect(() => { const r = () => setList(listIncidents()); r(); window.addEventListener('ssmpsi-change', r); return () => window.removeEventListener('ssmpsi-change', r); }, []);
    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Incidente / Accidente</h1>
            <div style={{ margin: '10px 0' }}><AddEdit onSave={i => upsertIncident(i)} /></div>

            <div style={{ display: 'grid', gap: 12 }}>
                {list.map(i => <Row key={i.id} it={i} />)}
                {!list.length && <div style={{ opacity: 0.7 }}>Nu există înregistrări.</div>}
            </div>
        </div>
    );
}

function Row({ it }: { it: Incident }) {
    const [me, setMe] = useState(it);
    const save = (x: Incident) => { setMe(x); upsertIncident(x); };
    const chip = (c: string) => ({ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, color: c });

    const exportITM = () => {
        const w = window.open('', '_blank'); if (!w) return;
        w.document.write(`<html><head><title>Fișă ITM</title></head><body style="font-family:system-ui">
      <h3>Fișă raport Incident/Accident</h3>
      <p><b>Data:</b> ${me.date}<br/>
      <b>Locație:</b> ${me.location}<br/>
      <b>Persoană afectată:</b> ${me.person}<br/>
      <b>Descriere:</b> ${me.description}<br/>
      <b>Status:</b> ${me.status}<br/>
      <b>Clasificare:</b> ${me.classification || '—'}<br/>
      <b>Validare șef secție:</b> ${me.managerName || '—'}</p>
      <script>window.print()</script></body></html>`);
        w.document.close();
    };

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>Incident #{me.id.slice(0, 6)}</div>
                <span style={{ ...chip('#1f2937') }}>Data: {me.date}</span>
                <span style={{ ...chip('#1f2937') }}>Loc: {me.location}</span>
                <span style={{ ...chip('#1f2937') }}>Persoană: {me.person}</span>
                <span style={{ marginLeft: 'auto', ...chip('#1e3a8a') }}>{me.status}</span>
            </div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{me.description}</div>

            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {me.status === 'raportat' && (
                    <button onClick={() => save({ ...me, status: 'validat_sef', managerName: prompt('Nume șef secție care validează?') || '' })} style={btn()}>Validează șef secție</button>
                )}
                {me.status !== 'clasificat' && (
                    <button onClick={() => {
                        const c = prompt('Clasificare: incident / accident_usor / grav / mortal') as Incident['classification'] | null;
                        if (!c) return; save({ ...me, status: 'clasificat', classification: c });
                    }} style={btn()}>Clasifică</button>
                )}
                <button onClick={exportITM} style={btn()}>Export fișă ITM</button>
            </div>
        </div>
    );
}

function AddEdit({ onSave }: { onSave: (i: Incident) => void }) {
    const [f, setF] = useState<Incident>({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), location: '', person: '', description: '', status: 'raportat', createdAt: new Date().toISOString() });
    const inp = (w = '100%') => ({ width: w, padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' });
    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, background: '#fff', display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Formular inițial</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label>Data <input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} style={inp()} /></label>
                <label>Locație <input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} style={inp()} /></label>
            </div>
            <label>Persoană afectată <input value={f.person} onChange={e => setF({ ...f, person: e.target.value })} style={inp()} /></label>
            <label>Descriere <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} style={{ ...inp(), minHeight: 80 as any }} /></label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setF({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), location: '', person: '', description: '', status: 'raportat', createdAt: new Date().toISOString() })} style={btn(true)}>Curăță</button>
                <button onClick={() => { onSave(f); setF({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), location: '', person: '', description: '', status: 'raportat', createdAt: new Date().toISOString() }); }} style={btn()}>Salvează</button>
            </div>
        </div>
    );
}
function btn(outline?: boolean): React.CSSProperties { return { padding: '8px 12px', borderRadius: 10, border: outline ? '1px solid #e5e7eb' : '1px solid #bfdbfe', background: '#fff', cursor: 'pointer' }; }
