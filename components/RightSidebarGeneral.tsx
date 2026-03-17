// components/RightSidebarGeneral.tsx
// ================================================================
// Sidebar dreapta 100% dinamic — cardurile sunt generate din
// useOrgConfig().dashboardKPIs. Nu există conținut hardcodat
// per org_type în acest fișier.
// Pentru a modifica cardurile → editează lib/org-config.ts
// ================================================================
'use client';

import Link from 'next/link';
import { useOrgConfig } from '@/lib/context/OrgContext';

// ----------------------------------------------------------------
// ICONS MAP (același pattern ca RoleSidebar)
// ----------------------------------------------------------------
const Icons: Record<string, React.ReactNode> = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  compliance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  safety: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 19h20v-3a10 10 0 0 0-20 0v3z" />
      <path d="M12 12v7" />
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3v18" />
      <path d="M9 3h10v4H9z" />
      <path d="M13 9h6M13 13h6M13 17h6" />
    </svg>
  ),
  finance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  admin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  ),
};

// ----------------------------------------------------------------
// CARD COMPONENT
// ----------------------------------------------------------------
const KPICard = ({
  label,
  description,
  href,
  iconKey,
}: {
  label: string;
  description: string;
  href: string;
  iconKey: string;
}) => (
  <div className="rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 bg-white">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
        {Icons[iconKey] ?? Icons.reports}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <Link
      href={href}
      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline"
    >
      Deschide →
    </Link>
  </div>
);

// ----------------------------------------------------------------
// LOADING SKELETON
// ----------------------------------------------------------------
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 p-4 mb-4 bg-white animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
    </div>
    <div className="h-3 bg-gray-100 rounded w-1/4" />
  </div>
);

// ----------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------
export default function RightSidebarGeneral() {
  const config = useOrgConfig();

  // Loading state — orgConfig nu e încă disponibil
  if (!config || !config.dashboardKPIs) {
    return (
      <aside className="w-full">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </aside>
    );
  }

  return (
    <aside className="w-full">
      {config.dashboardKPIs.map(kpi => (
        <KPICard
          key={kpi.id}
          label={kpi.label}
          description={kpi.description}
          href={kpi.href}
          iconKey={kpi.iconKey}
        />
      ))}
    </aside>
  );
}