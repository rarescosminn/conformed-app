'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ============ Tipuri ============ */
type Attendee = {
    id: string;
    name: string;
    present: boolean;
    absentMotivated: boolean;
};

type Training = {
    id: string;
    title: string;
    date: string;       // YYYY-MM-DD
    location?: string;
    section?: string;   // secția/compartiment
    planFile?: string;  // nume fișier plan
    proofFile?: string; // nume fișier dovadă
    finalized: boolean;
    attendees: Attendee[];
};

/* ============ Utils ============ */
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const STORAGE_KEY = 'ssm-instruiri-v1';

const SEED: Training[] = [
    {
        id: 'T1',
        title: 'Instruire periodică SSM – ATI',
        date: ymd(new Date()),
        location: 'Sala conferințe',
        section: 'ATI',
        finalized: false,
        attendees: [
            { id: 'a1', name: 'Popescu Andrei', present: false, absentMotivated: false },
            { id: 'a2', name: 'Ionescu Maria', present: false, absentMotivated: false },
            { id: 'a3', name: 'Georgescu Vlad', present: false, absentMotivated: false },
        ],
    },
    {
        id: 'T2',
        title: 'Instruire la angajare – Bloc operator',
        date: ymd(new Date(new Date().setDate(new Date().getDate() - 15))),
        location: 'Sala 2',
        section: 'Bloc operator',
        finalized: true,
        proofFile: 'dovada_scanata.pdf',
        attendees: [
            { id: 'b1', name: 'Dumitru Alina', present: true, absentMotivated: false },
            { id: 'b2', name: 'Moldovan Tudor', present: true, absentMotivated: false },
        ],
    },
];

/* ============ Stocare ============ */
function loadTrainings(): Training[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : SEED;
    } catch {
        return SEED;
    }
}
function saveTrainings(list: Training[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage')); // refresh în alte taburi
    } catch { }
}

/* ============ Componente mici ============ */
const pill = (text: string, tone: 'blue' | 'green' | 'orange' | 'gray') => {
    const colors: Record<typeof tone, React.CSSProperties> = {
        blue: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' },
        green: { border: '1px solid #bbf7d0', background: '#ecfdf5', color: '#047857' },
        orange: { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412' },
        gray: { border: '1px solid #e5e7eb', background: '#f8fafc', color: '#0f172a' },
    };
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 12,
                ...colors[tone],
            }}
        >
            {text}
        </span>
    );
};

const btn = (onClick: () => void, label: string, disabled?: boolean) => (
    <button
        onClick={onClick}
        disabled={!!disabled}
        style={{
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid #bfdbfe',
            background: disabled ? '#f1f5f9' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 13,
        }}
        type="button"
    >
        {label}
    </button>
);

/* ============ Pagina ============ */
export default function SSMInstruiriPage() {
    const [list, setList] = useState<Training[]>([]);
    const [q, setQ] = useState('');
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    });
    const [addOpen, setAddOpen] = useState(false);
    const [draft, setDraft] = useState<Partial<Training>>({
        title: '',
        date: ymd(new Date()),
        location: '',
        section: '',
    });

    useEffect(() => {
        setList(loadTrainings());
        const on = () => setList(loadTrainings());
        window.addEventListener('storage', on);
        return () => window.removeEventListener('storage', on);
    }, []);

    const save = (next: Training[]) => {
        setList(next);
        saveTrainings(next);
    };

    /* ---- KPI lunar ---- */
    const monthItems = useMemo(() => {
        const [y, m] = month.split('-').map(Number);
        return list.filter((t) => {
            const d = new Date(t.date);
            return d.getFullYear() === y && d.getMonth() + 1 === m;
        });
    }, [list, month]);

    const kpi = useMemo(() => {
        let present = 0, absent = 0, motiv = 0;
        for (const t of monthItems) {
            for (const a of t.attendees) {
                if (a.present) present++;
                else if (a.absentMotivated) motiv++;
                else absent++;
            }
        }
        const denom = present + absent; // motivații excluse
        const conform = denom === 0 ? 0 : Math.round((present / denom) * 100);
        return { present, absent, motiv, conform, sessions: monthItems.length };
    }, [monthItems]);

    /* ---- Filtre + căutare ---- */
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return list
            .filter((t) => {
                const inMonth = t.date.startsWith(month);
                if (!inMonth) return false;
                if (!s) return true;
                return (
                    t.title.toLowerCase().includes(s) ||
                    (t.section || '').toLowerCase().includes(s) ||
                    (t.location || '').toLowerCase().includes(s)
                );
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [list, q, month]);

    /* ---- Acțiuni ---- */
    const togglePresent = (tid: string, aid: string) => {
        save(
            list.map((t) =>
                t.id !== tid
                    ? t
                    : {
                        ...t,
                        attendees: t.attendees.map((a) =>
                            a.id === aid ? { ...a, present: !a.present } : a
                        ),
                    }
            )
        );
    };

    const toggleMotiv = (tid: string, aid: string) => {
        save(
            list.map((t) =>
                t.id !== tid
                    ? t
                    : {
                        ...t,
                        attendees: t.attendees.map((a) =>
                            a.id === aid ? { ...a, absentMotivated: !a.absentMotivated } : a
                        ),
                    }
            )
        );
    };

    const setPlanFile = (tid: string, file?: File | null) => {
        save(
            list.map((t) => (t.id === tid ? { ...t, planFile: file?.name } : t))
        );
    };

    const setProofFile = (tid: string, file?: File | null) => {
        save(
            list.map((t) => (t.id === tid ? { ...t, proofFile: file?.name } : t))
        );
    };

    const finalize = (tid: string) => {
        save(list.map((t) => (t.id === tid ? { ...t, finalized: true } : t)));
    };

    const downloadCSV = (t: Training) => {
        const rows = [
            ['Nume', 'Prezent', 'Absent motivat'],
            ...t.attendees.map((a) => [
                a.name,
                a.present ? 'Da' : 'Nu',
                a.absentMotivated ? 'Da' : 'Nu',
            ]),
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista-prezenta-${t.title.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const addTraining = () => {
        if (!draft.title || !draft.date) return;
        const t: Training = {
            id: 'T' + Date.now(),
            title: draft.title!,
            date: draft.date!,
            location: draft.location || '',
            section: draft.section || '',
            planFile: undefined,
            proofFile: undefined,
            finalized: false,
            attendees: [],
        };
        save([t, ...list]);
        setAddOpen(false);
        setDraft({ title: '', date: ymd(new Date()), location: '', section: '' });
    };

    /* ---- stiluri comune ---- */
    const card: React.CSSProperties = {
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        background: '#fff',
        boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
        padding: 16,
    };

    const asideCard: React.CSSProperties = {
        ...card,
        background: 'linear-gradient(180deg,#eff6ff,#f8fbff)',
        border: '1px solid #bfdbfe',
    };

    return (
        <div style={{ padding: 20 }}>
            {/* Înapoi */}
            <div style={{ marginBottom: 10 }}>
                <Link
                    href="/ssm-psi"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        textDecoration: 'none',
                        fontSize: 13,
                    }}
                >
                    ← Înapoi
                </Link>
            </div>

            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                Instruiri (SSM)
            </h1>
            <p style={{ margin: '6px 0 18px', opacity: 0.8 }}>
                Planificare, liste de prezență, dovezi și finalizare. Absenții motivați nu
                scad conformarea.
            </p>

            {/* layout: listă + raport */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 360px',
                    gap: 16,
                    alignItems: 'start',
                }}
            >
                {/* ==== stânga – lista instruiri ==== */}
                <div>
                    {/* bară filtre */}
                    <div
                        style={{
                            ...card,
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center',
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>Filtre</div>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Luna:
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                            />
                        </label>

                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Caută titlu/secție/locație..."
                            style={{
                                marginLeft: 'auto',
                                padding: '6px 10px',
                                borderRadius: 10,
                                border: '1px solid #e5e7eb',
                                minWidth: 260,
                            }}
                        />

                        <button
                            onClick={() => setAddOpen(true)}
                            type="button"
                            style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid #bfdbfe',
                                background: '#fff',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            + Adaugă instruire
                        </button>
                    </div>

                    {/* listă traininguri */}
                    <div style={{ display: 'grid', gap: 12 }}>
                        {filtered.map((t) => {
                            const total = t.attendees.length;
                            const prez = t.attendees.filter((a) => a.present).length;
                            const motiv = t.attendees.filter((a) => a.absentMotivated).length;
                            const nemot = total - prez - motiv;
                            const denom = prez + nemot;
                            const pct = denom === 0 ? 0 : Math.round((prez / denom) * 100);

                            return (
                                <div key={t.id} style={card}>
                                    {/* header card */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 700 }}>{t.title}</div>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            {pill(t.date, 'gray')}
                                            {t.section && pill(t.section, 'blue')}
                                            {t.location && pill(t.location, 'gray')}
                                            {t.finalized ? pill('Finalizată', 'green') : pill('În curs', 'orange')}
                                            {pill(`Conformare: ${pct}%`, 'blue')}
                                        </div>
                                        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                                            {btn(() => downloadCSV(t), 'Descarcă listă')}
                                            <label style={{ ...btn(() => { }, 'Încarcă plan', true).props.style, cursor: 'pointer' as any }}>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => setPlanFile(t.id, e.target.files?.[0])}
                                                />
                                                {t.planFile ? 'Schimbă plan' : 'Încarcă plan'}
                                            </label>
                                            <label style={{ ...btn(() => { }, 'Încarcă dovadă', true).props.style, cursor: 'pointer' as any }}>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => setProofFile(t.id, e.target.files?.[0])}
                                                />
                                                {t.proofFile ? 'Schimbă dovada' : 'Încarcă dovadă'}
                                            </label>
                                            {btn(() => finalize(t.id), 'Finalizează', !t.proofFile || t.finalized)}
                                        </div>
                                    </div>

                                    {/* info fișiere */}
                                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                        <span>Plan: <strong>{t.planFile || '—'}</strong></span>
                                        <span>Dovadă: <strong>{t.proofFile || '—'}</strong></span>
                                    </div>

                                    {/* participanți */}
                                    <div
                                        style={{
                                            marginTop: 10,
                                            paddingTop: 10,
                                            borderTop: '1px solid #eef2f7',
                                            display: 'grid',
                                            gap: 8,
                                        }}
                                    >
                                        {t.attendees.length === 0 && (
                                            <div style={{ opacity: 0.7, fontSize: 13 }}>Niciun participant adăugat. (se poate importa din planul HR)</div>
                                        )}
                                        {t.attendees.map((a) => (
                                            <div
                                                key={a.id}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr auto auto',
                                                    gap: 10,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{a.name}</div>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={a.present}
                                                        onChange={() => togglePresent(t.id, a.id)}
                                                    />
                                                    Prezent
                                                </label>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={a.absentMotivated}
                                                        onChange={() => toggleMotiv(t.id, a.id)}
                                                    />
                                                    Absent motivat
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div style={{ ...card, opacity: 0.75 }}>Nu există instruiri în luna selectată.</div>
                        )}
                    </div>
                </div>

                {/* ==== dreapta – raport lunar ==== */}
                <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'grid', gap: 12 }}>
                    <div style={asideCard}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Raport lunar</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>Luna: <strong>{month}</strong></div>
                            <div>Sesiuni: <strong>{kpi.sessions}</strong></div>
                            <div>Prezenți: <strong>{kpi.present}</strong></div>
                            <div>Absenți: <strong>{kpi.absent}</strong></div>
                            <div>Motivați: <strong>{kpi.motiv}</strong></div>
                            <div>Conformare: <strong>{kpi.conform}%</strong></div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ==== modal adăugare ==== */}
            {addOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.35)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 50,
                    }}
                >
                    <div
                        style={{
                            width: 'min(720px, 96vw)',
                            background: '#fff',
                            borderRadius: 16,
                            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: 12,
                                borderBottom: '1px solid #bfdbfe',
                                background: '#eff6ff',
                            }}
                        >
                            <b style={{ color: '#1e3a8a' }}>Adaugă instruire</b>
                            <button
                                onClick={() => setAddOpen(false)}
                                style={{
                                    marginLeft: 'auto',
                                    border: '1px solid #bfdbfe',
                                    background: '#fff',
                                    borderRadius: 8,
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                            <label style={{ display: 'grid', gap: 6 }}>
                                Titlu *
                                <input
                                    value={draft.title || ''}
                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                    placeholder="ex: Instruire periodică SSM – Secția X"
                                    style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                />
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Dată *
                                    <input
                                        type="date"
                                        value={draft.date || ymd(new Date())}
                                        onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Locație
                                    <input
                                        value={draft.location || ''}
                                        onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                                        placeholder="ex: Sala conferințe"
                                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    />
                                </label>
                            </div>

                            <label style={{ display: 'grid', gap: 6 }}>
                                Secția / Compartiment
                                <input
                                    value={draft.section || ''}
                                    onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))}
                                    placeholder="ex: ATI"
                                    style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                />
                            </label>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button
                                    type="button"
                                    onClick={() => setAddOpen(false)}
                                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}
                                >
                                    Anulează
                                </button>
                                <button
                                    type="button"
                                    onClick={addTraining}
                                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}
                                >
                                    Salvează
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
