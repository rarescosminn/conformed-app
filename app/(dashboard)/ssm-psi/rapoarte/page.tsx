'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type KPI = {
    id: string;
    titlu: string;
    perioada: string;      // ex: "Ian 2025" sau "2025-Q1"
    dataGenerare: string;  // ISO
    url?: string;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::kpi';

export default function Page() {
    const [list, setList] = useState<KPI[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<KPI>({ id: '', titlu: '', perioada: '', dataGenerare: '', url: '' });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('kpi');
        setShow(false);
        setForm({ id: '', titlu: '', perioada: '', dataGenerare: '', url: '' });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('kpi');
    };

    const stats = useMemo(() => {
        const recent = list.filter(r => {
            if (!r.dataGenerare) return false;
            const days = Math.ceil((Date.now() - new Date(r.dataGenerare).getTime()) / 86400000);
            return days <= 30;
        }).length;
        return { total: list.length, recent };
    }, [list]);

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Rapoarte KPI</h1>
            <p style={sub}>Indicatori lunari/anuali, trenduri și exporturi.</p>

            <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                    <div>Total rapoarte: <b>{stats.total}</b></div>
                    <div>Generate în ultimele 30 zile: <b>{stats.recent}</b></div>
                </div>
            </div>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Generează/adauga raport'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr 2fr 120px' }}>
                    <input required placeholder="Titlu raport" value={form.titlu} onChange={e => setForm({ ...form, titlu: e.target.value })} />
                    <input required placeholder="Perioada (ex. Ian 2025)" value={form.perioada} onChange={e => setForm({ ...form, perioada: e.target.value })} />
                    <input required type="date" value={form.dataGenerare} onChange={e => setForm({ ...form, dataGenerare: e.target.value })} />
                    <input type="url" placeholder="URL export (opțional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(r => (
                    <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '2fr 140px 140px 1fr 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Titlu</div><div>{r.titlu}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Perioada</div><div>{r.perioada || '-'}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Generat</div><div>{r.dataGenerare ? new Date(r.dataGenerare).toLocaleDateString() : '-'}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Fișier</div>{r.url ? <a href={r.url} target="_blank">Deschide</a> : <span style={{ opacity: .6 }}>-</span>}</div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(r.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există rapoarte.</div>}
            </div>
        </div>
    );
}
