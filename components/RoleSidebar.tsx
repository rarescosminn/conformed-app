// components/RoleSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrgConfig } from '@/lib/context/OrgContext';
import FooterUser from '@/components/FooterUser';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// ----------------------------------------------------------------
// ICONS MAP
// ----------------------------------------------------------------
const Icons: Record<string, ReactNode> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  forms: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  compliance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  law: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  approvals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </svg>
  ),
  finance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3v18" />
      <path d="M9 3h10v4H9z" />
      <path d="M13 9h6M13 13h6M13 17h6" />
    </svg>
  ),
  environment: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6 6 2 12 6 20c6 2 12-2 12-8V2z" />
    </svg>
  ),
  safety: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 19h20v-3a10 10 0 0 0-20 0v3z" />
      <path d="M12 12v7" />
    </svg>
  ),
  resources: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v4H4zM4 12h16v8H4z" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7.92 4.68a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ----------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------
export default function RoleSidebar() {
  const pathname = usePathname();
  const config = useOrgConfig();
  const [isOpen, setIsOpen] = useState(false);

  // Închide sidebar la schimbare rută
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Blochează scroll pe body când sidebar-ul e deschis pe mobil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Buton hamburger — vizibil doar pe mobil */}
      <button
        className="sb-toggle"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Închide meniu' : 'Deschide meniu'}
      >
        {isOpen ? <IconClose /> : <IconMenu />}
      </button>

      {/* Overlay — vizibil doar pe mobil când sidebar-ul e deschis */}
      <div
        className={`sb-overlay${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sb${isOpen ? ' is-open' : ''}`}>
        <div className="sb__brand" aria-label="eConformed">
          <div className="sb__logo">{Icons.dashboard}</div>
          <div className="sb__brandText"><strong>eConformed</strong></div>
        </div>

        <nav className="sb__nav" aria-label="Main navigation">
          {config.sidebarItems.map(({ href, label, iconKey }) => {
            const isActive = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`sb__link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                title={label}
              >
                <span className="sb__icon">{Icons[iconKey] ?? Icons.dashboard}</span>
                <span className="sb__text">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sb__footer">
          <FooterUser />
        </div>
      </aside>
    </>
  );
}