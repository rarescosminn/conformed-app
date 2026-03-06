'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type EIP = {
    id: string;
    angajat: string;
    tip: string;
    marime?: string;
    dataExpirare?: string; // ISO
    confirmarePrimire?: boolean;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: .8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: .8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)', padding: 16 };

const LS_KEY = 'ssmpsi::eip';

export default function Page() {
    const [list, setList] = useState<EIP[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<EIP>({ id: '', angajat: '', tip: '', marime: '', dataExpirare: '', confirmarePrimire: false });

    useEffect(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) setList(JSON.parse(raw)); } catch { } }, []);
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(list)); }, [list]);

    const stats = useMemo(() => {
        const expirari30 = list.filter(i => i.dataExpirare && (new Date(i.dataExpirare).getTime() - Date.now()) / 86400000 <= 30).length;
        const total = list.length;
        return { total, expirari30 };
    }, [list]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('eip');
        setShow(false);
        setForm({ id: '', angajat: '', tip: '', marime: '', dataExpirare: '', confirmarePrimire: false });
    };
    const remove = (id: string) => {
        setList(list.filter(i => i.id !== id));
        notifyUpdate('eip');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>← Înapoi</Link>
            <h1 style={h1}>EIP – echipament individual de protecție</h1>
            <p style={sub}>Gestiune și distribuții pe angajat, mărimi, expirări, confirmări primire.</p>

            <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 24, fontSize: 13 }}>
                <div>Total EIP: <b>{stats.total}</b></div>
                <div>Expiră în ≤ 30 zile: <b style={{ color: stats.expirari30 > 0 ? '#991b1b' : undefined }}>{stats.expirari30}</b></div>
            </div>

            <button style={btn} onClick={() => setShow(v => !v)}>{show ? 'Anulează' : 'Adaugă EIP'}</button>

            {show && (
                <form onSubmit={add} style={{ ...card, marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 110px', alignItems: 'end' }}>
                    <input required placeholder="Angajat" value={form.angajat} onChange={e => setForm({ ...form, angajat: e.target.value })} />
                    <input required placeholder="Tip EIP (ex. Cască, Vestă)" value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })} />
                    <input placeholder="Mărime" value={form.marime} onChange={e => setForm({ ...form, marime: e.target.value })} />
                    <input type="date" value={form.dataExpirare} onChange={e => setForm({ ...form, dataExpirare: e.target.value })} />
                    <label style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={form.confirmarePrimire} onChange={e => setForm({ ...form, confirmarePrimire: e.target.checked })} /> Confirmat
                    </label>
                    <button type="submit" style={btn}>Salvează</button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map(i => (
                    <div key={i.id} style={{ ...card, display: 'grid', gridTemplateColumns: '2fr 1fr 100px 140px 120px 120px', gap: 12, alignItems: 'center' }}>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Angajat</div><div>{i.angajat}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Tip</div><div>{i.tip}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Mărime</div><div>{i.marime || '-'}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Expiră la</div><div>{i.dataExpirare ? new Date(i.dataExpirare).toLocaleDateString() : '-'}</div></div>
                        <div><div style={{ fontSize: 12, opacity: .7 }}>Confirmare</div><div>{i.confirmarePrimire ? 'Da' : 'Nu'}</div></div>
                        <div style={{ textAlign: 'right' }}><button onClick={() => remove(i.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button></div>
                    </div>
                ))}
                {list.length === 0 && <div style={{ ...card, opacity: .8 }}>Nu există înregistrări.</div>}
            </div>
        </div>
    );
}
