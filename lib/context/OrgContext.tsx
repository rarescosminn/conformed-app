// lib/context/OrgContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  getOrgConfig,
  type OrgType,
  type OrgConfig,
  type Terminology,
} from '@/lib/org-config';
import { type CategorieActivitate } from '@/lib/admin-modules-config';

// ----------------------------------------------------------------
// TIPURI
// ----------------------------------------------------------------
type OrgContextType = {
  orgType: OrgType | null;
  orgConfig: OrgConfig;
  denumire: string;
  categorieActivitate: CategorieActivitate | null;
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
  categorieActivitate: null,
  loading: true,
  refetch: async () => {},
});

// ----------------------------------------------------------------
// PROVIDER
// ----------------------------------------------------------------
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [denumire, setDenumire] = useState('');
  const [categorieActivitate, setCategorieActivitate] = useState<CategorieActivitate | null>(null);
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
          .select('org_type, denumire, categorie_activitate')
          .eq('user_id', user.id)
          .maybeSingle();

        if (org) {
          setOrgType(org.org_type as OrgType);
          setDenumire(org.denumire ?? '');
          setCategorieActivitate(org.categorie_activitate as CategorieActivitate ?? null);
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
    <OrgContext.Provider value={{ orgType, orgConfig, denumire, categorieActivitate, loading, refetch: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

// ----------------------------------------------------------------
// HOOKS
// ----------------------------------------------------------------
export function useOrg() {
  return useContext(OrgContext);
}

export function useOrgConfig(): OrgConfig {
  return useContext(OrgContext).orgConfig;
}

export function useTerminology(): Terminology {
  return useContext(OrgContext).orgConfig.terminology;
}

// ----------------------------------------------------------------
// EXPORT LEGACY
// ----------------------------------------------------------------
export type { OrgType };

export const ORG_LABELS = {
  companie:          { angajati: 'Angajați',       departamente: 'Departamente', clienti: 'Clienți',    produse: 'Produse / Servicii'  },
  institutie_publica:{ angajati: 'Funcționari',    departamente: 'Direcții',     clienti: 'Cetățeni',   produse: 'Servicii publice'     },
  spital:            { angajati: 'Cadre medicale', departamente: 'Secții',       clienti: 'Pacienți',   produse: 'Servicii medicale'    },
};