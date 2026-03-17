// lib/org-config.ts
// ================================================================
// SURSA UNICĂ DE ADEVĂR pentru tot ce ține de org_type.
// Orice terminologie, modul, sidebar item sau KPI se definește AICI.
// Nu hardcoda niciun string specific org_type în altă parte.
// ================================================================

// ----------------------------------------------------------------
// 1. TIPURI
// ----------------------------------------------------------------

export type OrgType = 'companie' | 'institutie_publica' | 'spital';

export type Terminology = {
  angajat: string;          // ex: "Angajat" / "Pacient" / "Funcționar"
  angajati: string;         // plural
  departament: string;      // ex: "Departament" / "Secție" / "Direcție"
  departamente: string;     // plural
  client: string;           // ex: "Client" / "Pacient" / "Cetățean"
  clienti: string;          // plural
  produs: string;           // ex: "Produs/Serviciu" / "Serviciu medical"
  produse: string;          // plural
  incident: string;         // ex: "Incident" / "Eveniment advers"
  incidente: string;        // plural
  conducere: string;        // ex: "Management" / "Conducere" / "Consiliu local"
  locatie: string;          // ex: "Punct de lucru" / "Secție" / "Sediu"
  locatii: string;          // plural
  contract: string;         // ex: "Contract" / "Act administrativ"
  contracte: string;        // plural
};

export type ModuleId =
  | 'dashboard'
  | 'administratie'
  | 'hr'
  | 'indicatori'
  | 'chestionare'
  | 'conformare'
  | 'mediu'
  | 'ssm_psi'
  | 'legislatie'
  | 'aprobari'
  | 'rapoarte'
  | 'resurse'
  | 'setari'
  | 'admin';

export type SidebarItem = {
  moduleId: ModuleId;
  href: string;
  label: string;           // label generic — poate fi suprascris per org_type
  iconKey: string;         // cheie din obiectul de icoane din RoleSidebar
};

export type DashboardKPI = {
  id: string;
  label: string;
  description: string;
  href: string;
  iconKey: string;
};

export type OrgConfig = {
  orgType: OrgType;
  label: string;            // "Companie Privată" / "Instituție Publică" / "Spital"
  description: string;      // descriere scurtă pentru onboarding
  terminology: Terminology;
  modules: ModuleId[];      // module ACTIVE pentru acest org_type
  sidebarItems: SidebarItem[];
  dashboardKPIs: DashboardKPI[];
};

// ----------------------------------------------------------------
// 2. CONFIGURAȚII PER ORG_TYPE
// ----------------------------------------------------------------

const COMPANIE_CONFIG: OrgConfig = {
  orgType: 'companie',
  label: 'Companie Privată',
  description: 'Companii private, SRL, SA, PFA — orice entitate din mediul privat.',
  terminology: {
    angajat: 'Angajat',
    angajati: 'Angajați',
    departament: 'Departament',
    departamente: 'Departamente',
    client: 'Client',
    clienti: 'Clienți',
    produs: 'Produs / Serviciu',
    produse: 'Produse / Servicii',
    incident: 'Incident',
    incidente: 'Incidente',
    conducere: 'Management',
    locatie: 'Punct de lucru',
    locatii: 'Puncte de lucru',
    contract: 'Contract',
    contracte: 'Contracte',
  },
  modules: [
    'dashboard', 'administratie', 'hr', 'indicatori', 'chestionare',
    'conformare', 'mediu', 'ssm_psi', 'legislatie',
    'aprobari', 'rapoarte', 'resurse', 'setari', 'admin',
  ],
  sidebarItems: [
    { moduleId: 'dashboard',    href: '/dashboard',   label: 'Dashboard',             iconKey: 'dashboard'   },
    { moduleId: 'administratie',href: '/administratie',label: 'Administrație',         iconKey: 'admin'       },
    { moduleId: 'hr',           href: '/hr',           label: 'HR',                    iconKey: 'users'       },
    { moduleId: 'indicatori',   href: '/indicatori',   label: 'Indicatori financiari', iconKey: 'finance'     },
    { moduleId: 'chestionare',  href: '/chestionare',  label: 'Chestionare',           iconKey: 'forms'       },
    { moduleId: 'conformare',   href: '/conformare',   label: 'Conformare',            iconKey: 'compliance'  },
    { moduleId: 'mediu',        href: '/mediu',        label: 'Mediu',                 iconKey: 'environment' },
    { moduleId: 'ssm_psi',      href: '/ssm-psi',      label: 'SSM / PSI',             iconKey: 'safety'      },
    { moduleId: 'legislatie',   href: '/legislatie',   label: 'Legislație',            iconKey: 'law'         },
    { moduleId: 'aprobari',     href: '/aprobari',     label: 'Aprobări',              iconKey: 'approvals'   },
    { moduleId: 'rapoarte',     href: '/rapoarte',     label: 'Rapoarte',              iconKey: 'reports'     },
    { moduleId: 'resurse',      href: '/resurse',      label: 'Resurse',               iconKey: 'resources'   },
    { moduleId: 'setari',       href: '/setari',       label: 'Setări',                iconKey: 'settings'    },
    { moduleId: 'admin',        href: '/admin',        label: 'Admin',                 iconKey: 'users'       },
  ],
  dashboardKPIs: [
    { id: 'angajati',    label: 'Angajați activi',        description: 'Total angajați activi în organizație',   href: '/hr',          iconKey: 'users'       },
    { id: 'conformare',  label: 'Cerințe conformare',     description: 'Cerințe ISO/ESG îndeplinite vs. total',  href: '/conformare',  iconKey: 'compliance'  },
    { id: 'incidente',   label: 'Incidente SSM',          description: 'Incidente înregistrate luna curentă',   href: '/ssm-psi',     iconKey: 'safety'      },
    { id: 'documente',   label: 'Documente active',       description: 'Documente în vigoare',                  href: '/resurse',     iconKey: 'reports'     },
  ],
};

const INSTITUTIE_PUBLICA_CONFIG: OrgConfig = {
  orgType: 'institutie_publica',
  label: 'Instituție Publică',
  description: 'Primării, consilii județene, instituții de stat, autorități publice.',
  terminology: {
    angajat: 'Funcționar',
    angajati: 'Funcționari',
    departament: 'Direcție',
    departamente: 'Direcții',
    client: 'Cetățean',
    clienti: 'Cetățeni',
    produs: 'Serviciu public',
    produse: 'Servicii publice',
    incident: 'Incident',
    incidente: 'Incidente',
    conducere: 'Conducere instituție',
    locatie: 'Sediu',
    locatii: 'Sedii',
    contract: 'Act administrativ',
    contracte: 'Acte administrative',
  },
  modules: [
    'dashboard', 'administratie', 'hr', 'indicatori', 'chestionare',
    'conformare', 'mediu', 'ssm_psi', 'legislatie',
    'aprobari', 'rapoarte', 'resurse', 'setari', 'admin',
  ],
  sidebarItems: [
    { moduleId: 'dashboard',    href: '/dashboard',   label: 'Dashboard',             iconKey: 'dashboard'   },
    { moduleId: 'administratie',href: '/administratie',label: 'Administrație',         iconKey: 'admin'       },
    { moduleId: 'hr',           href: '/hr',           label: 'Funcționari',           iconKey: 'users'       },
    { moduleId: 'indicatori',   href: '/indicatori',   label: 'Indicatori bugetari',   iconKey: 'finance'     },
    { moduleId: 'chestionare',  href: '/chestionare',  label: 'Chestionare',           iconKey: 'forms'       },
    { moduleId: 'conformare',   href: '/conformare',   label: 'Conformare',            iconKey: 'compliance'  },
    { moduleId: 'mediu',        href: '/mediu',        label: 'Mediu',                 iconKey: 'environment' },
    { moduleId: 'ssm_psi',      href: '/ssm-psi',      label: 'SSM / PSI',             iconKey: 'safety'      },
    { moduleId: 'legislatie',   href: '/legislatie',   label: 'Legislație',            iconKey: 'law'         },
    { moduleId: 'aprobari',     href: '/aprobari',     label: 'Aprobări',              iconKey: 'approvals'   },
    { moduleId: 'rapoarte',     href: '/rapoarte',     label: 'Rapoarte',              iconKey: 'reports'     },
    { moduleId: 'resurse',      href: '/resurse',      label: 'Resurse',               iconKey: 'resources'   },
    { moduleId: 'setari',       href: '/setari',       label: 'Setări',                iconKey: 'settings'    },
    { moduleId: 'admin',        href: '/admin',        label: 'Admin',                 iconKey: 'users'       },
  ],
  dashboardKPIs: [
    { id: 'functionari',  label: 'Funcționari activi',      description: 'Total funcționari activi',              href: '/hr',          iconKey: 'users'       },
    { id: 'conformare',   label: 'Cerințe conformare',      description: 'Cerințe îndeplinite vs. total',         href: '/conformare',  iconKey: 'compliance'  },
    { id: 'incidente',    label: 'Incidente SSM',           description: 'Incidente înregistrate luna curentă',   href: '/ssm-psi',     iconKey: 'safety'      },
    { id: 'acte',         label: 'Acte administrative',     description: 'Acte emise luna curentă',               href: '/administratie',iconKey: 'admin'      },
  ],
};

const SPITAL_CONFIG: OrgConfig = {
  orgType: 'spital',
  label: 'Unitate Medicală',
  description: 'Spitale, clinici, centre medicale, unități sanitare.',
  terminology: {
    angajat: 'Cadru medical',
    angajati: 'Cadre medicale',
    departament: 'Secție',
    departamente: 'Secții',
    client: 'Pacient',
    clienti: 'Pacienți',
    produs: 'Serviciu medical',
    produse: 'Servicii medicale',
    incident: 'Eveniment advers',
    incidente: 'Evenimente adverse',
    conducere: 'Comitet director',
    locatie: 'Secție / Compartiment',
    locatii: 'Secții / Compartimente',
    contract: 'Contract',
    contracte: 'Contracte',
  },
  modules: [
    'dashboard', 'administratie', 'hr', 'indicatori', 'chestionare',
    'conformare', 'mediu', 'ssm_psi', 'legislatie',
    'aprobari', 'rapoarte', 'resurse', 'setari', 'admin',
  ],
  sidebarItems: [
    { moduleId: 'dashboard',    href: '/dashboard',   label: 'Dashboard',             iconKey: 'dashboard'   },
    { moduleId: 'administratie',href: '/administratie',label: 'Administrație',         iconKey: 'admin'       },
    { moduleId: 'hr',           href: '/hr',           label: 'Cadre medicale',        iconKey: 'users'       },
    { moduleId: 'indicatori',   href: '/indicatori',   label: 'Indicatori medicali',   iconKey: 'finance'     },
    { moduleId: 'chestionare',  href: '/chestionare',  label: 'Chestionare clinice',   iconKey: 'forms'       },
    { moduleId: 'conformare',   href: '/conformare',   label: 'Conformare',            iconKey: 'compliance'  },
    { moduleId: 'mediu',        href: '/mediu',        label: 'Mediu',                 iconKey: 'environment' },
    { moduleId: 'ssm_psi',      href: '/ssm-psi',      label: 'SSM / PSI',             iconKey: 'safety'      },
    { moduleId: 'legislatie',   href: '/legislatie',   label: 'Legislație',            iconKey: 'law'         },
    { moduleId: 'aprobari',     href: '/aprobari',     label: 'Aprobări',              iconKey: 'approvals'   },
    { moduleId: 'rapoarte',     href: '/rapoarte',     label: 'Rapoarte',              iconKey: 'reports'     },
    { moduleId: 'resurse',      href: '/resurse',      label: 'Resurse',               iconKey: 'resources'   },
    { moduleId: 'setari',       href: '/setari',       label: 'Setări',                iconKey: 'settings'    },
    { moduleId: 'admin',        href: '/admin',        label: 'Admin',                 iconKey: 'users'       },
  ],
  dashboardKPIs: [
    { id: 'cadre',       label: 'Cadre medicale',          description: 'Total cadre medicale active',           href: '/hr',          iconKey: 'users'       },
    { id: 'conformare',  label: 'Cerințe conformare',      description: 'Cerințe îndeplinite vs. total',         href: '/conformare',  iconKey: 'compliance'  },
    { id: 'evenimente',  label: 'Evenimente adverse',      description: 'Evenimente înregistrate luna curentă',  href: '/ssm-psi',     iconKey: 'safety'      },
    { id: 'documente',   label: 'Documente active',        description: 'Documente în vigoare',                  href: '/resurse',     iconKey: 'reports'     },
  ],
};

// ----------------------------------------------------------------
// 3. MAP CENTRAL + HELPER
// ----------------------------------------------------------------

export const ORG_CONFIGS: Record<OrgType, OrgConfig> = {
  companie:          COMPANIE_CONFIG,
  institutie_publica: INSTITUTIE_PUBLICA_CONFIG,
  spital:            SPITAL_CONFIG,
};

/**
 * Returnează config-ul pentru un org_type dat.
 * Fallback la 'companie' dacă org_type-ul lipsește sau e invalid.
 */
export function getOrgConfig(orgType?: OrgType | null): OrgConfig {
  if (!orgType || !ORG_CONFIGS[orgType]) {
    return ORG_CONFIGS['companie'];
  }
  return ORG_CONFIGS[orgType];
}

/**
 * Shortcut pentru terminologie.
 * Folosit în componente: const t = useTerminology(); t('angajat') → "Cadru medical"
 */
export function getTerminology(orgType: OrgType | null): Terminology {
  return getOrgConfig(orgType).terminology;
}