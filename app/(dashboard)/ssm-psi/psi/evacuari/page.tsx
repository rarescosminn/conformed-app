'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Ex = {
    id: string;
    dataPlanificata: string; // ISO
    frecventa: 'trimestrial' | 'anual';
    procesVerbalUrl?: string;
    mediaUrl?: string;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: .8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: .8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::evacuari';

export default function Page() {
    const [list, setList] = useState<Ex[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<Ex>({ id: '', dataPlanificata: '', frecventa: 'trimestrial', procesVerbalUrl: '', mediaUrl: '' });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const info = useMemo(() => {
        const ord = [...list].sort((a, b) => new Date(a.dataPlanificata).getTime() - new Date(b.dataPlanificata).getTime());
        const upcoming = ord.find(x => new Date(x.dataPlanificata).getTime() >= Date.now());
        const lastTwo = [...list].sort((a, b) => new Date(b.dataPlanificata).getTime() - new Date(a.dataPlanificata).getTime()).slice(0, 2);
        return { upcoming, lastTwo };
    }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('evacuari');
        setShow(false);
        setForm({ id: '', dataPlanificata: '', frecventa: 'trimestrial', procesVerbalUrl: '', mediaUrl: '' });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('evacuari');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Exerciții de evacuare</h1>
            <p style={sub}>Planificare, procese-verbale, dovadă foto/video, recurență (trimestrial/anual).</p>

            <div style={{ ...card, marginBottom: 16, fontSize: 13 }}>
                <div>Următorul: <b>{info.upcoming ? new Date(info.upcoming.dataPlanificata).toLocaleDateString() : '-'}</b></div>
                <div style={{ marginTop: 6, opacity: .8 }}>Ultimele PV:</div>
                <ul style={{ margin: '6px 0 0 16px', fontSize: 13 }}>
                    {info.lastTwo.map(e => <li key={e.id}>PV {new Date(e.dataPlanificata).toLocaleDateString()}</li>)}
                    {info.lastTwo.length === 0 && <li style={{ opacity: .6 }}>—</li>}
                </ul>
            </div>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Planifică exercițiu'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 2fr 2fr 120px' }}>
                    <input type="date" required value={form.dataPlanificata} onChange={e => setForm({ ...form, dataPlanificata: e.target.value })} />
                    <select value={form.frecventa} onChange={e => setForm({ ...form, frecventa: e.target.value as Ex['frecventa'] })}>
                        <option value="trimestrial">Trimestrial</option>
                        <option value="anual">Anual</option>
                    </select>
                    <input type="url" placeholder="Proces verbal (URL)" value={form.procesVerbalUrl} onChange={e => setForm({ ...form, procesVerbalUrl: e.target.value })} />
                    <input type="url" placeholder="Media (URL)" value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} />
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(e => (
                    <div key={e.id} style={{ ...card, display: 'grid', gridTemplateColumns: '140px 140px 1fr 1fr 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Data</div>{new Date(e.dataPlanificata).toLocaleDateString()}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Frecvență</div>{e.frecventa}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>PV</div>{e.procesVerbalUrl ? <a href={e.procesVerbalUrl} target="_blank">Deschide</a> : <span style={{ opacity: .6 }}>-</span>}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Media</div>{e.mediaUrl ? <a href={e.mediaUrl} target="_blank">Vezi</a> : <span style={{ opacity: .6 }}>-</span>}</div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(e.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există programări.</div>}
            </div>
        </div>
    );
}
