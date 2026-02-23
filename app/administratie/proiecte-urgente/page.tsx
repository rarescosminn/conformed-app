'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout'; // dacă aliasul @ nu merge, schimbă pe: ../../../components/AdminCategoryLayout

/* ========= UI config ========= */
const ROW_HEIGHT = 72;
const GAP = 10;
/* ============================ */

type Tip = 'proiect' | 'urgenta';
type Stare = 'planificat' | 'in_derulare' | 'blocat' | 'finalizat';
type Severitate = 'scazuta' | 'medie' | 'ridicata' | 'critica';

type Item = {
    id: string;
    title: string;
    tip: Tip;
    critical?: boolean;
    stare?: Stare;            // proiecte
    severitate?: Severitate;  // urgențe
    startDate?: string;       // YYYY-MM-DD
    endDate?: string;
    tags?: string[];
};

const TIP_LABEL: Record<Tip, string> = { proiect: 'Proiect', urgenta: 'Urgență' };
const STARE_LABEL: Record<Stare, string> = {
    planificat: 'Planificat',
    in_derulare: 'În derulare',
    blocat: 'Blocat',
    finalizat: 'Finalizat',
};
const SEV_LABEL: Record<Severitate, string> = {
    scazuta: 'Scăzută',
    medie: 'Medie',
    ridicata: 'Ridicată',
    critica: 'Critică',
};

const chip = (style: React.CSSProperties = {}) =>
({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
    ...style,
} as React.CSSProperties);

const chipType = chip({ border: '1px solid #e5e7eb', background: '#f1f5f9', color: '#0f172a' });
const chipBlue = chip({ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af' });
const chipWarn = chip({ border: '1px solid #fdba74', background: '#fff7ed', color: '#9a3412' });
const chipDate = chip({ border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a' });

/* ====== Utils dată (RO, L–D) ====== */
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYMD = (s?: string) => (s ? new Date(s + 'T00:00:00') : null);
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
/** luni-based: 0=Luni..6=Duminică */
function weekdayRo(d: Date) { return (d.getDay() + 6) % 7; }

const LUNI = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
const LUNI_LUNAR = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

/* ====== Seed + localStorage ====== */
const STORAGE_KEY = 'proiecte-urgente-items';

const SEED: Item[] = [
    // Proiecte
    { id: 'PR_INIT', title: 'Inițiere proiect — cerere și obiectiv', tip: 'proiect', stare: 'planificat', startDate: '2025-09-02', tags: ['inițiere', 'obiectiv', 'brief'] },
    { id: 'PR_FEZ', title: 'Studiu fezabilitate și estimare cost', tip: 'proiect', critical: true, stare: 'planificat', startDate: '2025-09-10', tags: ['fezabilitate', 'buget'] },
    { id: 'PR_AVIZE', title: 'Aprobări buget și avize (DSP/ISU/alt)', tip: 'proiect', critical: true, stare: 'planificat', startDate: '2025-09-18', tags: ['buget', 'avize', 'legal'] },
    { id: 'PR_HSE', title: 'Plan SSM și PSI pe șantier (DPI, căi evacuare)', tip: 'proiect', critical: true, stare: 'in_derulare', startDate: '2025-09-22', tags: ['SSM', 'PSI', 'șantier'] },
    { id: 'PR_EXEC', title: 'Execuție — grafic lucrări și rapoarte progres', tip: 'proiect', stare: 'in_derulare', startDate: '2025-10-03', tags: ['execuție', 'grafic', 'raportare'] },
    { id: 'PR_DOC', title: 'Documentație „as-built” și actualizare planuri', tip: 'proiect', stare: 'in_derulare', startDate: '2025-10-12', tags: ['as-built', 'planuri'] },
    { id: 'PR_RECEPT', title: 'Recepție tehnică și punere în funcțiune', tip: 'proiect', critical: true, stare: 'in_derulare', startDate: '2025-10-20', tags: ['recepție', 'PIF'] },
    { id: 'PR_HAND', title: 'Predare operare și training utilizatori', tip: 'proiect', stare: 'finalizat', startDate: '2025-11-05', tags: ['predare', 'training'] },
    { id: 'PR_DEFECT', title: 'Perioadă remediere defecte și garanții', tip: 'proiect', stare: 'finalizat', startDate: '2025-11-18', tags: ['garanție', 'defecte'] },
    // Urgențe
    { id: 'UR_UTIL', title: 'Avarie utilități (energie/apă/gaz) — izolare și reluare', tip: 'urgenta', critical: true, severitate: 'critica', startDate: '2025-09-05', tags: ['utilități', 'izolare', 'SLA'] },
    { id: 'UR_FLOOD', title: 'Inundație/infiltrații — pompaj și uscare', tip: 'urgenta', severitate: 'ridicata', startDate: '2025-09-14', tags: ['inundație', 'pompaj'] },
    { id: 'UR_FIRE', title: 'Incendiu minor/fum — intervenție PSI și ventilare', tip: 'urgenta', critical: true, severitate: 'critica', startDate: '2025-10-01', tags: ['PSI', 'fum'] },
    { id: 'UR_LIFT', title: 'Defecțiune lift — blocare acces și anunț', tip: 'urgenta', critical: true, severitate: 'ridicata', startDate: '2025-10-07', tags: ['lift', 'acces'] },
    { id: 'UR_IT', title: 'Pană majoră IT/telefonie — comunicare și fallback', tip: 'urgenta', critical: true, severitate: 'ridicata', startDate: '2025-10-16', tags: ['IT', 'telefonie', 'fallback'] },
];

function useItems() {
    const [items, setItems] = useState<Item[]>([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            setItems(raw ? JSON.parse(raw) : SEED);
        } catch {
            setItems(SEED);
        }
    }, []);
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { }
    }, [items]);
    return { items, setItems };
}

/* ===== Modal „Adaugă” ===== */
function AddModal({
    open, onClose, onAdd,
}: { open: boolean; onClose: () => void; onAdd: (i: Item) => void }) {
    const [title, setTitle] = useState('');
    const [tip, setTip] = useState<Tip>('proiect');
    const [critical, setCritical] = useState(false);
    const [stare, setStare] = useState<Stare>('planificat');
    const [sev, setSev] = useState<Severitate>('medie');
    const [date, setDate] = useState(ymd(new Date()));

    useEffect(() => {
        if (!open) {
            setTitle(''); setTip('proiect'); setCritical(false);
            setStare('planificat'); setSev('medie'); setDate(ymd(new Date()));
        }
    }, [open]);

    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 70 }}>
            <div style={{ width: 'min(720px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                    <b style={{ color: '#1e3a8a' }}>Adaugă proiect/urgență</b>
                    <button onClick={onClose} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const id = `${tip}_${Date.now()}`;
                        onAdd({
                            id,
                            title: title.trim(),
                            tip,
                            critical,
                            stare: tip === 'proiect' ? stare : undefined,
                            severitate: tip === 'urgenta' ? sev : undefined,
                            startDate: date,
                        });
                        onClose();
                    }}
                    style={{ padding: 16, display: 'grid', gap: 10 }}
                >
                    <div style={{ display: 'grid', gap: 6 }}>
                        <label>Titlu</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="ex: Reamenajare ATI / Avarie apă la etaj 3"
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Tip:
                            <select value={tip} onChange={(e) => setTip(e.target.value as Tip)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                <option value="proiect">Proiect</option>
                                <option value="urgenta">Urgență</option>
                            </select>
                        </label>

                        {tip === 'proiect' ? (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                Stare:
                                <select value={stare} onChange={(e) => setStare(e.target.value as Stare)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                    <option value="planificat">Planificat</option>
                                    <option value="in_derulare">În derulare</option>
                                    <option value="blocat">Blocat</option>
                                    <option value="finalizat">Finalizat</option>
                                </select>
                            </label>
                        ) : (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                Severitate:
                                <select value={sev} onChange={(e) => setSev(e.target.value as Severitate)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                    <option value="scazuta">Scăzută</option>
                                    <option value="medie">Medie</option>
                                    <option value="ridicata">Ridicată</option>
                                    <option value="critica">Critică</option>
                                </select>
                            </label>
                        )}

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Data start:
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} />
                            Critic
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Anulează</button>
                        <button type="submit" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Adaugă</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ====== Calendar ====== */
function MonthCalendar({
    items, month, setMonth, onPickDay,
}: { items: Item[]; month: Date; setMonth: (d: Date) => void; onPickDay: (d: Date) => void }) {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const offset = weekdayRo(first); // 0..6 (L..D)
    const daysInMonth = last.getDate();

    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const it of items) {
            if (!it.startDate) continue;
            const d = parseYMD(it.startDate)!;
            if (d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()) {
                const key = ymd(d);
                map[key] = (map[key] || 0) + 1;
            }
        }
        return map;
    }, [items, month]);

    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div style={{ border: '1px solid #bfdbfe', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: 10, background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={{ padding: '6px 10px', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>←</button>
                <div style={{ margin: '0 auto', fontWeight: 700, color: '#1e3a8a' }}>
                    {LUNI_LUNAR[month.getMonth()]} {month.getFullYear()}
                </div>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={{ padding: '6px 10px', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>→</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#bfdbfe', padding: 1 }}>
                {LUNI.map(l => (
                    <div key={l} style={{ padding: '8px 6px', background: '#f8fbff', textAlign: 'center', fontSize: 12, color: '#1e3a8a', fontWeight: 700 }}>{l}</div>
                ))}

                {cells.map((d, idx) => {
                    const key = d ? ymd(d) : `e${idx}`;
                    const cnt = d ? (counts[ymd(d)] || 0) : 0;
                    return (
                        <div key={key} style={{ background: '#fff', minHeight: 72, display: 'grid', gridTemplateRows: 'auto 1fr', padding: 6 }}>
                            {d ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 12 }}>{d.getDate()}</div>
                                        {cnt > 0 && (
                                            <div title={`${cnt} element(e)`} style={{ fontSize: 11, padding: '0 6px', borderRadius: 999, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af' }}>
                                                {cnt}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onPickDay(d)}
                                        style={{ marginTop: 'auto', padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12 }}
                                    >
                                        Vezi
                                    </button>
                                </>
                            ) : <div />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ====== Pagina principală ====== */
type ViewMode = 'lista' | 'calendar';

export default function Page() {
    const { items, setItems } = useItems();
    const [q, setQ] = useState('');
    const [tip, setTip] = useState<'toate' | Tip>('toate');
    const [onlyCritic, setOnlyCritic] = useState(false);
    const [view, setView] = useState<ViewMode>('lista');
    const [addOpen, setAddOpen] = useState(false);

    // Calendar state
    const [month, setMonth] = useState(() => new Date());
    const [pickedDate, setPickedDate] = useState<Date | null>(null);

    const filtered = useMemo(() => {
        let list = items;
        if (tip !== 'toate') list = list.filter(i => i.tip === tip);
        if (onlyCritic) list = list.filter(i => i.critical);
        if (q.trim()) {
            const s = q.toLowerCase();
            list = list.filter(i =>
                i.title.toLowerCase().includes(s) || i.tags?.some(t => t.toLowerCase().includes(s))
            );
        }
        // Critice sus, apoi după startDate, apoi alfabetic
        return [...list].sort((a, b) => {
            const ca = a.critical ? 1 : 0, cb = b.critical ? 1 : 0;
            if (cb !== ca) return cb - ca;
            const ad = parseYMD(a.startDate)?.getTime() ?? 0;
            const bd = parseYMD(b.startDate)?.getTime() ?? 0;
            if (ad !== bd) return ad - bd;
            return a.title.localeCompare(b.title);
        });
    }, [items, q, tip, onlyCritic]);

    const dayItems = useMemo(() => {
        if (!pickedDate) return [];
        const key = ymd(pickedDate);
        return filtered.filter(i => i.startDate === key);
    }, [filtered, pickedDate]);

    const addItem = (i: Item) => setItems(prev => [i, ...prev]);

    return (
        <AdminCategoryLayout
            title="Proiecte și Urgențe"
            intro="Listă compactă și calendar cu elementele planificate. Titluri vizibile integral, fără ierarhii inutile."
            showBack
            links={{
                addTask: '/administratie/todo/new?cat=proiecte',
                questionnaire: '/administratie/chestionare?cat=proiecte',
                history: '/administratie/chestionare?cat=proiecte&view=istoric',
            }}
        >
            {/* Bara de control */}
            <div style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)', color: '#1e3a8a', borderRadius: 14, padding: 14, marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <b>Portofoliu proiecte și intervenții urgente</b>

                    {/* Tip */}
                    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                        {(['toate', 'proiect', 'urgenta'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setTip(v)}
                                style={{ padding: '6px 10px', borderRadius: 8, background: tip === v ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}
                            >
                                {v === 'toate' ? 'Toate' : TIP_LABEL[v]}
                            </button>
                        ))}
                    </div>

                    {/* Doar critice */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={onlyCritic} onChange={(e) => setOnlyCritic(e.target.checked)} />
                        Doar critice
                    </label>

                    {/* Căutare */}
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Caută titlu/tag…"
                        style={{ marginLeft: 'auto', padding: '8px 10px', borderRadius: 10, border: '1px solid #bfdbfe', minWidth: 260, background: '#fff', color: '#0f172a' }}
                    />

                    {/* Mod vizualizare */}
                    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                        <button onClick={() => setView('lista')} style={{ padding: '6px 10px', borderRadius: 8, background: view === 'lista' ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}>Listă</button>
                        <button onClick={() => setView('calendar')} style={{ padding: '6px 10px', borderRadius: 8, background: view === 'calendar' ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}>Calendar</button>
                    </div>

                    {/* Adaugă */}
                    <button onClick={() => setAddOpen(true)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', cursor: 'pointer' }}>
                        + Adaugă
                    </button>
                </div>
            </div>

            {/* Conținut */}
            {view === 'lista' ? (
                <ListView items={filtered} />
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: pickedDate ? 'minmax(320px,1fr) 420px' : 'minmax(320px,1fr)',
                        gap: 16,
                    }}
                >
                    <div>
                        <MonthCalendar
                            items={filtered}
                            month={month}
                            setMonth={setMonth}
                            // toggle: dacă apeși aceeași zi, deselectează și se închide panoul din dreapta
                            onPickDay={(d) => setPickedDate(prev => (prev && ymd(prev) === ymd(d) ? null : d))}
                        />
                    </div>

                    {pickedDate && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fff', minHeight: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ fontWeight: 700 }}>Programat la {ymd(pickedDate)}</div>
                                <button
                                    onClick={() => setPickedDate(null)}
                                    style={{ marginLeft: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', background: '#fff' }}
                                >
                                    Închide
                                </button>
                            </div>

                            {dayItems.length === 0 && (
                                <div style={{ opacity: 0.7, fontSize: 14 }}>Nu există elemente programate în această zi.</div>
                            )}

                            <div style={{ display: 'grid', gap: 8 }}>
                                {dayItems.map(i => <Row key={i.id} it={i} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AddModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addItem} />
        </AdminCategoryLayout>
    );
}

/* ====== Listă compactă (rânduri egale) ====== */
function ListView({ items }: { items: Item[] }) {
    return (
        <div style={{ marginTop: 12, width: '100%', display: 'grid', gap: GAP }}>
            {items.map(it => <Row key={it.id} it={it} />)}
            {items.length === 0 && <div style={{ opacity: 0.7, fontSize: 14 }}>Niciun element pentru filtrul curent.</div>}
        </div>
    );
}

function Row({ it }: { it: Item }) {
    const isUrg = it.tip === 'urgenta';
    return (
        <div
            style={{
                height: ROW_HEIGHT,
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto auto auto',
                alignItems: 'center',
                gap: 10,
                padding: '0 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                background: '#fff',
            }}
        >
            <div
                aria-hidden
                style={{
                    width: 36, height: 36, borderRadius: 10, border: '1px solid #bfdbfe',
                    background: '#eff6ff', display: 'grid', placeItems: 'center',
                    fontSize: 18, color: '#1e40af'
                }}
                title={isUrg ? 'Urgență' : 'Proiect'}
            >
                {isUrg ? '⚡' : '📋'}
            </div>

            {/* Titlu integral + taguri */}
            <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <span style={chipType}>{TIP_LABEL[it.tip]}</span>
                    {it.critical && <span style={chipWarn}>Critic</span>}
                    {it.stare && <span style={chipBlue}>{STARE_LABEL[it.stare]}</span>}
                    {it.severitate && <span style={chipBlue}>Severitate: {SEV_LABEL[it.severitate]}</span>}
                    {it.tags?.map(t => <span key={t} style={{ fontSize: 11, color: '#1e40af', opacity: 0.9 }}>#{t}</span>)}
                </div>
            </div>

            {/* Data */}
            <div style={{ justifySelf: 'end' }}>
                <span style={chipDate}>{it.startDate ? `Start: ${it.startDate}` : 'Fără dată'}</span>
            </div>

            {/* Acțiuni (placeholder) */}
            <button
                type="button"
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', color: '#1e3a8a', cursor: 'pointer', fontSize: 13 }}
                title="Deschide detalii (în curând)"
            >
                Deschide
            </button>
            <button
                type="button"
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontSize: 13 }}
                title="Creează task (în curând)"
            >
                + Task
            </button>
        </div>
    );
}
