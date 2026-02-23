'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

/** --- Alergeni (conform codurilor din PDF-urile spitalului) --- */
const ALLERGENS = [
    { id: 1, abbr: 'GLU', name: 'Cereale cu gluten (grâu, secară, orz, ovăz) & derivate' },
    { id: 2, abbr: 'OU', name: 'Ouă & derivate' },
    { id: 3, abbr: 'PES', name: 'Pește & derivate' },
    { id: 4, abbr: 'LAP', name: 'Lapte & derivate (incl. lactoză)' },
    { id: 5, abbr: 'TEL', name: 'Țelină & derivate' },
    { id: 6, abbr: 'MUS', name: 'Muștar & derivate' },
    { id: 7, abbr: 'CONG', name: 'Produs congelat' },
    { id: 8, abbr: 'SOI', name: 'Soia & derivate' },
] as const;
type AllergenId = typeof ALLERGENS[number]['id'];

type MealKey = 'breakfast' | 'lunch' | 'dinner';
const MEALS: { key: MealKey; label: string }[] = [
    { key: 'breakfast', label: 'Mic dejun' },
    { key: 'lunch', label: 'Prânz' },
    { key: 'dinner', label: 'Cină' },
];

type Dish = {
    name: string;
    portion: string;     // ex. “150 g” sau “350 ml”
    kcal?: number;       // kcal / porție
    qty?: string;        // cantitate/observații
    allergens: AllergenId[];
};

type DayKey = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Luni…Duminică
type State = { [day in DayKey]?: { [meal in MealKey]?: Dish[] } };

/* ---------- Utils săptămână curentă ---------- */
function mondayOfWeek(d = new Date()) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // 0=Luni
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
}
const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ---------- Stiluri mici ---------- */
const card: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: 'rgba(255,255,255,0.65)', padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)' };
const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, lineHeight: 1.6, whiteSpace: 'nowrap' };

/* =========================================================
   REȚETAR – formular + import (modal)
========================================================= */
type RetetarForm = {
    denumire?: string;
    gramaj?: string;
    ingrediente?: string;
    alergeni?: string;
    valori?: string;
    nrRetetar?: string;
    dataRevizie?: string;
};
const REQUIRED: (keyof RetetarForm)[] = ['denumire', 'gramaj', 'ingrediente'];

/* Heuristici parsare text */
function parseRetetarText(raw: string, seed?: RetetarForm, overwrite = true): RetetarForm {
    const txt = (raw || '').replace(/\r/g, '').trim();
    const rx = {
        denumire: /(Denumire\s*(?:produs)?|Produs)\s*:?\s*([^\n]+)$/gim,
        gramaj: /(Gramaj|Cantitate|Greutate|Porție)\s*:?\s*([^\n]+)$/gim,
        alergeni: /(Alergeni|Alergen\s*declarați)\s*:?\s*([\s\S]*?)(?:\n[A-ZĂÂÎȘȚ].{2,}|$)/gim,
        ingrediente: /(Ingrediente|Compoziție)\s*:?\s*([\s\S]*?)(?:\n[A-ZĂÂÎȘȚ].{2,}|$)/gim,
        valori: /(Valori(?:\s+nutriționale)?|Valori\s*energetice)\s*:?\s*([\s\S]*?)(?:\n[A-ZĂÂÎȘȚ].{2,}|$)/gim,
        nrRetetar: /(Nr\.?\s*(?:rețetar|retetar)|Rețetar\s*nr\.?)\s*:?\s*([^\n]+)/gim,
        dataRevizie: /(Data\s*(?:reviziei|emisiei|actualizării)|Revizie\s*data)\s*:?\s*([^\n]+)/gim,
    };
    const grabLast = (re: RegExp) => {
        let m: RegExpExecArray | null, last: string | undefined;
        while ((m = re.exec(txt))) last = (m[2] ?? m[1])?.toString();
        return last?.trim();
    };
    const grabBlock = (re: RegExp) => {
        let m: RegExpExecArray | null; const all: string[] = [];
        while ((m = re.exec(txt))) all.push(((m[2] ?? m[1]) || '').toString().trim());
        return all.length ? all[all.length - 1].replace(/[ \t]{2,}/g, ' ') : undefined;
    };

    const found: RetetarForm = {
        denumire: grabLast(rx.denumire) || txt.split('\n')[0]?.trim(),
        gramaj: grabLast(rx.gramaj),
        alergeni: grabBlock(rx.alergeni),
        ingrediente: grabBlock(rx.ingrediente),
        valori: grabBlock(rx.valori),
        nrRetetar: grabLast(rx.nrRetetar),
        dataRevizie: grabLast(rx.dataRevizie),
    };

    const base = seed ?? {};
    const out: RetetarForm = {};
    (Object.keys(found) as (keyof RetetarForm)[]).forEach((k) => {
        const v = (found[k] ?? '').toString().trim();
        if (!overwrite && (base[k] ?? '').toString().trim()) out[k] = base[k];
        else out[k] = v || base[k];
    });
    return out;
}

function validateRetetar(r: RetetarForm) {
    const e: Partial<Record<keyof RetetarForm, string>> = {};
    REQUIRED.forEach((k) => { if (!(r[k] ?? '').toString().trim()) e[k] = 'Obligatoriu'; });
    return e;
}

/* Sugestie alergeni → AllergenId din text */
function suggestAllergenIds(text: string): AllergenId[] {
    const t = (text || '').toLowerCase();
    const out: AllergenId[] = [];
    if (/gluten|gr[âa]u|secar[ăa]|orz|ov[aă]z/.test(t)) out.push(1);
    if (/\bou(ă|a)?\b|ouă|oua/.test(t)) out.push(2);
    if (/pe[șs]te/.test(t)) out.push(3);
    if (/lapte|lactoz[ăa]/.test(t)) out.push(4);
    if (/țelin[ăa]|telina|telină/.test(t)) out.push(5);
    if (/mu[șs]tar/.test(t)) out.push(6);
    if (/congelat/.test(t)) out.push(7);
    if (/soia|soi\b/.test(t)) out.push(8);
    return Array.from(new Set(out));
}

/* =========================================================
   Pagina
========================================================= */
export default function RetetarPage() {
    const search = useSearchParams();
    const router = useRouter();

    const weekStart = useMemo(() => mondayOfWeek(new Date()), []);
    const weekEnd = useMemo(() => { const d = new Date(weekStart); d.setDate(d.getDate() + 6); return d; }, [weekStart]);

    const todayIdx = ((new Date().getDay() + 6) % 7 + 1) as DayKey;
    const [selectedDay, setSelectedDay] = useState<DayKey>(todayIdx);
    const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');

    const storageKey = useMemo(() => `bucatarie-retetar-${ymd(weekStart)}`, [weekStart]);

    /* ------ state meniu (codul tău) ------ */
    const [data, setData] = useState<State>({});
    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (raw) { try { setData(JSON.parse(raw)); } catch { } }
    }, [storageKey]);
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }, [data, storageKey]);

    const [dishForm, setDishForm] = useState<Dish>({ name: '', portion: '', qty: '', kcal: undefined, allergens: [] });
    const dishes: Dish[] = useMemo(() => data[selectedDay]?.[selectedMeal] || [], [data, selectedDay, selectedMeal]);

    const addDish = () => {
        if (!dishForm.name.trim() || !dishForm.portion.trim()) return;
        setData((prev) => {
            const day = prev[selectedDay] ?? {};
            const list = (day[selectedMeal] ?? []).slice();
            list.push({ ...dishForm, kcal: dishForm.kcal ? Number(dishForm.kcal) : undefined });
            return { ...prev, [selectedDay]: { ...day, [selectedMeal]: list } };
        });
        setDishForm({ name: '', portion: '', qty: '', kcal: undefined, allergens: [] });
    };
    const removeDish = (i: number) => {
        setData((prev) => {
            const day = prev[selectedDay];
            if (!day) return prev;
            const list = (day[selectedMeal] ?? []).slice();
            list.splice(i, 1);
            return { ...prev, [selectedDay]: { ...day, [selectedMeal]: list } };
        });
    };

    const toggleAllergen = (a: AllergenId) => {
        setDishForm((f) => {
            const has = f.allergens.includes(a);
            return { ...f, allergens: has ? f.allergens.filter((x) => x !== a) : [...f.allergens, a] };
        });
    };

    /* ------ modal rețetar ------ */
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<'edit' | 'import'>('edit');

    // auto-open din query: ?open=form&tab=import
    useEffect(() => {
        if (search.get('open') === 'form') {
            setOpen(true);
            setTab((search.get('tab') === 'import' ? 'import' : 'edit') as 'edit' | 'import');
        }
    }, [search]);

    // cheie separată pentru draft rețetar (pe săptămână + zi + masă)
    const formStorageKey = useMemo(
        () => `retetar-form-${ymd(weekStart)}-${selectedDay}-${selectedMeal}`,
        [weekStart, selectedDay, selectedMeal]
    );

    const [retForm, setRetForm] = useState<RetetarForm>({});
    const [srcText, setSrcText] = useState('');
    const [overwrite, setOverwrite] = useState(true);
    const [retErrors, setRetErrors] = useState<Partial<Record<keyof RetetarForm, string>>>({});

    useEffect(() => {
        try {
            const raw = localStorage.getItem(formStorageKey);
            if (raw) {
                const { form, src } = JSON.parse(raw) as { form: RetetarForm; src?: string };
                setRetForm(form || {});
                setSrcText(src || '');
            } else {
                setRetForm({});
                setSrcText('');
            }
        } catch { }
    }, [formStorageKey]);

    const saveRetLocal = () => localStorage.setItem(formStorageKey, JSON.stringify({ form: retForm, src: srcText }));

    const exportRetJson = () => {
        const payload = { meta: { saptamana: ymd(weekStart), zi: selectedDay, masa: selectedMeal }, retetar: retForm };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `retetar-${ymd(weekStart)}-${selectedDay}-${selectedMeal}.json`; a.click();
        URL.revokeObjectURL(url);
    };
    const exportSrcTxt = () => {
        const blob = new Blob([srcText || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `retetar-src-${ymd(weekStart)}-${selectedDay}-${selectedMeal}.txt`; a.click();
        URL.revokeObjectURL(url);
    };

    const detectFromSrc = () => {
        const next = parseRetetarText(srcText, retForm, overwrite);
        setRetForm(next);
        setRetErrors({});
        saveRetLocal();
        setTab('edit');
    };

    const pushToDishForm = () => {
        setDishForm((p) => ({
            ...p,
            name: retForm.denumire || p.name,
            portion: retForm.gramaj || p.portion,
            allergens: suggestAllergenIds(`${retForm.alergeni || ''} ${retForm.ingrediente || ''}`),
        }));
        setOpen(false);
    };

    /* ---------- UI ---------- */
    return (
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* ====== COL STÂNGA ====== */}
            <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Rețetar — selecție zi & masă</h1>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Săptămâna {ymd(weekStart)} – {ymd(weekEnd)}</div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Ziua:
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(Number(e.target.value) as DayKey)}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
                        >
                            <option value={1}>Luni</option><option value={2}>Marți</option><option value={3}>Miercuri</option>
                            <option value={4}>Joi</option><option value={5}>Vineri</option><option value={6}>Sâmbătă</option><option value={7}>Duminică</option>
                        </select>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Masa:
                        <select
                            value={selectedMeal}
                            onChange={(e) => setSelectedMeal(e.target.value as MealKey)}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
                        >
                            {MEALS.map((m) => (<option key={m.key} value={m.key}>{m.label}</option>))}
                        </select>
                    </label>

                    <Link
                        href="/administratie/bucatarie"
                        style={{ marginLeft: 'auto', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(0,0,0,0.12)', padding: '8px 12px', borderRadius: 10 }}
                    >
                        ← Înapoi la Bucătărie
                    </Link>

                    {/* buton nou: Editează rețetar (deschide modal) */}
                    <button
                        onClick={() => setOpen(true)}
                        style={{ fontSize: 13, border: '1px solid rgba(0,0,0,0.12)', padding: '8px 12px', borderRadius: 10, background: 'white', cursor: 'pointer' }}
                    >
                        Editează rețetar
                    </button>
                </div>

                {/* MENIU CURENT */}
                <section style={{ ...card, marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>Meniu pentru selecția curentă</h2>
                        <button
                            type="button"
                            title="Import din PDF – va veni ulterior"
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'not-allowed', opacity: 0.6 }}
                            disabled
                        >
                            Import din PDF
                        </button>
                    </div>

                    {dishes.length === 0 ? (
                        <p style={{ marginTop: 10, opacity: 0.8, fontSize: 14 }}>Nu există încă preparate pentru această zi și masă.</p>
                    ) : (
                        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                            {dishes.map((d, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) 120px 100px 1fr auto', gap: 10, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                                        <div style={{ fontSize: 12, opacity: 0.75 }}>{d.qty || ''}</div>
                                    </div>
                                    <div>{d.portion}</div>
                                    <div>{d.kcal ? `${d.kcal} kcal` : '—'}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {d.allergens.length ? (
                                            d.allergens.map((a) => {
                                                const al = ALLERGENS.find((x) => x.id === a)!;
                                                return (<span key={a} style={chip} title={al.name}>{al.abbr}</span>);
                                            })
                                        ) : (<span style={{ ...chip, opacity: 0.7 }}>Fără alergeni</span>)}
                                    </div>
                                    <button onClick={() => removeDish(i)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', fontSize: 12 }}>Șterge</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* FORMULAR ADĂUGARE PREPARAT */}
                <section style={{ ...card, marginTop: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Adaugă preparat</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) 120px 100px 1fr', gap: 10, marginTop: 10 }}>
                        <input placeholder="Denumire" value={dishForm.name} onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }} />
                        <input placeholder="Porție (ex: 150 g / 350 ml)" value={dishForm.portion} onChange={(e) => setDishForm({ ...dishForm, portion: e.target.value })}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }} />
                        <input type="number" placeholder="kcal" value={dishForm.kcal ?? ''} onChange={(e) => setDishForm({ ...dishForm, kcal: e.target.value ? Number(e.target.value) : undefined })}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }} />
                        <input placeholder="Cantitate / detalii (opțional)" value={dishForm.qty || ''} onChange={(e) => setDishForm({ ...dishForm, qty: e.target.value })}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }} />
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {ALLERGENS.map((a) => (
                            <label key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, paddingRight: 6, borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                                <input type="checkbox" checked={dishForm.allergens.includes(a.id)} onChange={() => toggleAllergen(a.id)} />
                                <span title={a.name}>{a.abbr}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ marginTop: 10 }}>
                        <button onClick={addDish} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer' }}>
                            Adaugă la meniu
                        </button>
                    </div>
                </section>
            </div>

            {/* ====== COL DREAPTA ====== */}
            <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={card}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Legenda alergeni</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {ALLERGENS.map((a) => (
                            <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ ...chip, width: 56, justifyContent: 'center' }}>{a.abbr}</span>
                                <span style={{ fontSize: 13 }}>{a.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={card}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Următorul pas</div>
                    <div style={{ fontSize: 13 }}>
                        „Import din PDF” va precompleta meniul pentru zi & masă (inclusiv alergeni).
                    </div>
                </div>
            </aside>

            {/* ====== MODAL REȚETAR ====== */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
                    <div style={{ width: 'min(1100px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: 'white', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>Editează rețetar · {MEALS.find(m => m.key === selectedMeal)?.label} ({['', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'][selectedDay]})</div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: 4 }}>
                                <button onClick={() => setTab('edit')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'edit' ? '#f5f5f5' : 'transparent' }}>Editează</button>
                                <button onClick={() => setTab('import')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'import' ? '#f5f5f5' : 'transparent' }}>Importă</button>
                            </div>
                            <button onClick={() => setOpen(false)} aria-label="Închide" style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer' }}>✕</button>
                        </div>

                        {tab === 'edit' ? (
                            <div style={{ padding: 16 }}>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    <Field label="Denumire produs *" value={retForm.denumire || ''} onChange={(v) => setRetForm(p => ({ ...p, denumire: v }))} placeholder="Ex: Supă cremă de legume" error={retErrors.denumire} />
                                    <Field label="Gramaj / Porție *" value={retForm.gramaj || ''} onChange={(v) => setRetForm(p => ({ ...p, gramaj: v }))} placeholder="Ex: 350 g" error={retErrors.gramaj} />
                                    <Area label="Ingrediente *" value={retForm.ingrediente || ''} onChange={(v) => setRetForm(p => ({ ...p, ingrediente: v }))} placeholder="morcov, țelină, cartof, ceapă..." rows={4} error={retErrors.ingrediente} />
                                    <Area label="Alergeni" value={retForm.alergeni || ''} onChange={(v) => setRetForm(p => ({ ...p, alergeni: v }))} placeholder="țelină, lapte, gluten" rows={3} />
                                    <Area label="Valori nutriționale" value={retForm.valori || ''} onChange={(v) => setRetForm(p => ({ ...p, valori: v }))} placeholder="Energie 250 kcal/porție; Proteine 6 g..." rows={4} />
                                    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                                        <Field label="Rețetar nr." value={retForm.nrRetetar || ''} onChange={(v) => setRetForm(p => ({ ...p, nrRetetar: v }))} placeholder="RT-045/2025" />
                                        <Field label="Data revizie" value={retForm.dataRevizie || ''} onChange={(v) => setRetForm(p => ({ ...p, dataRevizie: v }))} placeholder="18.08.2025" />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12 }}>
                                    <button onClick={() => setRetErrors(validateRetetar(retForm))} style={btn}>Validează</button>
                                    <button onClick={saveRetLocal} style={btn}>Salvează local</button>
                                    <button onClick={exportRetJson} style={btn}>Export JSON</button>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                        <button onClick={pushToDishForm} title="Umple formularul de mai jos (Adaugă preparat)" style={btn}>
                                            Trimite în formularul de adăugare
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: 16 }}>
                                <p style={{ marginTop: 0, fontSize: 13, opacity: 0.8 }}>
                                    Lipește textul din rețetar (din PDF sau altă sursă). Apoi „Detectează câmpuri”, salvează și revino pe tab-ul Editează.
                                </p>
                                <textarea value={srcText} onChange={(e) => setSrcText(e.target.value)}
                                    className="no-tailwind" // (ignoră, doar ca marker)
                                    style={{ width: '100%', height: 300, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, lineHeight: 1.6 }}
                                    placeholder={[
                                        'Exemplu:',
                                        'Denumire produs: Supă cremă de legume',
                                        'Gramaj: 350 g',
                                        'Ingrediente: morcov, țelină, cartof, ceapă...',
                                        'Alergeni: țelină',
                                        'Valori nutriționale: Energie 250 kcal/porție...',
                                        'Rețetar nr.: RT-045/2025',
                                        'Data reviziei: 18.08.2025',
                                    ].join('\n')}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                        <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Suprascrie câmpurile existente
                                    </label>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                        <button onClick={detectFromSrc} style={btn}>Detectează câmpuri</button>
                                        <button onClick={() => setSrcText('')} style={btn}>Curăță</button>
                                        <button onClick={exportSrcTxt} style={btn}>Export TXT</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* --- UI mici --- */
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', fontSize: 13 };

function Field({
    label, value, onChange, placeholder, error,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; }) {
    return (
        <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid ${error ? '#f3b4b4' : 'rgba(0,0,0,0.12)'}` }} />
            {error && <div style={{ fontSize: 12, color: '#b42318' }}>{error}</div>}
        </div>
    );
}
function Area({
    label, value, onChange, placeholder, rows = 4, error,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; error?: string; }) {
    return (
        <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
            <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
                style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid ${error ? '#f3b4b4' : 'rgba(0,0,0,0.12)'}`, lineHeight: 1.6 }} />
            {error && <div style={{ fontSize: 12, color: '#b42318' }}>{error}</div>}
        </div>
    );
}
