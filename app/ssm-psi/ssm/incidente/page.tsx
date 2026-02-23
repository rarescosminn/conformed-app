'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ================== Tipuri ================== */
type Classification = 'incident' | 'accident_usor' | 'accident_grav' | 'accident_mortal';
type Status = 'inregistrat' | 'validat' | 'clasificat' | 'arhivat';

type Incident = {
    id: string;
    date: string;           // YYYY-MM-DD
    time?: string;          // HH:MM (opțional)
    location: string;
    personName: string;
    personSection: string;
    description: string;
    evidenceFile?: string;

    validated: boolean;     // de șef secție
    validatedBy?: string;
    classification?: Classification; // de responsabil SSM
    ssmNotes?: string;

    archived: boolean;
    createdAt: string;      // ISO
};

const CLASS_LABEL: Record<Classification, string> = {
    incident: 'Incident',
    accident_usor: 'Accident ușor',
    accident_grav: 'Accident grav',
    accident_mortal: 'Accident mortal',
};

const STORAGE_KEY = 'ssm-incidente-v1';
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/* ================== Seed / storage ================== */
const SEED: Incident[] = [
    {
        id: 'I' + Date.now(),
        date: ymd(new Date()),
        time: '10:30',
        location: 'Bloc operator – culoar acces',
        personName: 'Popescu Andrei',
        personSection: 'Bloc operator',
        description: 'Alunecare pe pardoseală umedă. Fără consecințe medicale.',
        validated: false,
        archived: false,
        createdAt: new Date().toISOString(),
    },
];

function loadIncidents(): Incident[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : SEED;
    } catch {
        return SEED;
    }
}
function saveIncidents(list: Incident[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
    } catch { }
}

/* ================== Stiluri mici ================== */
const card: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
    padding: 16,
};

const chip = (text: string, tone: 'gray' | 'blue' | 'green' | 'amber' | 'red') => {
    const toneStyle: Record<typeof tone, React.CSSProperties> = {
        gray: { border: '1px solid #e5e7eb', background: '#f8fafc', color: '#0f172a' },
        blue: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' },
        green: { border: '1px solid #bbf7d0', background: '#ecfdf5', color: '#047857' },
        amber: { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412' },
        red: { border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' },
    };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 12, ...toneStyle[tone] }}>
            {text}
        </span>
    );
};

/* ================== Pagina ================== */
export default function IncidentePage() {
    const [items, setItems] = useState<Incident[]>([]);
    const [q, setQ] = useState('');
    const [month, setMonth] = useState(() => {
        const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    });
    const [showArchived, setShowArchived] = useState(false);

    // modal adăugare
    const [addOpen, setAddOpen] = useState(false);
    const [draft, setDraft] = useState<Partial<Incident>>({
        date: ymd(new Date()),
        time: '',
        location: '',
        personName: '',
        personSection: '',
        description: '',
    });

    useEffect(() => {
        setItems(loadIncidents());
        const on = () => setItems(loadIncidents());
        window.addEventListener('storage', on);
        return () => window.removeEventListener('storage', on);
    }, []);

    const save = (next: Incident[]) => {
        setItems(next);
        saveIncidents(next);
    };

    const statusOf = (it: Incident): Status => {
        if (it.archived) return 'arhivat';
        if (it.classification) return 'clasificat';
        if (it.validated) return 'validat';
        return 'inregistrat';
    };

    /* ===== filtre ===== */
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return items
            .filter((it) => {
                if (!showArchived && it.archived) return false;
                const inMonth = it.date.startsWith(month);
                if (!inMonth) return false;
                if (!s) return true;
                return (
                    it.personName.toLowerCase().includes(s) ||
                    it.personSection.toLowerCase().includes(s) ||
                    it.location.toLowerCase().includes(s) ||
                    it.description.toLowerCase().includes(s)
                );
            })
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    }, [items, q, month, showArchived]);

    /* ===== statistici lunare ===== */
    const stats = useMemo(() => {
        const base = items.filter((i) => i.date.startsWith(month));
        const byClass: Record<Classification, number> = {
            incident: 0, accident_usor: 0, accident_grav: 0, accident_mortal: 0,
        };
        let inregistrate = 0, validate = 0, clasificate = 0, arhivate = 0;
        for (const it of base) {
            const st = statusOf(it);
            if (st === 'inregistrat') inregistrate++;
            else if (st === 'validat') validate++;
            else if (st === 'clasificat') clasificate++;
            else if (st === 'arhivat') arhivate++;
            if (it.classification) byClass[it.classification] += 1;
        }
        return { inregistrate, validate, clasificate, arhivate, byClass, total: base.length };
    }, [items, month]);

    /* ===== acțiuni ===== */
    const addIncident = () => {
        if (!draft.date || !draft.location || !draft.personName || !draft.personSection || !draft.description) return;
        const it: Incident = {
            id: 'I' + Date.now(),
            date: draft.date!,
            time: draft.time || '',
            location: draft.location!,
            personName: draft.personName!,
            personSection: draft.personSection!,
            description: draft.description!,
            evidenceFile: undefined,
            validated: false,
            validatedBy: undefined,
            classification: undefined,
            ssmNotes: '',
            archived: false,
            createdAt: new Date().toISOString(),
        };
        save([it, ...items]);
        setAddOpen(false);
        setDraft({ date: ymd(new Date()), time: '', location: '', personName: '', personSection: '', description: '' });
    };

    const setEvidence = (id: string, f?: File | null) => {
        save(items.map((it) => (it.id === id ? { ...it, evidenceFile: f?.name } : it)));
    };

    const validateIncident = (id: string) => {
        save(items.map((it) => (it.id === id ? { ...it, validated: true, validatedBy: 'Șef secție' } : it)));
    };

    const saveClassification = (id: string, cls: Classification, notes: string) => {
        save(items.map((it) => (it.id === id ? { ...it, classification: cls, ssmNotes: notes } : it)));
    };

    const archiveIncident = (id: string) => {
        save(items.map((it) => (it.id === id ? { ...it, archived: true } : it)));
    };

    const exportITM = (it: Incident) => {
        // export .doc simplu (HTML compatibil MS Word)
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Fisa ITM</title></head>
<body>
  <h2>Fișă incident / accident (ITM) – ${CLASS_LABEL[it.classification as Classification] || 'Nespecificat'}</h2>
  <p><b>Data:</b> ${it.date} ${it.time || ''}</p>
  <p><b>Locația:</b> ${it.location}</p>
  <p><b>Persoană afectată:</b> ${it.personName} (${it.personSection})</p>
  <p><b>Descriere:</b> ${it.description}</p>
  <p><b>Validare șef secție:</b> ${it.validated ? `Da (${it.validatedBy || ''})` : 'Nu'}</p>
  <p><b>Clasificare SSM:</b> ${it.classification ? CLASS_LABEL[it.classification] : '—'}</p>
  <p><b>Note SSM:</b> ${it.ssmNotes || '—'}</p>
  <p><b>Dovadă atașată:</b> ${it.evidenceFile || '—'}</p>
  <hr/>
  <p style="font-size:12px;opacity:.8">Document generat din aplicație – ${new Date().toLocaleString()}</p>
</body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeTitle = it.personName.replace(/\s+/g, '_');
        a.href = url;
        a.download = `Fisa_ITM_${safeTitle}_${it.date}.doc`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ================== UI ================== */
    return (
        <div style={{ padding: 20 }}>
            {/* Înapoi */}
            <div style={{ marginBottom: 10 }}>
                <Link
                    href="/ssm-psi"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
                        textDecoration: 'none', fontSize: 13,
                    }}
                >
                    ← Înapoi
                </Link>
            </div>

            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Incidente / Accidente (SSM)</h1>
            <p style={{ margin: '6px 0 18px', opacity: 0.8 }}>
                Înregistrare inițială → Validare șef secție → Clasificare SSM → Export fișă ITM → Arhivare.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
                {/* ===== stânga: listă + filtre ===== */}
                <div>
                    {/* bară filtre */}
                    <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
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
                            placeholder="Caută (nume, secție, locație, descriere)…"
                            style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb', minWidth: 280 }}
                        />

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                            Arată arhivate
                        </label>

                        <button
                            onClick={() => setAddOpen(true)}
                            type="button"
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                        >
                            + Înregistrează incident
                        </button>
                    </div>

                    {/* listă incidente */}
                    <div style={{ display: 'grid', gap: 12 }}>
                        {filtered.map((it) => {
                            const st = statusOf(it);
                            return (
                                <div key={it.id} style={card}>
                                    {/* header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 700 }}>{it.personName}</div>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            {chip(`${it.date}${it.time ? ' ' + it.time : ''}`, 'gray')}
                                            {chip(it.personSection, 'blue')}
                                            {chip(it.location, 'gray')}
                                            {st === 'inregistrat' && chip('Înregistrat', 'amber')}
                                            {st === 'validat' && chip('Validat', 'green')}
                                            {st === 'clasificat' && chip('Clasificat', 'green')}
                                            {st === 'arhivat' && chip('Arhivat', 'gray')}
                                            {it.classification && chip(CLASS_LABEL[it.classification], it.classification === 'incident' ? 'blue' : it.classification === 'accident_usor' ? 'amber' : it.classification === 'accident_grav' ? 'red' : 'red')}
                                        </div>
                                        <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
                                            Înregistrat: {new Date(it.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* descriere */}
                                    <div style={{ marginTop: 8, fontSize: 14, color: '#0f172a' }}>
                                        {it.description}
                                    </div>

                                    {/* fișiere */}
                                    <div style={{ marginTop: 8, fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' as any }}>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                                                onChange={(e) => setEvidence(it.id, e.target.files?.[0])} />
                                            {chip(it.evidenceFile ? 'Schimbă dovada' : 'Încarcă dovadă', 'gray')}
                                        </label>
                                        <span style={{ opacity: 0.8 }}>Dovadă: <b>{it.evidenceFile || '—'}</b></span>
                                    </div>

                                    {/* acțiuni pe etape */}
                                    <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                                        {/* Validare șef secție */}
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ width: 160, fontWeight: 600 }}>Validare șef secție</div>
                                            <button
                                                onClick={() => validateIncident(it.id)}
                                                disabled={it.validated || it.archived}
                                                type="button"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 10,
                                                    border: '1px solid #bfdbfe',
                                                    background: it.validated || it.archived ? '#f1f5f9' : '#fff',
                                                    fontSize: 13,
                                                    cursor: it.validated || it.archived ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {it.validated ? 'Validat' : 'Validează'}
                                            </button>
                                            <span style={{ fontSize: 13, opacity: 0.85 }}>
                                                {it.validated ? `de: ${it.validatedBy || '—'}` : 'nevalidat'}
                                            </span>
                                        </div>

                                        {/* Clasificare SSM */}
                                        <SSMClassifyRow
                                            it={it}
                                            onSave={(cls, notes) => saveClassification(it.id, cls, notes)}
                                            disabled={!it.validated || it.archived}
                                        />

                                        {/* Export + Arhivare */}
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ width: 160, fontWeight: 600 }}>Export & arhivare</div>
                                            <button
                                                onClick={() => exportITM(it)}
                                                disabled={!it.classification || it.archived}
                                                type="button"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 10,
                                                    border: '1px solid #bfdbfe',
                                                    background: !it.classification || it.archived ? '#f1f5f9' : '#fff',
                                                    fontSize: 13,
                                                    cursor: !it.classification || it.archived ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Descarcă fișă ITM
                                            </button>

                                            <button
                                                onClick={() => archiveIncident(it.id)}
                                                disabled={!it.classification || it.archived}
                                                type="button"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 10,
                                                    border: '1px solid #e5e7eb',
                                                    background: it.archived ? '#f1f5f9' : '#fff',
                                                    fontSize: 13,
                                                    cursor: !it.classification || it.archived ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Arhivează
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div style={{ ...card, opacity: 0.75 }}>Nu există înregistrări pentru filtrele selectate.</div>
                        )}
                    </div>
                </div>

                {/* ===== dreapta: statistici ===== */}
                <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'grid', gap: 12 }}>
                    <div style={{ ...card, border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Statistici lunare</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>Total înregistrări: <strong>{stats.total}</strong></div>
                            <div>Înregistrat: <strong>{stats.inregistrate}</strong></div>
                            <div>Validat: <strong>{stats.validate}</strong></div>
                            <div>Clasificat: <strong>{stats.clasificate}</strong></div>
                            <div>Arhivat: <strong>{stats.arhivate}</strong></div>
                        </div>
                        <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>{chip('Incident', 'blue')} <strong>{stats.byClass.incident}</strong></div>
                            <div>{chip('Accident ușor', 'amber')} <strong>{stats.byClass.accident_usor}</strong></div>
                            <div>{chip('Accident grav', 'red')} <strong>{stats.byClass.accident_grav}</strong></div>
                            <div>{chip('Accident mortal', 'red')} <strong>{stats.byClass.accident_mortal}</strong></div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ===== modal adăugare ===== */}
            {addOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
                    <div style={{ width: 'min(720px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                            <b style={{ color: '#1e3a8a' }}>Înregistrează incident/accident</b>
                            <button onClick={() => setAddOpen(false)} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Data *
                                    <input type="date" value={draft.date || ymd(new Date())} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Ora
                                    <input type="time" value={draft.time || ''} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                            </div>

                            <label style={{ display: 'grid', gap: 6 }}>
                                Locație *
                                <input value={draft.location || ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="ex: Secția X / hol / sala Y" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Persoană afectată *
                                    <input value={draft.personName || ''} onChange={(e) => setDraft((d) => ({ ...d, personName: e.target.value }))} placeholder="Nume Prenume" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'grid', gap: 6 }}>
                                    Secție *
                                    <input value={draft.personSection || ''} onChange={(e) => setDraft((d) => ({ ...d, personSection: e.target.value }))} placeholder="ex: ATI / UPU / Bloc operator" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                </label>
                            </div>

                            <label style={{ display: 'grid', gap: 6 }}>
                                Descriere *
                                <textarea value={draft.description || ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={4} placeholder="Ce s-a întâmplat, împrejurări, martori…" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', resize: 'vertical' }} />
                            </label>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button type="button" onClick={() => setAddOpen(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Anulează</button>
                                <button type="button" onClick={addIncident} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Salvează</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ====== subcomponentă pentru clasificare SSM ====== */
function SSMClassifyRow({
    it,
    onSave,
    disabled,
}: {
    it: Incident;
    onSave: (cls: Classification, notes: string) => void;
    disabled: boolean;
}) {
    const [cls, setCls] = useState<Classification>(it.classification || 'incident');
    const [notes, setNotes] = useState<string>(it.ssmNotes || '');

    useEffect(() => {
        setCls((it.classification as Classification) || 'incident');
        setNotes(it.ssmNotes || '');
    }, [it.id]); // reset la schimbarea elementului

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 160, fontWeight: 600 }}>Clasificare SSM</div>
                <select
                    value={cls}
                    onChange={(e) => setCls(e.target.value as Classification)}
                    disabled={disabled}
                    style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                >
                    <option value="incident">Incident</option>
                    <option value="accident_usor">Accident ușor</option>
                    <option value="accident_grav">Accident grav</option>
                    <option value="accident_mortal">Accident mortal</option>
                </select>
                <button
                    onClick={() => onSave(cls, notes)}
                    disabled={disabled}
                    type="button"
                    style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid #bfdbfe',
                        background: disabled ? '#f1f5f9' : '#fff',
                        fontSize: 13,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                >
                    Salvează
                </button>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
                Note SSM
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={disabled}
                    placeholder="Observații, măsuri imediate, recomandări…"
                    style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', resize: 'vertical' }}
                />
            </label>
        </div>
    );
}
