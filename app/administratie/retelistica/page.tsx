'use client';

import React, { useMemo, useState } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';

/* ====== Config aspect (poți regla aici rapid) ====== */
const CARD_WIDTH = 320;    // lățimea fiecărui card
const CARD_HEIGHT = 230;   // înălțimea fiecărui card
const GAP = 18;            // spațiu între carduri
/* =================================================== */

type Cadenta = 'zilnic' | 'saptamanal' | 'lunar' | 'trimestrial';
type NetCard = {
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

/** 14 carduri – set complet (miez + recomandări critice) */
const CARDS: NetCard[] = [
    // ---- Miezul zilnic critic
    { id: 'NET_CORE_HEALTH', title: 'Core/Aggregation — sănătate și redundanțe', cadenta: 'zilnic', critical: true, tags: ['core', 'stack', 'VRRP', 'HSRP'] },
    { id: 'NET_WIFI_CONTROLLER', title: 'Controller Wi-Fi & AP-uri — alarme și offline', cadenta: 'zilnic', critical: true, tags: ['wifi', 'AP', 'SSID clinic'] },
    { id: 'NET_FIREWALL_HA', title: 'Firewall — HA, sesiuni și evenimente securitate', cadenta: 'zilnic', critical: true, tags: ['HA', 'IPS', 'ACL'] },
    { id: 'NET_ISP_UPLINK', title: 'ISP/Uplink — pierderi, latență și saturație', cadenta: 'zilnic', critical: true, tags: ['ISP', 'BGP', 'dual-WAN'] },
    { id: 'NET_DHCP_SCOPES', title: 'DHCP — spațiu liber pe scope-uri critice', cadenta: 'zilnic', critical: true, tags: ['VLAN', 'IPAM'] },
    { id: 'NET_VPN_TUNNELS', title: 'VPN & Tunneling — site-to-site / remote — sănătate', cadenta: 'zilnic', critical: true, tags: ['IPSec', 'SSL', 'S2S'] },
    { id: 'NET_DNS_NTP', title: 'DNS & NTP — răspuns / reziliență / drift', cadenta: 'zilnic', critical: true, tags: ['resolver', 'time', 'stratum'] },
    { id: 'NET_RADIUS_NAC', title: 'RADIUS / 802.1X / NAC — autentificări & erori', cadenta: 'zilnic', critical: true, tags: ['802.1X', 'NAC', 'dot1x'] },
    { id: 'NET_LOG_PIPE', title: 'Logging / Syslog / SIEM — pipeline activ', cadenta: 'zilnic', critical: true, tags: ['logs', 'SIEM', 'syslog'] },

    // ---- Periodice importante
    { id: 'NET_CONFIG_BACKUP', title: 'Backup config — toate echipamentele + integritate', cadenta: 'saptamanal', critical: true, tags: ['backup', 'hash', 'golden config'] },
    { id: 'NET_CERT_PKI', title: 'Certificate / PKI — expirări portaluri (Wi-Fi/VPN)', cadenta: 'lunar', critical: true, tags: ['cert', 'TLS', 'PKI'] },
    { id: 'NET_CONFIG_DRIFT', title: 'Config drift vs „golden config” — dif & change-log', cadenta: 'lunar', tags: ['standard', 'compliance'] },
    { id: 'NET_ISP_FAILOVER', title: 'Test failover ISP / dual-WAN — exercițiu controlat', cadenta: 'lunar', tags: ['failover', 'BGP', 'SLA'] },
    { id: 'NET_RACK_UPS', title: 'UPS rețea — autonomie și jurnal evenimente', cadenta: 'trimestrial', tags: ['UPS', 'rack', 'PoE'] },
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

export default function Page() {
    const [q, setQ] = useState('');
    const [onlyCritic, setOnlyCritic] = useState(false);

    const items = useMemo(() => {
        let list = CARDS;
        if (onlyCritic) list = list.filter(c => c.critical);
        if (q.trim()) {
            const s = q.toLowerCase();
            list = list.filter(c =>
                c.title.toLowerCase().includes(s) || c.tags?.some(t => t.toLowerCase().includes(s))
            );
        }
        return list;
    }, [q, onlyCritic]);

    return (
        <AdminCategoryLayout
            title="Rețelistică"
            intro="LAN / Wi-Fi / VPN / Firewall — continuitate și securitate rețea."
            showBack
            links={{
                addTask: '/administratie/todo/new?cat=retelistica',
                questionnaire: '/administratie/chestionare?cat=retelistica',
                history: '/administratie/chestionare?cat=retelistica&view=istoric',
            }}
        >
            {/* Banner + căutare + „Doar critice” */}
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
                    <div style={{ fontWeight: 700 }}>Monitorizare și verificări standard de rețea</div>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={onlyCritic} onChange={(e) => setOnlyCritic(e.target.checked)} />
                        Doar critice
                    </label>

                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Caută card (ex: Wi-Fi, firewall, VPN)…"
                        style={{
                            marginLeft: 'auto',
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1px solid #bfdbfe',
                            minWidth: 280,
                            background: '#fff',
                            color: '#0f172a',
                        }}
                    />
                </div>
            </div>

            {/* GRID CENTRAT: coloane de lățime fixă; rândurile se centrează natural */}
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
                {items.map((c) => (
                    <Card key={c.id} card={c} />
                ))}
            </div>
        </AdminCategoryLayout>
    );
}

/* -------------------- Card uniform (dimensiuni identice) -------------------- */
function Card({ card }: { card: NetCard }) {
    return (
        <div
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,            // ✅ identic peste tot
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
                    title="Rețea"
                >
                    🛜
                </div>

                {/* Titlu: max 2 rânduri pentru uniformitate */}
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
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '2px 8px', borderRadius: 999, fontSize: 12,
                        border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af',
                        whiteSpace: 'nowrap',
                    }}
                    title="Cadență"
                >
                    {LABEL[card.cadenta]}
                </span>

                {card.critical && (
                    <span
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '2px 8px', borderRadius: 999, fontSize: 12,
                            border: '1px solid #fdba74', background: '#fff7ed', color: '#9a3412',
                            whiteSpace: 'nowrap',
                        }}
                        title="Critic – necesită dovadă (log/captură/backup)."
                    >
                        Critic
                    </span>
                )}
            </div>

            {card.tags?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {card.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, color: '#1e40af', opacity: 0.9 }}>
                            #{t}
                        </span>
                    ))}
                </div>
            ) : null}

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid #bfdbfe',
                        background: '#ffffff',
                        color: '#1e3a8a',
                        cursor: 'pointer',
                        fontSize: 13,
                    }}
                    title="Deschide detalii / checklist"
                >
                    Deschide
                </button>
                <button
                    type="button"
                    style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        fontSize: 13,
                    }}
                    title="Creează task din acest card"
                >
                    + Task
                </button>
            </div>
        </div>
    );
}
