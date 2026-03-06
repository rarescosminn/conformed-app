'use client';

import React, { useMemo, useState } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';

/* ====== UI config (uniform cu restul) ====== */
const CARD_WIDTH = 320;
const CARD_HEIGHT = 230;
const GAP = 18;
/* ========================================== */

type Cadenta = 'zilnic' | 'saptamanal' | 'lunar' | 'sezonier' | 'la_cerere';

type OpsCard = {
    id: string;
    title: string;
    cadenta: Cadenta;
    critical?: boolean;
    tags?: string[];
};

const LABEL: Record<Cadenta, string> = {
    zilnic: 'Zilnic',
    saptamanal: 'Săptămânal',
    lunar: 'Lunar',
    sezonier: 'Sezonier',
    la_cerere: 'La cerere',
};

const CARDS: OpsCard[] = [
    // Zilnic
    { id: 'NEC_ROND_EXTERIOR', title: 'Rond exterior curte/parcări & căi de acces', cadenta: 'zilnic', tags: ['curte', 'parcări', 'trotuar'] },
    { id: 'NEC_ACCESE_SIGURANTA', title: 'Accese clădiri — rampe, trepte, mâini curente (siguranță)', cadenta: 'zilnic', critical: true, tags: ['acces', 'siguranță', 'antiderapant'] },
    { id: 'NEC_DESEURI_NEPR', title: 'Colectare deșeuri nepericuloase — puncte interne', cadenta: 'zilnic', tags: ['deșeuri', 'menajer', 'reciclabile'] },
    { id: 'NEC_TRANSPORT_INTERN', title: 'Transport intern mărfuri nepericuloase / aprovizionare', cadenta: 'zilnic', tags: ['aprovizionare', 'lift', 'logistică'] },

    // Săptămânal
    { id: 'NEC_Z_TEHNICE_ACCES', title: 'Verificare zone tehnice — acces restricționat (neconformități)', cadenta: 'saptamanal', critical: true, tags: ['acces', 'tehnic'] },
    { id: 'NEC_STOC_CONSUMABILE', title: 'Stoc consumabile curte — saci, sare, unelte', cadenta: 'saptamanal', tags: ['stoc', 'inventar'] },
    { id: 'NEC_COLECTARE_CARTON', title: 'Colectare carton/voluminoase — platforme', cadenta: 'saptamanal', tags: ['carton', 'platformă'] },

    // Lunar
    { id: 'NEC_SPALARE_PLATFORME', title: 'Spălare platforme/rampe, curățare mânere/benzi', cadenta: 'lunar', tags: ['platforme', 'rampe'] },
    { id: 'NEC_RIGOLE_SIFOANE', title: 'Curățare rigole/sifoane exterioare', cadenta: 'lunar', tags: ['rigole', 'scurgeri'] },

    // Sezonier / La cerere
    { id: 'NEC_DESZAPEZIRE', title: 'Deszăpezire / antiderapant — intervenție la fenomen', cadenta: 'sezonier', critical: true, tags: ['iarna', 'antiderapant'] },
    { id: 'NEC_SEMNALIZARE_TEMP', title: 'Semnalizare temporară zone umede / lucrări', cadenta: 'la_cerere', critical: true, tags: ['semnalizare', 'risc alunecare'] },
    { id: 'NEC_MUTARI_USOARE', title: 'Mutări/relocări ușoare (mobilier/echip. neconectate)', cadenta: 'la_cerere', tags: ['mutări', 'relocare'] },
    { id: 'NEC_RIDICARE_DESEURI', title: 'Ridicare punctuală deșeuri/reziduuri în exces', cadenta: 'la_cerere', tags: ['curte', 'igienă'] },
];

const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1e40af',
};

/* —————— Ghid scurt —————— */
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
            <div style={{ width: 'min(920px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                    <b style={{ color: '#1e3a8a' }}>Ghid rapid — Necalificați</b>
                    <button onClick={onClose} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 8, fontSize: 14 }}>
                    <div>• <b>Zilnic</b>: rond curte/acces, deșeuri, aprovizionare.</div>
                    <div>• <b>Critic</b>: siguranță acces, semnalizare temporară, deszăpezire, zone tehnice — cere <b>foto obligatoriu</b>.</div>
                    <div>• <b>La cerere</b>: mutări, ridicări voluminoase — SLA în program &lt; 60 min.</div>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    const [q, setQ] = useState('');
    const [onlyCritic, setOnlyCritic] = useState(false);
    const [cad, setCad] = useState<'toate' | Cadenta>('toate');
    const [help, setHelp] = useState(false);

    const items = useMemo(() => {
        let list = CARDS;
        if (onlyCritic) list = list.filter(c => c.critical);
        if (cad !== 'toate') list = list.filter(c => c.cadenta === cad);
        if (q.trim()) {
            const s = q.toLowerCase();
            list = list.filter(c =>
                c.title.toLowerCase().includes(s) || c.tags?.some(t => t.toLowerCase().includes(s))
            );
        }
        // ✅ Critice sus, apoi alfabetic
        list = [...list].sort((a, b) => {
            const ca = a.critical ? 1 : 0;
            const cb = b.critical ? 1 : 0;
            if (cb !== ca) return cb - ca;
            return a.title.localeCompare(b.title);
        });
        return list;
    }, [q, onlyCritic, cad]);

    // 🔢 Deocamdată hardcoded; când ai date reale, treci numărul corect:
    const openTasksCount = 0;
    const openTasksHref = '/administratie/todo?status=open&groupby=categorie';

    return (
        <AdminCategoryLayout
            title="Necalificați"
            intro="Activități operaționale: ronduri, curte, deșeuri, aprovizionare."
            showBack
            links={{
                addTask: '/administratie/todo/new?cat=necalificati',
                questionnaire: '/administratie/chestionare?cat=necalificati',
                history: '/administratie/chestionare?cat=necalificati&view=istoric',
            }}
            openTasksCount={openTasksCount}
            openTasksHref={openTasksHref}
        >
            {/* Banner + filtre + căutare */}
            <div
                style={{
                    border: '1px solid #bfdbfe',
                    background: 'linear-gradient(180deg,#eff6ff,#f8fbff)',
                    color: '#1e3a8a',
                    borderRadius: 14,
                    padding: 14,
                    marginTop: 6,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <b>Fluxuri standard și trasee</b>

                    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                        {(['toate', 'zilnic', 'saptamanal', 'lunar', 'sezonier', 'la_cerere'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setCad(v)}
                                style={{ padding: '6px 10px', borderRadius: 8, background: cad === v ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}
                            >
                                {v === 'toate' ? 'Toate' : LABEL[v]}
                            </button>
                        ))}
                    </div>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={onlyCritic} onChange={e => setOnlyCritic(e.target.checked)} />
                        Doar critice
                    </label>

                    <button onClick={() => setHelp(true)} style={{ border: '1px solid #bfdbfe', borderRadius: 10, background: '#fff', padding: '6px 10px', cursor: 'pointer' }}>
                        Ghid rapid
                    </button>

                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Caută card (ex: curte, deșeuri)…"
                        style={{ marginLeft: 'auto', padding: '8px 10px', borderRadius: 10, border: '1px solid #bfdbfe', minWidth: 280, background: '#fff', color: '#0f172a' }}
                    />
                </div>
            </div>

            {/* GRID centrat, carduri identice */}
            <div
                style={{
                    marginTop: 12,
                    width: '100%',
                    display: 'grid',
                    gap: GAP,
                    gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_WIDTH}px, ${CARD_WIDTH}px))`,
                    justifyContent: 'center',
                }}
            >
                {items.map(c => <Card key={c.id} card={c} />)}
            </div>

            <HelpModal open={help} onClose={() => setHelp(false)} />
        </AdminCategoryLayout>
    );
}

/* -------------------- Card uniform (dimensiuni identice) -------------------- */
function Card({ card }: { card: OpsCard }) {
    return (
        <div
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                border: '1px solid #bfdbfe',
                borderRadius: 18,
                background: '#f8fbff',
                padding: 18,
                overflow: 'hidden',
                boxShadow: '0 10px 28px rgba(30,64,175,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'transform .12s ease, box-shadow .12s ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 32px rgba(30,64,175,0.12)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(30,64,175,0.08)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    aria-hidden
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: '1px solid #bfdbfe', background: '#eff6ff',
                        display: 'grid', placeItems: 'center', fontSize: 18, color: '#1e40af',
                    }}
                    title="Operațional"
                >
                    🧹
                </div>

                {/* Titlu clamp 2 rânduri */}
                <div
                    style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2 as any,
                        WebkitBoxOrient: 'vertical' as any,
                        overflow: 'hidden',
                    }}
                >
                    {card.title}
                </div>

                <span style={{ marginLeft: 'auto', ...chip }}>{LABEL[card.cadenta]}</span>

                {card.critical && (
                    <span
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '2px 8px', borderRadius: 999, fontSize: 12,
                            border: '1px solid #fdba74', background: '#fff7ed', color: '#9a3412', whiteSpace: 'nowrap',
                        }}
                        title="Critic — cere dovadă foto și timp de intervenție."
                    >
                        Critic
                    </span>
                )}
            </div>

            {card.tags?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {card.tags.map(t => <span key={t} style={{ fontSize: 11, color: '#1e40af', opacity: 0.9 }}>#{t}</span>)}
                </div>
            ) : null}

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe',
                        background: '#ffffff', color: '#1e3a8a', cursor: 'pointer', fontSize: 13,
                    }}
                    title="Deschide detalii / checklist"
                >
                    Deschide
                </button>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
                        background: '#ffffff', cursor: 'pointer', fontSize: 13,
                    }}
                    title="Creează task din acest card"
                >
                    + Task
                </button>
            </div>
        </div>
    );
}
