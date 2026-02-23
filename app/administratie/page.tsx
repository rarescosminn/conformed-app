'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { countOpenTasks, countTodoLate, countTodoToday } from '@/lib/tasks/store';

type AdminCard = { href: string; title: string; desc: string; icon: React.ReactNode; };

const Icon = {
    kitchen: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 2v9" /><path d="M6 2v9" /><path d="M5 11v11" />
            <path d="M10 2v12" /><path d="M10 14c0 4 1.5 6 1.5 6H8.5s1.5-2 1.5-6z" />
        </svg>
    ),
    maintenance: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="9" cy="9" r="2.5" />
            <path d="M9 3v2M9 13v2M3 9h2M13 9h2M5 5l1.4 1.4M11.6 11.6L13 13M5 13l1.4-1.4M11.6 6.4L13 5" />
            <path d="M21 15l-5 5" /><path d="M17 11l6 6" /><path d="M16 12l2 2" />
        </svg>
    ),
    network: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="5" r="2" />
            <circle cx="19" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
            <path d="M7 12h10" /><path d="M12 7v10" /><path d="M7 11L11 7M13 17l4-4" />
        </svg>
    ),
    cleaning: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 2v14" /><path d="M5 20h14l1 2H4z" />
        </svg>
    ),
    headset: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 12a9 9 0 0 1 18 0" />
            <path d="M7 12v5a2 2 0 0 1-2 2H3v-7" />
            <path d="M17 12v5a2 2 0 0 0 2 2h2v-7" />
            <path d="M12 19v3" />
        </svg>
    ),
    heliport: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 7v10M16 7v10M8 12h8" />
        </svg>
    ),
    projects: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="4" y="5" width="16" height="16" rx="2" />
            <path d="M9 3h6v3H9z" />
            <path d="M8 11h8M8 15h6M8 19h5" />
        </svg>
    ),
};

const cards: AdminCard[] = [
    { href: '/administratie/bucatarie', title: 'Bucătărie / Nutriție', desc: 'HACCP, temperaturi, igienizare, alergeni.', icon: Icon.kitchen },
    { href: '/administratie/mentenanta', title: 'Mentenanță', desc: 'Runde tehnice, generatoare, frigotehnie.', icon: Icon.maintenance },
    { href: '/administratie/retelistica', title: 'Rețelistică', desc: 'LAN / Wi-Fi / VPN / Firewall — continuitate și securitate.', icon: Icon.network },
    { href: '/administratie/necalificati', title: 'Necalificați', desc: 'Curățenie spații comune, aprovizionare.', icon: Icon.cleaning },
    { href: '/administratie/centralist', title: 'Centrală telefonică', desc: 'Flux apeluri interne, registre, alerte.', icon: Icon.headset },
    { href: '/administratie/heliport', title: 'Heliport', desc: 'Verificări pistă, iluminat, proceduri.', icon: Icon.heliport },
    { href: '/administratie/proiecte-urgente', title: 'Proiecte și Urgențe', desc: 'Renovări, reparații majore, proiecte în curs.', icon: Icon.projects },
];

const cardStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 8, padding: 16,
    borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)', textDecoration: 'none', color: 'inherit',
};
const asideCard: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: 'rgba(255,255,255,0.65)',
    padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
};
const btnLink: React.CSSProperties = {
    display: 'inline-flex', padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe',
    background: '#fff', fontSize: 13, textDecoration: 'none'
};

export default function AdministratiePage() {
    const [today, setToday] = useState(0);
    const [late, setLate] = useState(0);
    const [open, setOpen] = useState(0);
    const scope = { area: 'administratie' as const, subdomain: null as null };

    const refresh = () => {
        setToday(countTodoToday(scope));
        setLate(countTodoLate(scope));
        setOpen(countOpenTasks(scope));
    };

    useEffect(() => {
        refresh();
        const on = () => refresh();
        window.addEventListener('tasks-changed', on);
        window.addEventListener('storage', on);
        return () => {
            window.removeEventListener('tasks-changed', on);
            window.removeEventListener('storage', on);
        };
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Administrație</h1>
            <p style={{ margin: '6px 0 18px', opacity: 0.8 }}>
                Alege o categorie pentru a deschide task-urile și chestionarele specifice.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
                {/* STÂNGA – cardurile de categorii */}
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {cards.map(c => (
                            <Link key={c.href} href={c.href} style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span>{c.icon}</span><strong style={{ fontSize: 16 }}>{c.title}</strong>
                                </div>
                                <span style={{ fontSize: 13, opacity: 0.8 }}>{c.desc}</span>
                                <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* DREAPTA – sidebar General */}
                <aside style={{
                    position: 'sticky', top: 16, alignSelf: 'start',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    borderLeft: '1px solid #e5e7eb', paddingLeft: 16
                }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', opacity: 0.9 }}>General</div>

                    <div style={asideCard}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>To-Do</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                            <div>• Azi: <strong>{today}</strong></div>
                            <div>• Întârziate: <strong>{late}</strong></div>
                        </div>
                        <Link href="/administratie/todo/new" style={btnLink}>+ Adaugă task</Link>
                    </div>

                    <div style={{ ...asideCard, border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#1e3a8a' }}>Taskuri deschise</div>
                        <div style={{ fontSize: 13 }}>
                            {open > 0 ? <>Aveți <strong>{open}</strong> task(uri) deschise.</> : <em>Nu aveți niciun task setat.</em>}
                        </div>
                        {/* ✅ Secțiunea nouă cerută */}
                        <div style={{ marginTop: 8 }}>
                            <Link href="/administratie/todo" style={{ fontSize: 13, textDecoration: 'underline' }}>
                                Deschide lista
                            </Link>
                        </div>
                    </div>

                    <div style={asideCard}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Sugestii și observații</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Link href="/administratie/sugestii/new" style={btnLink}>Trimite sugestie</Link>
                            <Link href="/administratie/observatii/new" style={btnLink}>Trimite observație</Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
