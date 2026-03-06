'use client';

import React, { useMemo, useState } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';

/* ====== UI config (consistent cu celelalte) ====== */
const CARD_WIDTH = 320;
const CARD_HEIGHT = 230;
const GAP = 18;
/* ================================================ */

type Cadenta = 'zilnic' | 'saptamanal' | 'lunar' | 'trimestrial';

type TelCard = {
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
};

/** 14 carduri — Centrală telefonică / PBX intern (nu 112) */
const CARDS: TelCard[] = [
    // Zilnic — miez critic
    { id: 'TEL_PBX_HEALTH', title: 'PBX / Call server — sănătate și înregistrări telefoane', cadenta: 'zilnic', critical: true, tags: ['PBX', 'registrări', 'SLA'] },
    { id: 'TEL_TRUNKS_STATUS', title: 'Trunchiuri SIP/PRI — status, erori și rute active', cadenta: 'zilnic', critical: true, tags: ['SIP', 'PRI', 'SBC'] },
    { id: 'TEL_QUEUES_OPERATOR', title: 'Cozi și operator — apeluri pierdute, ASA, AHT', cadenta: 'zilnic', critical: true, tags: ['queue', 'KPI', 'operator'] },
    { id: 'TEL_QOS_VOICE', title: 'QoS voce — latență, jitter, MOS pe VLAN voce', cadenta: 'zilnic', critical: true, tags: ['QoS', 'DSCP46', 'MOS'] },
    { id: 'TEL_RECORDER_HEALTH', title: 'Call recording — funcțional și spațiu disponibil', cadenta: 'zilnic', critical: true, tags: ['recording', 'storage'] },
    { id: 'TEL_ALERTS_DELIVERY', title: 'Alarme și notificări — livrare e-mail/Teams', cadenta: 'zilnic', critical: true, tags: ['alarme', 'notificări'] },

    // Săptămânal
    { id: 'TEL_IVR_ROUTES', title: 'IVR și routing — testare meniuri și orare', cadenta: 'saptamanal', tags: ['IVR', 'routing'] },
    { id: 'TEL_VOICEMAIL_CAP', title: 'Voicemail — capacitate, curățare și notificări', cadenta: 'saptamanal', tags: ['voicemail'] },
    { id: 'TEL_CONFIG_BACKUP', title: 'Backup config PBX/SBC — complet și verificare hash', cadenta: 'saptamanal', critical: true, tags: ['backup', 'hash'] },
    { id: 'TEL_TOLL_FRAUD', title: 'Anti-fraudă / blacklist — anomalii trafic', cadenta: 'saptamanal', critical: true, tags: ['toll-fraud', 'blacklist'] },

    // Lunar
    { id: 'TEL_EXT_AUDIT', title: 'Audit extensii — inactive, dubluri, nomenclator', cadenta: 'lunar', tags: ['extensii', 'inventar'] },
    { id: 'TEL_TRUNK_FAILOVER', title: 'Test failover trunk (SIP backup) — exercițiu controlat', cadenta: 'lunar', critical: true, tags: ['failover', 'backup trunk'] },

    // Trimestrial
    { id: 'TEL_DR_DRILL', title: 'Plan continuitate — fallback la mobile / scenariu DR', cadenta: 'trimestrial', critical: true, tags: ['DR', 'continuitate'] },
    { id: 'TEL_UPS_TELECOM', title: 'UPS telecom — autonomie și jurnal evenimente', cadenta: 'trimestrial', tags: ['UPS', 'rack'] },
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
                    <b style={{ color: '#1e3a8a' }}>Ghid — Centrală telefonică</b>
                    <button onClick={onClose} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 8, fontSize: 14 }}>
                    <div>• Monitorizează <b>PBX</b>, <b>trunchiuri</b> și <b>QoS voce</b> zilnic. Problemele aici afectează tot spitalul.</div>
                    <div>• <b>Critic</b> cere dovadă (captură log / screen / raport), mai ales la failover & fraudă.</div>
                    <div>• Lunar: exercițiu de <b>failover</b> pe trunk și actualizări de <b>extensii</b>.</div>
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
            title="Centrală telefonică"
            intro="PBX intern, trunchiuri SIP/PRI, QoS voce, IVR, înregistrări, anti-fraudă."
            showBack
            links={{
                addTask: '/administratie/todo/new?cat=centralist',
                questionnaire: '/administratie/chestionare?cat=centralist',
                history: '/administratie/chestionare?cat=centralist&view=istoric',
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
                    <b>Monitorizare & verificări standard telefonie</b>

                    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                        {(['toate', 'zilnic', 'saptamanal', 'lunar', 'trimestrial'] as const).map(v => (
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
                        placeholder="Caută card (ex: SIP, IVR, QoS)…"
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
function Card({ card }: { card: TelCard }) {
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
                    title="Telefonie"
                >
                    ☎️
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
                        title="Critic — cere dovadă (captură/log/raport) și timp de remediere."
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
