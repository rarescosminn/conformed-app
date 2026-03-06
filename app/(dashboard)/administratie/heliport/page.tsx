'use client';

import React, { useMemo, useState } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';

/* ====== UI config (consistent cu celelalte) ====== */
const CARD_WIDTH = 320;
const CARD_HEIGHT = 230;
const GAP = 18;
/* ================================================ */

type Cadenta = 'zilnic' | 'saptamanal' | 'lunar' | 'trimestrial' | 'sezonier' | 'la_cerere';

type HeliCard = {
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
    trimestrial: 'Trimestrial',
    sezonier: 'Sezonier',
    la_cerere: 'La cerere',
};

/** 15 carduri — operațional și siguranță heliport (critice marcate) */
const CARDS: HeliCard[] = [
    // Zilnic — miez critic
    { id: 'HEL_TLOF_FATO', title: 'TLOF/FATO — suprafață, FOD, integritate', cadenta: 'zilnic', critical: true, tags: ['TLOF', 'FATO', 'FOD', 'aderență'] },
    { id: 'HEL_LIGHTS', title: 'Iluminat TLOF/perimetru și obstacole — test la apus', cadenta: 'zilnic', critical: true, tags: ['balizaj', 'obstacole', 'noapte'] },
    { id: 'HEL_WINDSOCK', title: 'Săculeț vânt — vizibilitate, fixare, iluminare', cadenta: 'zilnic', critical: true, tags: ['windsock', 'meteo'] },
    { id: 'HEL_PATIENT_PATH', title: 'Traseu targă — cale liberă, semnalizare', cadenta: 'zilnic', critical: true, tags: ['acces', 'evacuare', 'semnalizare'] },
    { id: 'HEL_COMMS', title: 'Comunicații / radio — stații, frecvențe, baterii', cadenta: 'zilnic', critical: true, tags: ['radio', 'interfon', 'frecvențe'] },

    // Săptămânal
    { id: 'HEL_PSI', title: 'PSI heliport — stingătoare spumă/pulbere, hidranți', cadenta: 'saptamanal', critical: true, tags: ['PSI', 'stingătoare', 'hidrant'] },
    { id: 'HEL_OBST_LIGHTS', title: 'Balizaj obstacole clădiri — funcționare/lentile', cadenta: 'saptamanal', tags: ['balizaj', 'clădiri'] },
    { id: 'HEL_FOD_WALK', title: 'FOD walk perimetral și curățare marcaje H', cadenta: 'saptamanal', tags: ['FOD', 'marcaje', 'vopsea'] },

    // Lunar
    { id: 'HEL_UPS_GEN', title: 'UPS/Generator iluminat heliport — autonomie și jurnal', cadenta: 'lunar', critical: true, tags: ['UPS', 'generator', 'autonomie'] },
    { id: 'HEL_DRENAJ', title: 'Drenaj TLOF — rigole/scurgeri (apă/combustibili)', cadenta: 'lunar', tags: ['rigole', 'scurgeri'] },
    { id: 'HEL_DOCS', title: 'Documentație și registre — proceduri/NOTAM/jurnal', cadenta: 'lunar', tags: ['registre', 'proceduri', 'NOTAM'] },

    // Trimestrial
    { id: 'HEL_OBST_AUDIT', title: 'Audit obstacole pe căi de apropiere — vegetație/structuri', cadenta: 'trimestrial', critical: true, tags: ['obstacole', 'apropiere'] },
    { id: 'HEL_DRILL', title: 'Exercițiu intervenție — incendiu/accident, roluri', cadenta: 'trimestrial', critical: true, tags: ['exercițiu', 'intervenție', 'PSI'] },

    // Sezonier
    { id: 'HEL_SNOW', title: 'Deszăpezire/antiderapant TLOF — echipamente și stocuri', cadenta: 'sezonier', critical: true, tags: ['iarna', 'antiderapant', 'deszăpezire'] },

    // La cerere — evidențiat
    { id: 'HEL_CLOSE_NOTAM', title: 'Închidere temporară / NOTAM — anunț, jurnal și redeschidere', cadenta: 'la_cerere', critical: true, tags: ['NOTAM', 'închidere', 'restricție', 'siguranță'] },
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
                    <b style={{ color: '#1e3a8a' }}>Ghid — Heliport</b>
                    <button onClick={onClose} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 8, fontSize: 14 }}>
                    <div>• <b>Zilnic</b>: TLOF/FATO, iluminat, windsock, comunicații, traseu targă.</div>
                    <div>• <b>Critic</b> ⇒ cere dovadă (foto/log/test) și timp de remediere.</div>
                    <div>• <b>Lunar/Trimestrial</b>: UPS/generator, audit obstacole, exercițiu intervenție.</div>
                    <div>• <b>La cerere</b>: <i>Închidere temporară / NOTAM</i> — când siguranța e afectată sau sunt lucrări.</div>
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
        // Critice sus, apoi alfabetic
        return [...list].sort((a, b) => {
            const ca = a.critical ? 1 : 0;
            const cb = b.critical ? 1 : 0;
            if (cb !== ca) return cb - ca;
            return a.title.localeCompare(b.title);
        });
    }, [q, onlyCritic, cad]);

    return (
        <AdminCategoryLayout
            title="Heliport"
            intro="Inspecții TLOF/FATO, iluminat, windsock, comunicații, PSI, obstacole, NOTAM."
            showBack
            links={{
                addTask: '/administratie/todo/new?cat=heliport',
                questionnaire: '/administratie/chestionare?cat=heliport',
                history: '/administratie/chestionare?cat=heliport&view=istoric',
            }}
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
                    <b>Checklist operațional și siguranță heliport</b>

                    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                        {(['toate', 'zilnic', 'saptamanal', 'lunar', 'trimestrial', 'sezonier', 'la_cerere'] as const).map(v => (
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
                        Ghid
                    </button>

                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Caută card (ex: TLOF, windsock, PSI)…"
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
function Card({ card }: { card: HeliCard }) {
    const isCloseNotam = card.id === 'HEL_CLOSE_NOTAM';

    const baseStyle: React.CSSProperties = {
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
    };

    const highlightStyle: React.CSSProperties = isCloseNotam
        ? {
            border: '1px solid #fca5a5', // roșu 300
            background: 'linear-gradient(180deg,#fff1f2,#ffe4e6)', // roz/roșu foarte deschis
            boxShadow: '0 10px 32px rgba(225,29,72,0.12)', // roșu 600 cu opacitate
        }
        : {};

    return (
        <div
            style={{ ...baseStyle, ...highlightStyle }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = isCloseNotam
                    ? '0 14px 40px rgba(225,29,72,0.18)'
                    : '0 14px 32px rgba(30,64,175,0.12)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = isCloseNotam
                    ? '0 10px 32px rgba(225,29,72,0.12)'
                    : '0 10px 28px rgba(30,64,175,0.08)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    aria-hidden
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: isCloseNotam ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                        background: isCloseNotam ? '#ffe4e6' : '#eff6ff',
                        display: 'grid', placeItems: 'center', fontSize: 18, color: isCloseNotam ? '#be123c' : '#1e40af',
                    }}
                    title={isCloseNotam ? 'Închidere temporară / NOTAM' : 'Heliport'}
                >
                    {isCloseNotam ? '⚠️' : '🚁'}
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

                <span
                    style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        border: isCloseNotam ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                        background: isCloseNotam ? '#ffe4e6' : '#eff6ff',
                        color: isCloseNotam ? '#be123c' : '#1e40af',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {LABEL[card.cadenta]}
                </span>

                {card.critical && (
                    <span
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '2px 8px', borderRadius: 999, fontSize: 12,
                            border: isCloseNotam ? '1px solid #fca5a5' : '1px solid #fdba74',
                            background: isCloseNotam ? '#fff1f2' : '#fff7ed',
                            color: isCloseNotam ? '#be123c' : '#9a3412',
                            whiteSpace: 'nowrap',
                        }}
                        title="Critic — cere dovadă (foto/log/test) și timp de remediere."
                    >
                        {isCloseNotam ? 'IMPORTANT' : 'Critic'}
                    </span>
                )}
            </div>

            {card.tags?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {card.tags.map(t => <span key={t} style={{ fontSize: 11, color: isCloseNotam ? '#be123c' : '#1e40af', opacity: 0.9 }}>#{t}</span>)}
                </div>
            ) : null}

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: isCloseNotam ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                        background: '#ffffff', color: isCloseNotam ? '#be123c' : '#1e3a8a',
                        cursor: 'pointer', fontSize: 13,
                    }}
                    title="Deschide detalii / checklist"
                >
                    Deschide
                </button>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
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
