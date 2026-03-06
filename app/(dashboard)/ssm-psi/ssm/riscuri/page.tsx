'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Risc = {
    id: string;
    descriere: string;
    nivel: 'scazut' | 'mediu' | 'ridicat';
    responsabil?: string;
    termen?: string; // ISO
    status: 'deschis' | 'in-derulare' | 'inchis';
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: .8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: .8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::riscuri';

export default function Page() {
    const [list, setList] = useState<Risc[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<Risc>({ id: '', descriere: '', nivel: 'mediu', responsabil: '', termen: '', status: 'deschis' });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const stats = useMemo(() => {
        const deschise = list.filter(r => r.status !== 'inchis').length;
        const intarziate = list.filter(r => r.termen && new Date(r.termen).getTime() < Date.now() && r.status !== 'inchis').length;
        return { deschise, intarziate };
    }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('riscuri');
        setShow(false);
        setForm({ id: '', descriere: '', nivel: 'mediu', responsabil: '', termen: '', status: 'deschis' });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('riscuri');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Registru riscuri & măsuri</h1>
            <p style={sub}>Evaluări, responsabil, termene, status.</p>

            <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 24, fontSize: 13 }}>
                <div>Riscuri deschise: <b>{stats.deschise}</b></div>
                <div>Măsuri întârziate: <b style={{ color: stats.intarziate > 0 ? '#991b1b' : undefined }}>{stats.intarziate}</b></div>
            </div>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Adaugă risc/măsură'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '2fr 120px 1fr 140px 140px 120px' }}>
                    <input required placeholder="Descriere risc/măsură" value={form.descriere} onChange={e => setForm({ ...form, descriere: e.target.value })} />
                    <select value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value as Risc['nivel'] })}>
                        <option value="scazut">Scăzut</option><option value="mediu">Mediu</option><option value="ridicat">Ridicat</option>
                    </select>
                    <input placeholder="Responsabil" value={form.responsabil} onChange={e => setForm({ ...form, responsabil: e.target.value })} />
                    <input type="date" value={form.termen} onChange={e => setForm({ ...form, termen: e.target.value })} />
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Risc['status'] })}>
                        <option value="deschis">Deschis</option><option value="in-derulare">În derulare</option><option value="inchis">Închis</option>
                    </select>
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(r => (
                    <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '2fr 120px 1fr 140px 140px 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Descriere</div>{r.descriere}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Nivel</div>{r.nivel}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Responsabil</div>{r.responsabil || '-'}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Termen</div>{r.termen ? new Date(r.termen).toLocaleDateString() : '-'}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Status</div>{r.status}</div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(r.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există riscuri/măsuri.</div>}
            </div>
        </div>
    );
}
