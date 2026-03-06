'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Permis = {
    id: string;
    categorie: 'foc' | 'spatiu-inchis' | 'inaltime' | 'electric';
    dataStart: string; // ISO
    dataStop?: string; // ISO
    activ: boolean;
    aprobatDe?: string;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: .8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: .8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::permise';

export default function Page() {
    const [list, setList] = useState<Permis[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<Permis>({ id: '', categorie: 'foc', dataStart: '', dataStop: '', activ: true, aprobatDe: '' });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const stats = useMemo(() => {
        const now = Date.now();
        const activeAzi = list.filter(p => {
            const start = new Date(p.dataStart).getTime();
            const stop = p.dataStop ? new Date(p.dataStop).getTime() : undefined;
            const inInterval = stop ? now >= start && now <= stop : now >= start;
            return p.activ && inInterval;
        }).length;
        return { activeAzi };
    }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('permise');
        setShow(false);
        setForm({ id: '', categorie: 'foc', dataStart: '', dataStop: '', activ: true, aprobatDe: '' });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('permise');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Permise de lucru</h1>
            <p style={sub}>(lucru cu foc, spații închise, la înălțime, electric) – flux aprobare + jurnal intervenții.</p>

            <div style={{ ...card, marginBottom: 16, fontSize: 13 }}>Permise active azi: <b>{stats.activeAzi}</b></div>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Emite permis'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 120px', alignItems: 'end' }}>
                    <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value as Permis['categorie'] })}>
                        <option value="foc">Foc deschis</option>
                        <option value="spatiu-inchis">Spațiu închis</option>
                        <option value="inaltime">Lucru la înălțime</option>
                        <option value="electric">Electric</option>
                    </select>
                    <input type="date" required value={form.dataStart} onChange={e => setForm({ ...form, dataStart: e.target.value })} />
                    <input type="date" value={form.dataStop} onChange={e => setForm({ ...form, dataStop: e.target.value })} />
                    <input placeholder="Aprobat de" value={form.aprobatDe} onChange={e => setForm({ ...form, aprobatDe: e.target.value })} />
                    <label style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={form.activ} onChange={e => setForm({ ...form, activ: e.target.checked })} /> Activ
                    </label>
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(p => (
                    <div key={p.id} style={{ ...card, display: 'grid', gridTemplateColumns: '160px 160px 1fr 120px 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Categorie</div>{p.categorie}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Interval</div>{new Date(p.dataStart).toLocaleDateString()} – {p.dataStop ? new Date(p.dataStop).toLocaleDateString() : 'nedefinit'}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Aprobat de</div>{p.aprobatDe || '-'}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Status</div>{p.activ ? 'Activ' : 'Închis'}</div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(p.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există permise.</div>}
            </div>
        </div>
    );
}
