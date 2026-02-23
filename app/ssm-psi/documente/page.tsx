'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Doc = {
    id: string;
    titlu: string;
    categorie: 'procedura' | 'instructiune' | 'formular' | 'alta';
    versiune: string;
    url?: string;
    dataUpload: string; // ISO
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::documente';

export default function Page() {
    const [list, setList] = useState<Doc[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<Doc>({ id: '', titlu: '', categorie: 'procedura', versiune: '1.0', url: '', dataUpload: '' });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('documente');
        setShow(false);
        setForm({ id: '', titlu: '', categorie: 'procedura', versiune: '1.0', url: '', dataUpload: '' });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('documente');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>Documente SSM/PSI (bibliotecă)</h1>
            <p style={sub}>Proceduri, instrucțiuni proprii, note interne — versiuni și istoric.</p>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Adaugă document'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr 100px' }}>
                    <input required placeholder="Titlu document" value={form.titlu} onChange={e => setForm({ ...form, titlu: e.target.value })} />
                    <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value as Doc['categorie'] })}>
                        <option value="procedura">Procedură</option><option value="instructiune">Instrucțiune</option>
                        <option value="formular">Formular</option><option value="alta">Altă</option>
                    </select>
                    <input placeholder="Versiune" value={form.versiune} onChange={e => setForm({ ...form, versiune: e.target.value })} />
                    <input type="url" placeholder="URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                    <input type="date" required value={form.dataUpload} onChange={e => setForm({ ...form, dataUpload: e.target.value })} />
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(d => (
                    <div key={d.id} style={{ ...card, display: 'grid', gridTemplateColumns: '2fr 120px 100px 1fr 140px 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Titlu</div><div>{d.titlu}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Categorie</div><div>{d.categorie}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Versiune</div><div>{d.versiune}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Fișier</div>{d.url ? <a href={d.url} target="_blank">Deschide</a> : <span style={{ opacity: .6 }}>-</span>}</div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Încărcat</div>{d.dataUpload ? new Date(d.dataUpload).toLocaleDateString() : '-'}</div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(d.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există documente.</div>}
            </div>
        </div>
    );
}
