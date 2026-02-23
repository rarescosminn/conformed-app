'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ================= Tipuri & constante ================= */
type EquipType = 'stingator' | 'hidrant' | 'trusa' | 'sistem_alarma';
type Status = 'valid' | 'expira' | 'expirat';

type Equip = {
    id: string;
    tip: EquipType;
    code: string;          // ID intern / cod unic
    locatie: string;
    ultimaVerif: string;   // YYYY-MM-DD
    scadenta: string;      // YYYY-MM-DD
    furnizor?: string;
    dovada?: string;       // nume fișier
    note?: string;
};

const TIP_LABEL: Record<EquipType, string> = {
    stingator: 'Stingător',
    hidrant: 'Hidrant',
    trusa: 'Trusă prim ajutor',
    sistem_alarma: 'Sistem alarmă'
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromYMD = (s: string) => new Date(s + 'T00:00:00');

const INTERVAL_ZILE: Record<EquipType, number> = {
    stingator: 365,
    hidrant: 365,
    trusa: 180,
    sistem_alarma: 365,
};

function addDays(s: string, days: number) {
    const d = fromYMD(s);
    d.setDate(d.getDate() + days);
    return ymd(d);
}

function daysUntil(s: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = fromYMD(s);
    return Math.floor((+d - +today) / (1000 * 60 * 60 * 24));
}

function statusOf(e: Equip): Status {
    const left = daysUntil(e.scadenta);
    if (left < 0) return 'expirat';
    if (left <= 30) return 'expira';
    return 'valid';
}

const STORAGE_KEY = 'psi-echipamente-v1';

const SEED: Equip[] = [
    { id: 'E1', tip: 'stingator', code: 'ST-BO-01', locatie: 'Bloc operator - intrare', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 365), furnizor: 'Company X' },
    { id: 'E2', tip: 'hidrant', code: 'HD-ET2-03', locatie: 'Etaj 2 - hol central', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 365) },
    { id: 'E3', tip: 'trusa', code: 'TR-ATI-02', locatie: 'ATI - post asistent', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 180) },
    { id: 'E4', tip: 'sistem_alarma', code: 'SA-CLN-01', locatie: 'Clădire nouă - centrală alarmă', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 365) },
];

function loadAll(): Equip[] {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : SEED; }
    catch { return SEED; }
}
function saveAll(list: Equip[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); window.dispatchEvent(new Event('storage')); } catch { }
}

/* ================== UI bits ================== */
const card: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', padding: 16 };
const pill = (text: string, tone: 'gray' | 'blue' | 'green' | 'amber' | 'red') => {
    const tones: Record<typeof tone, React.CSSProperties> = {
        gray: { border: '1px solid #e5e7eb', background: '#f8fafc', color: '#0f172a' },
        blue: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' },
        green: { border: '1px solid #bbf7d0', background: '#ecfdf5', color: '#047857' },
        amber: { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412' },
        red: { border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' },
    };
    return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 12, ...tones[tone] }}>{text}</span>;
};

/* ================== Pagina ================== */
export default function PSIEchipamentePage() {
    const [items, setItems] = useState<Equip[]>([]);
    const [q, setQ] = useState('');
    const [tip, setTip] = useState<'toate' | EquipType>('toate');
    const [st, setSt] = useState<'toate' | Status>('toate');
    const [onlyDueSoon, setOnlyDueSoon] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [draft, setDraft] = useState<Partial<Equip>>({
        tip: 'stingator', code: '', locatie: '', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 365), furnizor: ''
    });

    useEffect(() => {
        setItems(loadAll());
        const on = () => setItems(loadAll());
        window.addEventListener('storage', on);
        return () => window.removeEventListener('storage', on);
    }, []);

    const save = (next: Equip[]) => { setItems(next); saveAll(next); };

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        let list = items.filter(e => {
            if (tip !== 'toate' && e.tip !== tip) return false;
            const stat = statusOf(e);
            if (st !== 'toate' && stat !== st) return false;
            if (onlyDueSoon && stat === 'valid') return false;
            if (!s) return true;
            return e.code.toLowerCase().includes(s) || e.locatie.toLowerCase().includes(s) || (e.furnizor || '').toLowerCase().includes(s);
        });
        // sort: expirat -> expira -> valid, apoi scadență crescător
        const order: Record<Status, number> = { expirat: 0, expira: 1, valid: 2 };
        list.sort((a, b) => {
            const sa = order[statusOf(a)], sb = order[statusOf(b)];
            if (sa !== sb) return sa - sb;
            return a.scadenta.localeCompare(b.scadenta);
        });
        return list;
    }, [items, q, tip, st, onlyDueSoon]);

    const stats = useMemo(() => {
        let valid = 0, expira = 0, expirat = 0;
        for (const e of items) {
            const s = statusOf(e);
            if (s === 'valid') valid++; else if (s === 'expira') expira++; else expirat++;
        }
        const upcoming = items.filter(e => statusOf(e) !== 'valid').slice(0, 8);
        return { total: items.length, valid, expira, expirat, upcoming };
    }, [items]);

    const setProof = (id: string, f?: File | null) => {
        save(items.map(e => e.id === id ? { ...e, dovada: f?.name } : e));
    };

    const markVerifiedToday = (id: string) => {
        save(items.map(e => {
            if (e.id !== id) return e;
            const last = ymd(new Date());
            const next = addDays(last, INTERVAL_ZILE[e.tip]);
            return { ...e, ultimaVerif: last, scadenta: next };
        }));
    };

    const addItem = () => {
        if (!draft.tip || !draft.code || !draft.locatie || !draft.ultimaVerif || !draft.scadenta) return;
        const it: Equip = {
            id: 'EQ' + Date.now(),
            tip: draft.tip as EquipType,
            code: draft.code!,
            locatie: draft.locatie!,
            ultimaVerif: draft.ultimaVerif!,
            scadenta: draft.scadenta!,
            furnizor: draft.furnizor || '',
            dovada: undefined,
            note: draft.note || '',
        };
        save([it, ...items]);
        setAddOpen(false);
        setDraft({ tip: 'stingator', code: '', locatie: '', ultimaVerif: ymd(new Date()), scadenta: addDays(ymd(new Date()), 365), furnizor: '' });
    };

    return (
        <div style={{ padding: 20 }}>
            {/* Înapoi */}
            <div style={{ marginBottom: 10 }}>
                <Link href="/ssm-psi" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', textDecoration: 'none', fontSize: 13 }}>
                    ← Înapoi
                </Link>
            </div>

            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Echipamente (PSI)</h1>
            <p style={{ margin: '6px 0 18px', opacity: 0.8 }}>Evidență stingătoare, hidranți, truse, sisteme alarmă — verificări și scadențe.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
                {/* stânga */}
                <div>
                    {/* bară filtre */}
                    <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700 }}>Filtre</div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Tip:
                            <select value={tip} onChange={e => setTip(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                <option value="toate">Toate</option>
                                <option value="stingator">Stingător</option>
                                <option value="hidrant">Hidrant</option>
                                <option value="trusa">Trusă prim ajutor</option>
                                <option value="sistem_alarma">Sistem alarmă</option>
                            </select>
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Status:
                            <select value={st} onChange={e => setSt(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                <option value="toate">Toate</option>
                                <option value="valid">Valid</option>
                                <option value="expira">Expiră curând</option>
                                <option value="expirat">Expirat</option>
                            </select>
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={onlyDueSoon} onChange={e => setOnlyDueSoon(e.target.checked)} />
                            Doar scadențe (≤ 30 zile)
                        </label>

                        <input
                            value={q} onChange={e => setQ(e.target.value)} placeholder="Caută cod/locație/furnizor…"
                            style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb', minWidth: 280 }}
                        />

                        <button onClick={() => setAddOpen(true)} type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                            + Adaugă echipament
                        </button>
                    </div>

                    {/* listă */}
                    <div style={{ display: 'grid', gap: 12 }}>
                        {filtered.map(e => {
                            const st = statusOf(e);
                            const left = daysUntil(e.scadenta);
                            return (
                                <div key={e.id} style={card}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 700 }}>{e.code}</div>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            {pill(TIP_LABEL[e.tip], 'blue')}
                                            {pill(e.locatie, 'gray')}
                                            {st === 'valid' && pill(`Valid (${left} zile)`, 'green')}
                                            {st === 'expira' && pill(`Expiră în ${left} zile`, 'amber')}
                                            {st === 'expirat' && pill(`Expirat (${Math.abs(left)} zile)`, 'red')}
                                        </div>
                                        <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.75 }}>
                                            Ultima verificare: <b>{e.ultimaVerif}</b> • Scadență: <b>{e.scadenta}</b>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                                        <span>Furnizor: <b>{e.furnizor || '—'}</b></span>
                                        <span>Dovadă: <b>{e.dovada || '—'}</b></span>
                                    </div>

                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' as any }}>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => setProof(e.id, ev.target.files?.[0])} />
                                            {pill(e.dovada ? 'Schimbă dovadă' : 'Încarcă dovadă', 'gray')}
                                        </label>

                                        <button
                                            onClick={() => markVerifiedToday(e.id)}
                                            type="button"
                                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                                            title="Marchează verificare azi și recalculă scadența după intervalul tipului"
                                        >
                                            Marchează verificat azi
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && <div style={{ ...card, opacity: 0.75 }}>Nu există echipamente pentru filtrele selectate.</div>}
                    </div>
                </div>

                {/* dreapta — statistici & scadențe apropiate */}
                <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'grid', gap: 12 }}>
                    <div style={{ ...card, border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Statistici</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>Total: <strong>{stats.total}</strong></div>
                            <div>{pill('Valid', 'green')} <strong>{stats.valid}</strong></div>
                            <div>{pill('Expiră curând', 'amber')} <strong>{stats.expira}</strong></div>
                            <div>{pill('Expirat', 'red')} <strong>{stats.expirat}</strong></div>
                        </div>
                    </div>

                    <div style={card}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Scadențe apropiate</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {stats.upcoming.length === 0 && <div style={{ opacity: 0.75, fontSize: 13 }}>Nicio scadență în următoarele 30 de zile.</div>}
                            {stats.upcoming.map(u => {
                                const left = daysUntil(u.scadenta);
                                const tone = statusOf(u) === 'expirat' ? 'red' : 'amber';
                                return (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {pill(TIP_LABEL[u.tip], 'blue')}
                                        <div style={{ fontSize: 13 }}>{u.code} — {u.locatie}</div>
                                        <div style={{ marginLeft: 'auto' }}>{pill(left < 0 ? `Expirat (${Math.abs(left)}z)` : `În ${left}z`, tone as any)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            {/* modal adăugare */}
            {addOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
                    <div style={{ width: 'min(720px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                            <b style={{ color: '#1e3a8a' }}>Adaugă echipament</b>
                            <button onClick={() => setAddOpen(false)} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>Tip *
                                    <select
                                        value={draft.tip as EquipType}
                                        onChange={e => {
                                            const t = e.target.value as EquipType;
                                            setDraft(d => ({ ...d, tip: t, scadenta: addDays(d.ultimaVerif || ymd(new Date()), INTERVAL_ZILE[t]) }));
                                        }}
                                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    >
                                        <option value="stingator">Stingător</option>
                                        <option value="hidrant">Hidrant</option>
                                        <option value="trusa">Trusă prim ajutor</option>
                                        <option value="sistem_alarma">Sistem alarmă</option>
                                    </select>
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>Cod / ID *
                                    <input value={draft.code || ''} onChange={e => setDraft(d => ({ ...d, code: e.target.value }))} placeholder="ex: ST-BO-01" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                            </div>

                            <label style={{ display: 'grid', gap: 6 }}>Locație *
                                <input value={draft.locatie || ''} onChange={e => setDraft(d => ({ ...d, locatie: e.target.value }))} placeholder="ex: Etaj 2 / hol central" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>Ultima verificare *
                                    <input type="date" value={draft.ultimaVerif || ymd(new Date())} onChange={e => {
                                        const v = e.target.value; const t = (draft.tip as EquipType) || 'stingator';
                                        setDraft(d => ({ ...d, ultimaVerif: v, scadenta: addDays(v, INTERVAL_ZILE[t]) }));
                                    }} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>Scadență *
                                    <input type="date" value={draft.scadenta || addDays(ymd(new Date()), 365)} onChange={e => setDraft(d => ({ ...d, scadenta: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>Furnizor
                                    <input value={draft.furnizor || ''} onChange={e => setDraft(d => ({ ...d, furnizor: e.target.value }))} placeholder="ex: Company X" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>Note
                                    <textarea value={draft.note || ''} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} rows={3} placeholder="Detalii, observații" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', resize: 'vertical' }} />
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setAddOpen(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Anulează</button>
                                <button type="button" onClick={addItem} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Salvează</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
