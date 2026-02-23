'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Audit = {
    id: string;
    data: string;              // ISO yyyy-mm-dd
    tip: 'intern' | 'extern' | 'inspectie';
    checklistUrl?: string;
    neconformitatiDeschise?: number;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };
const row: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::audite';

export default function Page() {
    const [list, setList] = useState<Audit[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Audit>({
        id: '',
        data: '',
        tip: 'intern',
        checklistUrl: '',
        neconformitatiDeschise: 0,
    });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const stats = useMemo(() => {
        const viitoare = list.filter(a => new Date(a.data).getTime() >= Date.now()).length;
        const nc = list.reduce((acc, a) => acc + (a.neconformitatiDeschise || 0), 0);
        return { viitoare, nc };
    }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form, id: crypto.randomUUID(), neconformitatiDeschise: Number(form.neconformitatiDeschise || 0) };
        setList([payload, ...list]);
        notifyUpdate('audite');
        setShowForm(false);
        setForm({ id: '', data: '', tip: 'intern', checklistUrl: '', neconformitatiDeschise: 0 });
    };

    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('audite');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Audit / controale</h1>
            <p style={sub}>Programare, checklist, neconformități + acțiuni corective.</p>

            <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex,', gap: 24, fontSize: 13 }}>
                    <div>Programări viitoare: <b>{stats.viitoare}</b></div>
                    <div>Neconformități deschise: <b>{stats.nc}</b></div>
                </div>
            </div>

            <div style={row}>
                <button style={btn} onClick={() => setShowForm(v => !v)}>{showForm ? 'Anulează' : 'Adaugă audit'}</button>
            </div>

            {showForm && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
                    <div><div style={{ fontSize: 12, opacity: .7 }}>Data</div><input required type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={{ width: '100%' }} /></div>
                    <div><div style={{ fontSize: 12, opacity: .7 }}>Tip</div>
                        <select value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value as Audit['tip'] })} style={{ width: '100%' }}>
                            <option value="intern">Intern</option>
                            <option value="extern">Extern</option>
                            <option value="inspectie">Inspecție</option>
                        </select>
                    </div>
                    <div><div style={{ fontSize: 12, opacity: .7 }}>Checklist URL</div><input type="url" placeholder="https://..." value={form.checklistUrl} onChange={e => setForm({ ...form, checklistUrl: e.target.value })} style={{ width: '100%' }} /></div>
                    <div><div style={{ fontSize: 12, opacity: .7 }}>NC deschise</div><input type="number" min={0} value={form.neconformitatiDeschise} onChange={e => setForm({ ...form, neconformitatiDeschise: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div style={{ display: 'flex', alignItems: 'end' }}><button style={btn} type="submit">Salvează</button></div>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(a => (
                    <div key={a.id} style={{ ...card, display: 'grid', gridTemplateColumns: '140px 120px 1fr 140px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Data</div><div>{new Date(a.data).toLocaleDateString()}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Tip</div><div style={{ textTransform: 'capitalize' }}>{a.tip}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Checklist</div>{a.checklistUrl ? <a href={a.checklistUrl} target="_blank">Deschide</a> : <span style={{ opacity: .6 }}>-</span>}</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 13 }}>NC: <b>{a.neconformitatiDeschise || 0}</b></span>
                            <button onClick={() => remove(a.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button>
                        </div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există înregistrări.</div>}
            </div>
        </div>
    );
}
