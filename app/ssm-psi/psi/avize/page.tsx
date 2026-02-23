'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { notifyUpdate } from '@/lib/ssmpsi-bridge';

type Aviz = {
    id: string;
    tip: 'ISU' | 'ITM' | 'Mediu' | 'Altul';
    numar: string;
    dataExpirare: string; // ISO yyyy-mm-dd
    fisierUrl?: string;
};

const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    padding: 16,
};

const LS_KEY = 'ssmpsi::avize';

export default function Page() {
    const [list, setList] = useState<Aviz[]>([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState<Aviz>({
        id: '',
        tip: 'ISU',
        numar: '',
        dataExpirare: '',
        fisierUrl: '',
    });

    // load + persist
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) setList(JSON.parse(raw));
        } catch { }
    }, []);
    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify(list));
    }, [list]);

    // stats pentru card
    const stats = useMemo(() => {
        const total = list.length;
        const exp60 = list.filter(
            (a) => (new Date(a.dataExpirare).getTime() - Date.now()) / 86400000 <= 60
        ).length;
        return { total, exp60 };
    }, [list]);

    // handlers
    const add = (e: React.FormEvent) => {
        e.preventDefault();
        setList([{ ...form, id: crypto.randomUUID() }, ...list]);
        notifyUpdate('avize');
        setShow(false);
        setForm({ id: '', tip: 'ISU', numar: '', dataExpirare: '', fisierUrl: '' });
    };

    const remove = (id: string) => {
        setList(list.filter((i) => i.id !== id));
        notifyUpdate('avize');
    };

    return (
        <div style={wrap}>
            <Link href="/ssm-psi" style={back}>
                ← Înapoi
            </Link>
            <h1 style={h1}>Avize & autorizații (ISU, ITM, mediu)</h1>
            <p style={sub}>Evidență scadențe, fișiere atașate, remindere.</p>

            <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 24, fontSize: 13 }}>
                <div>Total: <b>{stats.total}</b></div>
                <div>
                    Expiră în ≤ 60 zile:{' '}
                    <b style={{ color: stats.exp60 > 0 ? '#991b1b' : undefined }}>{stats.exp60}</b>
                </div>
            </div>

            <button style={btn} onClick={() => setShow((v) => !v)}>
                {show ? 'Anulează' : 'Adaugă aviz'}
            </button>

            {show && (
                <form
                    onSubmit={add}
                    style={{
                        ...card,
                        marginTop: 12,
                        display: 'grid',
                        gap: 12,
                        gridTemplateColumns: '120px 1fr 160px 1fr 120px',
                        alignItems: 'end',
                    }}
                >
                    <select
                        value={form.tip}
                        onChange={(e) => setForm({ ...form, tip: e.target.value as Aviz['tip'] })}
                    >
                        <option value="ISU">ISU</option>
                        <option value="ITM">ITM</option>
                        <option value="Mediu">Mediu</option>
                        <option value="Altul">Altul</option>
                    </select>

                    <input
                        required
                        placeholder="Număr document"
                        value={form.numar}
                        onChange={(e) => setForm({ ...form, numar: e.target.value })}
                    />

                    <input
                        required
                        type="date"
                        value={form.dataExpirare}
                        onChange={(e) => setForm({ ...form, dataExpirare: e.target.value })}
                    />

                    <input
                        type="url"
                        placeholder="URL document"
                        value={form.fisierUrl}
                        onChange={(e) => setForm({ ...form, fisierUrl: e.target.value })}
                    />

                    <button type="submit" style={btn}>
                        Salvează
                    </button>
                </form>
            )}

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {list.map((a) => (
                    <div
                        key={a.id}
                        style={{
                            ...card,
                            display: 'grid',
                            gridTemplateColumns: '100px 1fr 160px 1fr 120px',
                            gap: 12,
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Tip</div>
                            {a.tip}
                        </div>

                        <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Număr</div>
                            {a.numar}
                        </div>

                        <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Expiră</div>
                            {new Date(a.dataExpirare).toLocaleDateString()}
                        </div>

                        <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Fișier</div>
                            {a.fisierUrl ? (
                                <a href={a.fisierUrl} target="_blank">
                                    Deschide
                                </a>
                            ) : (
                                <span style={{ opacity: 0.6 }}>-</span>
                            )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={() => remove(a.id)} style={{ ...btn, background: '#991b1b' }}>
                                Șterge
                            </button>
                        </div>
                    </div>
                ))}

                {list.length === 0 && <div style={{ ...card, opacity: 0.8 }}>Nu există avize.</div>}
            </div>
        </div>
    );
}
