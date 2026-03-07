'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type OrgType = 'spital' | 'institutie_publica' | 'companie' | null;

type OrgContextType = {
  orgType: OrgType;
  denumire: string;
  loading: boolean;
};

const OrgContext = createContext<OrgContextType>({ orgType: null, denumire: '', loading: true });

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgType, setOrgType] = useState<OrgType>(null);
  const [denumire, setDenumire] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        const { data: org } = await supabase
          .from('organizations')
          .select('org_type, denumire')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (org) {
          setOrgType(org.org_type as OrgType);
          setDenumire(org.denumire);
        }
      }
      setLoading(false);
    });
  }, []);

  return (
    <OrgContext.Provider value={{ orgType, denumire, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}

export const ORG_LABELS: Record<string, Record<string, string>> = {
  spital: {
    angajati: 'Paturi',
    departamente: 'Secții',
    clienti: 'Pacienți',
    produse: 'Servicii medicale',
  },
  institutie_publica: {
    angajati: 'Angajați',
    departamente: 'Departamente',
    clienti: 'Cetățeni',
    produse: 'Servicii publice',
  },
  companie: {
    angajati: 'Angajați',
    departamente: 'Departamente',
    clienti: 'Clienți',
    produse: 'Produse / Servicii',
  },
};