'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SacEntry, DensitatePreset, DailyReport, MonthlyLock } from '@/lib/mediu-types';
import { LS, notifyMediu } from '@/lib/mediu-bridge';

/* ===== Styles (ASCII only) ===== */
const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 700 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };
const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    padding: 16,
};
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };
const small: React.CSSProperties = { fontSize: 12, opacity: 0.8 };

/* ===== Utils ===== */
const todayISO = () => new Date().toISOString().slice(0, 10);
const LtoM3 = (l: number) => l / 1000;

// First business day of current month (Mon-Fri)
function isFirstBusinessDayOfMonth(d: Date = new Date()): boolean {
    const y = d.getFullYear();
    const m = d.getMonth();
    for (let day = 1; day <= 7; day++) {
        const dt = new Date(y, m, day);
        const wd = dt.getDay(); // 0 Sun, 1 Mon, ... 6 Sat
        if (wd >= 1 && wd <= 5) return d.toDateString() === dt.toDateString();
    }
    return false;
}
// format determinist DD.MM.YYYY dintr-un string ISO "YYYY-MM-DD"
function formatRO(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
}
// LS helpers
function lsRead<T = any>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}
function lsWrite(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
}

/* ===== Parse waste codes from file (PDF/TXT/CSV/JSON) ===== */
async function extractCodesFromFile(file: File): Promise<string[]> {
    const text = await file.text().catch(() => '');
    if (!text) return [];

    // Try JSON: ["20 03 01"] or [{cod:"20 03 01"}]
    try {
        const j = JSON.parse(text);
        if (Array.isArray(j)) {
            if (j.length && typeof j[0] === 'string') return normalizeCodes(j as string[]);
            if (j.length && typeof j[0] === 'object') {
                const arr = (j as any[]).map(o => o.cod || o.code || o.cod_deseu || o.codDeseu).filter(Boolean);
                return normalizeCodes(arr);
            }
        }
    } catch {
        // not JSON, fall through
    }

    // TXT/CSV/PDF (selectable text): pick patterns NN NN NN
    const found = Array.from(text.matchAll(/\b(\d{2})\s?(\d{2})\s?(\d{2})\b/g)).map(m => `${m[1]} ${m[2]} ${m[3]}`);
    return normalizeCodes(found);
}
function normalizeCodes(codes: string[]): string[] {
    const clean = codes
        .map(c => c.trim().replace(/[^0-9 ]/g, '').replace(/\s+/g, ' '))
        .map(c => (c.length === 6 ? `${c.slice(0, 2)} ${c.slice(2, 4)} ${c.slice(4, 6)}` : c))
        .filter(c => /^\d{2}\s\d{2}\s\d{2}$/.test(c));
    return Array.from(new Set(clean)).sort();
}

// fallback sample codes if none loaded yet
const SAMPLE_CODES: string[] = ['20 03 01', '15 01 01', '15 01 02', '18 01 03', '17 04 05'];

/* ===== NEW: cod -> denumire + secții ===== */
const LS_CODE_NAMES = 'mediu::coduriNume' as const; // map cod -> denumire
const LS_SECTII = 'mediu::sectii' as const;      // listă secții (autocomplete)
function isHazardous(cod: string) { return /\*$/.test(cod); }
function lookupName(cod: string, map: Record<string, string>) {
    return map[cod] || map[cod.replace(/\*$/, '')] || '—';
}

/* ===== Page ===== */
export default function Page() {
    // selected day
    const [zi, setZi] = useState<string>(todayISO());

    // form state
    const [form, setForm] = useState<SacEntry>({
        id: '',
        data: todayISO(),
        sectie: '',
        codDeseu: '',
        culoare: 'galben',
        marimeL: 60,
        nrBuc: 1,
        gradUmplere: 100,
        densitateKgM3: undefined,
        validatAsistentSef: false,
    });

    // collections
    const [saci, setSaci] = useState<SacEntry[]>([]);
    const [presets, setPresets] = useState<DensitatePreset[]>([]);
    const [rapoarte, setRapoarte] = useState<DailyReport[]>([]);
    const [locks, setLocks] = useState<MonthlyLock[]>([]);
    const [coduri, setCoduri] = useState<string[]>([]);
    const [numeCod, setNumeCod] = useState<Record<string, string>>({});
    const [sectii, setSectii] = useState<string[]>([]); // NEW: listă secții
    const fileRef = useRef<HTMLInputElement>(null);

    // load
    useEffect(() => {
        setSaci(lsRead<SacEntry[]>(LS.saci, []));
        setPresets(lsRead<DensitatePreset[]>(LS.densitati, []));
        setRapoarte(lsRead<DailyReport[]>(LS.daily, []));
        setLocks(lsRead<MonthlyLock[]>(LS.monthlyLock, []));
        const listCod = lsRead<string[]>(LS.coduri, []);
        setCoduri(listCod && listCod.length ? listCod : SAMPLE_CODES);
        setNumeCod(lsRead<Record<string, string>>(LS_CODE_NAMES, {}));
        setSectii(lsRead<string[]>(LS_SECTII, [])); // NEW
    }, []);

    // auto-load JSON coduri (o singură dată dacă nu sunt în LS)
    useEffect(() => {
        if (Object.keys(numeCod).length > 0) return;
        (async () => {
            try {
                const res = await fetch('/mediu/coduri-deseuri.json', { cache: 'no-store' });
                if (!res.ok) return;
                const arr = await res.json() as Array<{ cod?: string; denumire?: string }>;
                const map: Record<string, string> = {};
                for (const it of arr) {
                    const cod = (it.cod ?? '').trim();
                    const den = (it.denumire ?? '').trim();
                    if (cod && den) map[cod] = den;
                }
                if (Object.keys(map).length) setNumeCod(map);
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // persist
    useEffect(() => { lsWrite(LS.saci, saci); }, [saci]);
    useEffect(() => { lsWrite(LS.densitati, presets); }, [presets]);
    useEffect(() => { lsWrite(LS.daily, rapoarte); }, [rapoarte]);
    useEffect(() => { lsWrite(LS.monthlyLock, locks); }, [locks]);
    useEffect(() => { lsWrite(LS.coduri, coduri); notifyMediu('coduri'); }, [coduri]);
    useEffect(() => { lsWrite(LS_CODE_NAMES, numeCod); }, [numeCod]);
    useEffect(() => { lsWrite(LS_SECTII, sectii); }, [sectii]); // NEW

    // helpers
    const densitateFor = (cod: string) => presets.find(p => p.codDeseu === cod)?.kgM3 ?? 100;

    const kgPreview = useMemo(() => {
        const dens = form.densitateKgM3 ?? (form.codDeseu ? densitateFor(form.codDeseu) : 100);
        const volM3 =
            LtoM3(Number(form.marimeL || 0)) *
            (Number(form.gradUmplere || 0) / 100) *
            Number(form.nrBuc || 0);
        return Math.round(volM3 * dens * 10) / 10;
    }, [form]);

    const saciZi = useMemo(() => saci.filter(s => s.data === zi), [saci, zi]);

    const totalKgZi = useMemo(() => {
        return saciZi.reduce((acc, s) => {
            const dens = s.densitateKgM3 ?? densitateFor(s.codDeseu);
            const volM3 = LtoM3(s.marimeL) * (s.gradUmplere / 100) * s.nrBuc;
            return acc + volM3 * dens;
        }, 0);
    }, [saciZi]);

    const raportZi = useMemo(() => rapoarte.find(r => r.data === zi), [rapoarte, zi]);

    const lunaTrecuta = (() => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 7);
    })();
    const lockedPrev = locks.some(l => l.luna === lunaTrecuta);

    // coduri pentru autocomplete = lista veche + din JSON denumiri
    const coduriAll = useMemo(() => {
        const fromNames = Object.keys(numeCod);
        const base = coduri || [];
        return Array.from(new Set([...base, ...fromNames])).sort();
    }, [coduri, numeCod]);

    // handlers
    const addSac = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.data.slice(0, 7) === lunaTrecuta && lockedPrev) {
            alert('Luna precedenta este blocata. Nu se mai pot adauga inregistrari.');
            return;
        }
        const payload: SacEntry = { ...form, id: crypto.randomUUID() };
        setSaci([payload, ...saci]);

        // NEW: învață secția pentru autocomplete (max 100 distincte)
        if (payload.sectie && !sectii.includes(payload.sectie)) {
            setSectii(prev => [payload.sectie, ...prev].slice(0, 100));
        }

        setForm({ ...form, id: '', nrBuc: 1, gradUmplere: 100 });
        notifyMediu('saci');
    };

    const removeSac = (id: string) => {
        setSaci(saci.filter(s => s.id !== id));
        notifyMediu('saci');
    };

    const upsertPreset = (cod: string, kgM3: number) => {
        if (!cod) return;
        const next = [...presets];
        const i = next.findIndex(p => p.codDeseu === cod);
        if (i >= 0) next[i] = { codDeseu: cod, kgM3, updatedAt: new Date().toISOString() };
        else next.push({ codDeseu: cod, kgM3, updatedAt: new Date().toISOString() });
        setPresets(next);
        notifyMediu('densitati');
    };

    const finalizeRaportZi = () => {
        const total = Math.round(totalKgZi * 10) / 10;
        const existing = rapoarte.find(r => r.data === zi);
        let next: DailyReport[];
        if (existing) {
            next = rapoarte.map(r => (r.data === zi ? { ...r, totalKg: total, validat: !r.validat } : r));
        } else {
            next = [{ id: crypto.randomUUID(), data: zi, totalKg: total, validat: true }, ...rapoarte];
        }
        setRapoarte(next);
        notifyMediu('daily');
    };

    useEffect(() => {
        if (isFirstBusinessDayOfMonth() && !lockedPrev) {
            setLocks([{ luna: lunaTrecuta, lockedAt: new Date().toISOString() }, ...locks]);
            notifyMediu('monthlyLock');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onUploadCoduriClick = () => fileRef.current?.click();
    const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const arr = await extractCodesFromFile(f);
        if (!arr.length) {
            alert('Nu am putut extrage codurile. Incearca CSV/TXT/JSON sau PDF cu text selectabil.');
            e.target.value = '';
            return;
        }
        setCoduri(arr);
        e.target.value = '';
    };

    /* ===== UI ===== */
    return (
        <div style={wrap}>
            <Link href="/mediu" style={back}>← Inapoi</Link>
            <h1 style={h1}>Deseuri</h1>
            <p style={sub}>Formular raportare saci (culoare, marime, nr. bucati, grad umplere), calcul volum &gt; kg estimat, raport zilnic/lunar/anual.</p>

            {/* Info & status */}
            <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={small}>Zi selectata:</div>
                <input type="date" value={zi} onChange={e => { setZi(e.target.value); setForm(f => ({ ...f, data: e.target.value })); }} />
                <div style={{ ...small, marginLeft: 12 }}>Total zi: <b>{Math.round(totalKgZi * 10) / 10}</b> kg</div>
                {raportZi && (
                    <div style={small}>
                        Status raport: {raportZi.validat ? <b style={{ color: '#166534' }}>validat</b> : <b style={{ color: '#9a3412' }}>in asteptare</b>}
                    </div>
                )}
                {lockedPrev && <div style={{ ...small, color: '#991b1b' }}>Luna precedenta este <b>blocata</b> (raport lunar inchis)</div>}
            </div>

            {/* Import coduri HG */}
            <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={small}>
                    Coduri disponibile: <b>{coduriAll.length}</b>{' '}
                    {coduri === SAMPLE_CODES ? <span style={{ opacity: 0.7 }}>(exemplu implicit)</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.json" onChange={onFileChange} style={{ display: 'none' }} />
                    <button onClick={onUploadCoduriClick} style={{ ...btn, background: '#334155' }}>Incarca coduri HG (PDF/CSV/TXT/JSON)</button>
                </div>
            </div>

            {/* Form sac */}
            <form
                onSubmit={addSac}
                style={{
                    ...card,
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px', // + Secție
                    alignItems: 'end',
                    marginBottom: 16,
                }}
            >
                <div>
                    <div style={small}>Data</div>
                    <input type="date" required value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                </div>

                {/* NEW: Secție */}
                <div>
                    <div style={small}>Secție</div>
                    <input
                        required
                        list="sectii-datalist"
                        placeholder="ex. Chirurgie, ATI, UPU"
                        value={form.sectie}
                        onChange={e => setForm({ ...form, sectie: e.target.value })}
                    />
                    <datalist id="sectii-datalist">
                        {sectii.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>

                <div>
                    <div style={small}>Cod deseu</div>
                    <input
                        required
                        list="coduri-deseu"
                        placeholder="ex. 20 03 01"
                        value={form.codDeseu}
                        onChange={e => setForm({ ...form, codDeseu: e.target.value })}
                    />
                    <datalist id="coduri-deseu">
                        {coduriAll.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>

                <div>
                    <div style={small}>Culoare sac</div>
                    <select value={form.culoare} onChange={e => setForm({ ...form, culoare: e.target.value as SacEntry['culoare'] })}>
                        <option value="galben">Galben</option>
                        <option value="verde">Verde</option>
                        <option value="albastru">Albastru</option>
                        <option value="negru">Negru</option>
                        <option value="transparent">Transparent</option>
                    </select>
                </div>

                <div>
                    <div style={small}>Marime (L)</div>
                    <select value={form.marimeL} onChange={e => setForm({ ...form, marimeL: Number(e.target.value) as SacEntry['marimeL'] })}>
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                        <option value={120}>120</option>
                        <option value={240}>240</option>
                        <option value={500}>500</option>
                    </select>
                </div>

                <div>
                    <div style={small}>Nr. bucati</div>
                    <input type="number" min={1} value={form.nrBuc} onChange={e => setForm({ ...form, nrBuc: Number(e.target.value) })} />
                </div>

                <div>
                    <div style={small}>Grad umplere (%)</div>
                    <input type="number" min={0} max={100} value={form.gradUmplere} onChange={e => setForm({ ...form, gradUmplere: Number(e.target.value) })} />
                </div>

                <div>
                    <div style={small}>Densitate (kg/m3)</div>
                    <input
                        type="number"
                        step="0.01"
                        placeholder={`preset: ${form.codDeseu ? (presets.find(p => p.codDeseu === form.codDeseu)?.kgM3 ?? 100) : 100}`}
                        value={form.densitateKgM3 ?? ''}
                        onChange={e => setForm({ ...form, densitateKgM3: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                    {form.codDeseu && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                style={{ ...btn, background: '#334155' }}
                                onClick={() => upsertPreset(form.codDeseu, (form.densitateKgM3 ?? densitateFor(form.codDeseu)))}
                            >
                                Salveaza ca preset
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <div style={small}>Estimat</div>
                    <div><b>{kgPreview}</b> kg</div>
                </div>

                <button type="submit" style={btn}>Adauga</button>
            </form>

            {/* List for selected day */}
            <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Inregistrari — {formatRO(zi)}</div>
                {saciZi.length === 0 ? (
                    <div style={{ opacity: 0.7 }}>Nu exista inregistrari.</div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {saciZi.map(s => {
                            const dens = s.densitateKgM3 ?? densitateFor(s.codDeseu);
                            const kg = Math.round((LtoM3(s.marimeL) * (s.gradUmplere / 100) * s.nrBuc * dens) * 10) / 10;
                            return (
                                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '220px 160px 110px 90px 100px 1fr 120px', gap: 10, alignItems: 'center' }}>
                                    <div>
                                        <div style={small}>Cod</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span>{s.codDeseu || '-'}</span>
                                            {s.codDeseu && isHazardous(s.codDeseu) && (
                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#fee2e2', color: '#991b1b' }}>
                                                    periculos
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                                            {s.codDeseu ? lookupName(s.codDeseu, numeCod) : '—'}
                                        </div>
                                    </div>

                                    {/* NEW: Secție */}
                                    <div><div style={small}>Secție</div>{s.sectie || '-'}</div>

                                    <div><div style={small}>Culoare</div>{s.culoare}</div>
                                    <div><div style={small}>Volum</div>{s.marimeL}L x {s.nrBuc}</div>
                                    <div><div style={small}>Umplere</div>{s.gradUmplere}%</div>
                                    <div><div style={small}>Densitate</div>{dens} kg/m3</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <b>{kg} kg</b>
                                        <button onClick={() => removeSac(s.id)} style={{ ...btn, background: '#991b1b' }}>Sterge</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* NEW: Pe secții (zi / lună) */}
            <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Pe secții — ziua selectată / luna curentă</div>
                {(() => {
                    // helper kg
                    const kg = (s: SacEntry) => {
                        const d = s.densitateKgM3 ?? densitateFor(s.codDeseu);
                        return LtoM3(s.marimeL) * (s.gradUmplere / 100) * s.nrBuc * d;
                    };
                    // ziua selectată
                    const byDay = new Map<string, number>();
                    saci.filter(s => s.data === zi).forEach(s => {
                        const key = s.sectie || '—';
                        byDay.set(key, (byDay.get(key) || 0) + kg(s));
                    });
                    // luna curentă
                    const ym = zi.slice(0, 7);
                    const byMonth = new Map<string, number>();
                    saci.filter(s => s.data.slice(0, 7) === ym).forEach(s => {
                        const key = s.sectie || '—';
                        byMonth.set(key, (byMonth.get(key) || 0) + kg(s));
                    });
                    const top = (m: Map<string, number>) =>
                        Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
                            .map(([sec, val]) => ({ sec, kg: Math.round(val * 10) / 10 }));

                    const dayRows = top(byDay);
                    const monthRows = top(byMonth);

                    return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <div style={{ ...small, marginBottom: 6 }}>Ziua selectată ({formatRO(zi)})</div>
                                {dayRows.length === 0 ? (
                                    <div style={{ opacity: .7 }}>Nu există înregistrări.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {dayRows.map(r => (
                                            <div key={r.sec} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                                                <div>{r.sec}</div>
                                                <div style={{ textAlign: 'right' }}><b>{r.kg}</b> kg</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ ...small, marginBottom: 6 }}>Luna curentă ({ym})</div>
                                {monthRows.length === 0 ? (
                                    <div style={{ opacity: .7 }}>Nu există înregistrări.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {monthRows.map(r => (
                                            <div key={r.sec} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                                                <div>{r.sec}</div>
                                                <div style={{ textAlign: 'right' }}><b>{r.kg}</b> kg</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Daily report */}
            <div style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Raport zilnic</div>
                    <div style={small}>Total: <b>{Math.round(totalKgZi * 10) / 10}</b> kg</div>
                    <div style={small}>Status: {raportZi?.validat ? <b style={{ color: '#166534' }}>validat</b> : <b style={{ color: '#9a3412' }}>in asteptare</b>}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={finalizeRaportZi} style={btn}>
                        {raportZi?.validat ? 'Anuleaza validarea' : 'Valideaza raportul'}
                    </button>
                </div>
            </div>
        </div>
    );
}
