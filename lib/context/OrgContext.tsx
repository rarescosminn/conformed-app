// lib/context/OrgContext.tsx
// ================================================================
// Context global pentru org_type.
// Expune: orgType, orgConfig, denumire, loading, refetch
// Hooks: useOrg(), useOrgConfig(), useTerminology()
// ================================================================
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  getOrgConfig,
  type OrgType,
  type OrgConfig,
  type Terminology,
} from '@/lib/org-config';

// ----------------------------------------------------------------
// TIPURI
// ----------------------------------------------------------------
type OrgContextType = {
  orgType: OrgType | null;
  orgConfig: OrgConfig;
  denumire: string;
  loading: boolean;
  refetch: () => Promise<void>;
};

// ----------------------------------------------------------------
// CONTEXT
// ----------------------------------------------------------------
const OrgContext = createContext<OrgContextType>({
  orgType: null,
  orgConfig: getOrgConfig(null),
  denumire: '',
  loading: true,
  refetch: async () => {},
});

// ----------------------------------------------------------------
// PROVIDER
// ----------------------------------------------------------------
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [denumire, setDenumire] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrg = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: org } = await supabase
          .from('organizations')
          .select('org_type, denumire')
          .eq('user_id', user.id)
          .maybeSingle();

        if (org) {
          setOrgType(org.org_type as OrgType);
          setDenumire(org.denumire ?? '');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const orgConfig = getOrgConfig(orgType);

  return (
    <OrgContext.Provider value={{ orgType, orgConfig, denumire, loading, refetch: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

// ----------------------------------------------------------------
// HOOKS
// ----------------------------------------------------------------

/**
 * Hook principal — returnează tot contextul.
 * Compatibil cu useOrg() existent.
 */
export function useOrg() {
  return useContext(OrgContext);
}

/**
 * Shortcut pentru orgConfig complet.
 * const config = useOrgConfig();
 * config.sidebarItems, config.dashboardKPIs etc.
 */
export function useOrgConfig(): OrgConfig {
  return useContext(OrgContext).orgConfig;
}

/**
 * Shortcut pentru terminologie.
 * const t = useTerminology();
 * t.angajat → "Angajat" / "Cadru medical" / "Funcționar"
 */
export function useTerminology(): Terminology {
  return useContext(OrgContext).orgConfig.terminology;
}

// ----------------------------------------------------------------
// EXPORT LEGACY (păstrat pentru compatibilitate)
// ----------------------------------------------------------------
export type { OrgType };

export const ORG_LABELS = {
  companie: {
    angajati: 'Angajați',
    departamente: 'Departamente',
    clienti: 'Clienți',
    produse: 'Produse / Servicii',
  },
  institutie_publica: {
    angajati: 'Funcționari',
    departamente: 'Direcții',
    clienti: 'Cetățeni',
    produse: 'Servicii publice',
  },
  spital: {
    angajati: 'Cadre medicale',
    departamente: 'Secții',
    clienti: 'Pacienți',
    produse: 'Servicii medicale',
  },
};