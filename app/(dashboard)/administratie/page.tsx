'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { countOpenTasks, countTodoLate, countTodoToday } from '@/lib/tasks/store';
import { useOrg } from '@/lib/context/OrgContext';
import { getAdminCards } from '@/lib/admin-modules-config';

// ----------------------------------------------------------------
// ICONS MAP
// ----------------------------------------------------------------
const Icons: Record<string, React.ReactNode> = {
  kitchen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 2v9" /><path d="M6 2v9" /><path d="M5 11v11" />
      <path d="M10 2v12" /><path d="M10 14c0 4 1.5 6 1.5 6H8.5s1.5-2 1.5-6z" />
    </svg>
  ),
  maintenance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 3v2M9 13v2M3 9h2M13 9h2M5 5l1.4 1.4M11.6 11.6L13 13M5 13l1.4-1.4M11.6 6.4L13 5" />
      <path d="M21 15l-5 5M17 11l6 6M16 12l2 2" />
    </svg>
  ),
  network: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
      <path d="M7 12h10M12 7v10M7 11L11 7M13 17l4-4" />
    </svg>
  ),
  cleaning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v14" /><path d="M5 20h14l1 2H4z" />
    </svg>
  ),
  headset: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 18 0" />
      <path d="M7 12v5a2 2 0 0 1-2 2H3v-7" />
      <path d="M17 12v5a2 2 0 0 0 2 2h2v-7" />
      <path d="M12 19v3" />
    </svg>
  ),
  heliport: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 7v10M16 7v10M8 12h8" />
    </svg>
  ),
  projects: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M9 3h6v3H9z" />
      <path d="M8 11h8M8 15h6M8 19h5" />
    </svg>
  ),
  users: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  stock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  docs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  security: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  energy: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  waste: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  permit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 12l2 2 4-4M7 8h10" />
    </svg>
  ),
  audit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  equipment: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  finance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  environment: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6 6 2 12 6 20c6 2 12-2 12-8V2z" />
    </svg>
  ),
  transport: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  warehouse: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  partners: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  safety: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 19h20v-3a10 10 0 0 0-20 0v3z" />
      <path d="M12 12v7" />
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  construction: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h20M4 20V10l8-8 8 8v10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  quality: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  checklist: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  planning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  production: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M9 9h6v6H9z" />
    </svg>
  ),
  pos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M7 8h10M7 12h6" />
    </svg>
  ),
  retail: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  backup: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  cloud: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  monitor: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  compliance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  land: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  animal: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
  calendar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  building: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
};

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
  background: '#fff', fontSize: 13, textDecoration: 'none',
};

export default function AdministratiePage() {
  const { orgType, categorieActivitate } = useOrg();
  const cards = getAdminCards(orgType, categorieActivitate);

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
        {orgType === 'spital'
          ? 'Alege o categorie pentru a deschide task-urile și chestionarele specifice.'
          : 'Alege o categorie administrativă pentru a gestiona task-urile și activitățile specifice.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* STÂNGA – carduri dinamice */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {cards.map(c => (
              <Link key={c.href} href={c.href} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{Icons[c.iconKey] ?? Icons.projects}</span>
                  <strong style={{ fontSize: 16 }}>{c.title}</strong>
                </div>
                <span style={{ fontSize: 13, opacity: 0.8 }}>{c.desc}</span>
                <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* DREAPTA – sidebar */}
        <aside style={{ position: 'sticky', top: 16, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '1px solid #e5e7eb', paddingLeft: 16 }}>
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
            <div style={{ marginTop: 8 }}>
              <Link href="/administratie/todo" style={{ fontSize: 13, textDecoration: 'underline' }}>Deschide lista</Link>
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