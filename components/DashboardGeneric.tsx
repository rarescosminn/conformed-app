"use client";

import * as React from "react";
import { useOrg } from '@/lib/context/OrgContext';
import { useMemo, useState, useEffect } from "react";
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { createBrowserClient } from '@supabase/ssr';

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
type Tone = "ok" | "warn" | "danger" | null;

type KpiModel = {
  key: string;
  title: string;
  value: string;
  subtitle?: string;
  badge?: Tone;
  hint?: string;
};

type ParsedTable = {
  filename: string;
  rows: Record<string, string | number>[];
  columns: string[];
};

// ----------------------------------------------------------------
// GLOSAR
// ----------------------------------------------------------------
const GLOSAR: Record<string, string> = {
  "Angajați activi": "Total angajați cu contract activ în organizație.",
  "Fluctuație personal": "Raport ieșiri / total angajați × 100. Sub 5% = OK, 5-10% = Atenție, >10% = Risc.",
  "Productivitate": "Cifra de afaceri / număr angajați. Indicator de eficiență operațională.",
  "Conformare ISO": "Procent cerințe ISO îndeplinite din total cerințe evaluate.",
  "Neconformități": "Număr neconformități deschise (neremediate) la data curentă.",
  "Incidente SSM": "Număr incidente de securitate și sănătate în muncă înregistrate în perioada selectată.",
  "Riscuri deschise": "Riscuri identificate cu status diferit de 'închis'.",
  "Working Capital": "Active circulante minus Furnizori. Indicator de lichiditate pe termen scurt.",
  "Current Ratio": "Active circulante / Furnizori. ≥1 = OK, <1 = Atenție, <0.9 = Risc.",
  "DSO": "Days Sales Outstanding — zile medii de încasare creanțe clienți.",
  "DPO": "Days Payable Outstanding — zile medii de plată furnizori.",
  "Cifră afaceri": "Total venituri din activitatea de bază a organizației.",
  "Rezultat operațional": "Venituri totale minus Cheltuieli totale operaționale.",
};

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------
const fmtPct = (n: number) => isFinite(n) ? `${n.toFixed(1)}%` : "–";
const fmtRON = (n: number) =>
  isFinite(n)
    ? new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(n)
    : "–";
const fmtNr = (n: number) => isFinite(n) ? Math.round(n).toLocaleString("ro-RO") : "–";

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(/\s/g, "").replace("%", "")
    .replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  return parseFloat(s);
}

function sum(nums: number[]): number {
  const arr = nums.filter(x => isFinite(x));
  return arr.length ? arr.reduce((a, b) => a + b, 0) : NaN;
}

function mean(nums: number[]): number {
  const arr = nums.filter(x => isFinite(x));
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
}

function detectColumn(columns: string[], candidates: string[]): string | null {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const cand of candidates) {
    const idx = columns.findIndex(c => norm(c) === norm(cand));
    if (idx >= 0) return columns[idx];
  }
  return null;
}

function parseCSV(text: string): ParsedTable {
  const raw = text.replace(/\r\n/g, "\n").trim();
  const delimiter = raw.includes(";") && !raw.includes(",") ? ";" : ",";
  const lines = raw.split("\n").filter(Boolean);
  if (!lines.length) return { filename: "", rows: [], columns: [] };
  const columns = lines[0].split(delimiter).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cells = line.split(delimiter);
    return Object.fromEntries(columns.map((c, i) => [c, (cells[i] ?? "").trim()]));
  });
  return { filename: "", rows, columns };
}

function daysInQuarter(y: number, t: string) {
  const map: Record<string, [number, number]> = { T1: [0, 2], T2: [3, 5], T3: [6, 8], T4: [9, 11] };
  const [mStart, mEnd] = map[t] ?? [0, 2];
  const diff = (new Date(y, mEnd + 1, 0).getTime() - new Date(y, mStart, 1).getTime()) / (1000 * 60 * 60 * 24) + 1;
  return Math.max(1, Math.round(diff));
}

// ----------------------------------------------------------------
// KPI FIELD KEYS
// ----------------------------------------------------------------
type KpiFieldKey =
  | "Angajati_activi" | "Angajati_plecati" | "Zile_absenta" | "Zile_lucratoare"
  | "CA_RON" | "Cheltuieli_RON" | "Salarii_RON" | "Utilitati_RON" | "Chirii_RON"
  | "Alte_chelt_RON" | "Active_curente_RON" | "Furnizori_RON" | "Creante_clienti_RON"
  | "Cerinte_total" | "Cerinte_conforme" | "NC_deschise" | "Audituri_planificate"
  | "Incidente_SSM" | "Riscuri_deschise" | "EIP_expirate" | "Instruiri_scadente"
  | "Contracte_active" | "Contracte_expirante" | "Valoare_contracte_RON";

const DEFAULT_MAPPING: Record<KpiFieldKey, string | null> = {
  Angajati_activi: null, Angajati_plecati: null, Zile_absenta: null, Zile_lucratoare: null,
  CA_RON: null, Cheltuieli_RON: null, Salarii_RON: null, Utilitati_RON: null,
  Chirii_RON: null, Alte_chelt_RON: null, Active_curente_RON: null,
  Furnizori_RON: null, Creante_clienti_RON: null,
  Cerinte_total: null, Cerinte_conforme: null, NC_deschise: null, Audituri_planificate: null,
  Incidente_SSM: null, Riscuri_deschise: null, EIP_expirate: null, Instruiri_scadente: null,
  Contracte_active: null, Contracte_expirante: null, Valoare_contracte_RON: null,
};

// ----------------------------------------------------------------
// THRESHOLDS
// ----------------------------------------------------------------
type Thresholds = {
  fluctuatiePct: { warn: number; danger: number };
  conformarePct: { ok: number; warn: number };
  currentRatio: { okGE: number; dangerLT: number };
  dso: { warnGT: number; dangerGT: number };
  dpo: { warnGT: number; dangerGT: number };
};

const DEFAULT_THRESHOLDS: Thresholds = {
  fluctuatiePct: { warn: 5, danger: 10 },
  conformarePct: { ok: 80, warn: 60 },
  currentRatio: { okGE: 1.0, dangerLT: 0.9 },
  dso: { warnGT: 60, dangerGT: 90 },
  dpo: { warnGT: 75, dangerGT: 100 },
};

// ----------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------
export default function DashboardGenericPage() {
  const { orgType, denumire } = useOrg();
  usePageTitle('Dashboard');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => String(currentYear - i)), [currentYear]);
  const quarters = ["T1", "T2", "T3", "T4"];

  const [year, setYear] = useState(years[0]);
  const [quarter, setQuarter] = useState("T1");
  const [activeDept, setActiveDept] = useState("Toate");
  const [activeTab, setActiveTab] = useState<"hr" | "conformare" | "pl" | "flux">("hr");
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [departments, setDepartments] = useState<string[]>([]);

  // Upload CSV
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<KpiFieldKey, string | null>>({ ...DEFAULT_MAPPING });
  const [uploaderMsg, setUploaderMsg] = useState("");

  // DB stats
  const [dbStats, setDbStats] = useState({
    angajatiActivi: 0, incidenteSSM: 0, riscuriDeschise: 0,
    cerinte: 0, cerinteConforme: 0, ncDeschise: 0,
    eipExpirate: 0, instruiriScadente: 0,
  });

  const SAVE_KEY = "dash_generic_v1";

  // Load saved view
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.year) setYear(p.year);
      if (p.quarter) setQuarter(p.quarter);
      if (p.tab) setActiveTab(p.tab);
      if (p.thresholds) setThresholds(p.thresholds);
    } catch { }
  }, []);

  // Save view
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ year, quarter, tab: activeTab, thresholds }));
    } catch { }
  }, [year, quarter, activeTab, thresholds]);

  // Load DB stats
  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase.from('organizations').select('id').eq('user_id', user.id).maybeSingle();
      if (!org) return;

      const orgId = org.id;

      const [angajati, incidente, riscuri, cerinte, nc, eip, instruiri, depts] = await Promise.all([
        supabase.from('hr_angajati').select('id', { count: 'exact' }).eq('org_id', orgId).eq('activ', true),
        supabase.from('ssm_incidente').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('ssm_riscuri').select('id', { count: 'exact' }).eq('org_id', orgId).neq('status', 'inchis'),
        supabase.from('conformare_cerinte').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('conformare_cerinte').select('id', { count: 'exact' }).eq('org_id', orgId).eq('status', 'neconform'),
        supabase.from('ssm_eip').select('id', { count: 'exact' }).eq('org_id', orgId).eq('confirmat', false),
        supabase.from('ssm_instruiri').select('id', { count: 'exact' }).eq('org_id', orgId).eq('finalizat', false),
        supabase.from('departments').select('nume').eq('org_id', orgId).eq('activ', true),
      ]);

      const cerTotal = cerinte.count ?? 0;
      const ncTotal = nc.count ?? 0;
      const cerinteConforme = cerTotal - ncTotal;

      setDbStats({
        angajatiActivi: angajati.count ?? 0,
        incidenteSSM: incidente.count ?? 0,
        riscuriDeschise: riscuri.count ?? 0,
        cerinte: cerTotal,
        cerinteConforme,
        ncDeschise: ncTotal,
        eipExpirate: eip.count ?? 0,
        instruiriScadente: instruiri.count ?? 0,
      });

      if (depts.data) {
        setDepartments(['Toate', ...Array.from(new Set(depts.data.map(d => d.nume)))]);
      }
    }
    loadStats();
  }, []);

  // File upload
  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploadedFiles(list);
    const parsed: ParsedTable[] = [];
    for (const f of list) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (ext === "csv") {
        const text = await f.text();
        const table = parseCSV(text);
        table.filename = f.name;
        parsed.push(table);
      } else {
        parsed.push({ filename: f.name, rows: [], columns: [] });
        setUploaderMsg("Momentan doar CSV este suportat.");
      }
    }
    setParsedTables(parsed);
    if (parsed.length) setSelectedFile(parsed[0].filename);
  }

  const activeTable = useMemo(
    () => parsedTables.find(t => t.filename === selectedFile) ?? null,
    [parsedTables, selectedFile]
  );

  // Extract KPI data from CSV
  const csvData = useMemo(() => {
    const nan = NaN;
    if (!activeTable?.rows.length) return null;

    const M = mapping;
    const rows = activeTable.rows;

    const g = (key: KpiFieldKey, fn: (vals: number[]) => number) => {
      const col = M[key];
      if (!col) return NaN;
      return fn(rows.map(r => toNumber(r[col])));
    };

    const angajati = g("Angajati_activi", sum);
    const plecati = g("Angajati_plecati", sum);
    const fluctuatie = (isFinite(angajati) && isFinite(plecati) && angajati > 0) ? (plecati / angajati) * 100 : NaN;

    const zileAbsenta = g("Zile_absenta", sum);
    const zileLucratoare = g("Zile_lucratoare", mean);
    const prezentaPct = (isFinite(zileAbsenta) && isFinite(zileLucratoare) && isFinite(angajati) && zileLucratoare > 0 && angajati > 0)
      ? ((1 - zileAbsenta / (angajati * zileLucratoare)) * 100)
      : NaN;

    const ca = g("CA_RON", sum);
    const chelt = g("Cheltuieli_RON", sum);
    const salarii = g("Salarii_RON", sum);
    const utilitati = g("Utilitati_RON", sum);
    const chirii = g("Chirii_RON", sum);
    const alteChelt = g("Alte_chelt_RON", sum);
    const rezultat = (isFinite(ca) && isFinite(chelt)) ? ca - chelt : NaN;
    const marja = (isFinite(rezultat) && isFinite(ca) && ca !== 0) ? (rezultat / ca) * 100 : NaN;
    const productivitate = (isFinite(ca) && isFinite(angajati) && angajati > 0) ? ca / angajati : NaN;

    const active = g("Active_curente_RON", sum);
    const furnizori = g("Furnizori_RON", sum);
    const creante = g("Creante_clienti_RON", sum);
    const wcRON = (isFinite(active) && isFinite(furnizori)) ? active - furnizori : NaN;
    const currRatio = (isFinite(active) && isFinite(furnizori) && furnizori !== 0) ? active / furnizori : NaN;

    const y = Number(year);
    const days = daysInQuarter(isFinite(y) ? y : currentYear, quarter);
    const dailyRev = (isFinite(ca) && days > 0) ? ca / days : NaN;
    const dailyPurch = (isFinite(chelt) && days > 0) ? chelt / days : NaN;
    const dso = (isFinite(creante) && isFinite(dailyRev) && dailyRev > 0) ? Math.round(creante / dailyRev) : NaN;
    const dpo = (isFinite(furnizori) && isFinite(dailyPurch) && dailyPurch > 0) ? Math.round(furnizori / dailyPurch) : NaN;

    const cerinteTotal = g("Cerinte_total", sum);
    const cerinteConforme = g("Cerinte_conforme", sum);
    const conformarePct = (isFinite(cerinteTotal) && isFinite(cerinteConforme) && cerinteTotal > 0)
      ? (cerinteConforme / cerinteTotal) * 100 : NaN;
    const ncDeschise = g("NC_deschise", sum);
    const audituri = g("Audituri_planificate", sum);
    const incidente = g("Incidente_SSM", sum);
    const riscuri = g("Riscuri_deschise", sum);
    const eip = g("EIP_expirate", sum);
    const instruiri = g("Instruiri_scadente", sum);
    const contracteActive = g("Contracte_active", sum);
    const contracteExpirante = g("Contracte_expirante", sum);
    const valContracte = g("Valoare_contracte_RON", sum);

    return {
      angajati, plecati, fluctuatie, prezentaPct,
      ca, chelt, salarii, utilitati, chirii, alteChelt, rezultat, marja, productivitate,
      active, furnizori, creante, wcRON, currRatio, dso, dpo,
      cerinteTotal, cerinteConforme, conformarePct, ncDeschise, audituri,
      incidente, riscuri, eip, instruiri,
      contracteActive, contracteExpirante, valContracte,
    };
  }, [activeTable, mapping, year, quarter]);

  // Use CSV data if available, otherwise DB stats
  const D = csvData;
  const conformarePct = D?.conformarePct ?? (dbStats.cerinte > 0 ? (dbStats.cerinteConforme / dbStats.cerinte) * 100 : NaN);

  // Badge functions
  const toneConformare = (pct: number): Tone => {
    if (!isFinite(pct)) return null;
    if (pct >= thresholds.conformarePct.ok) return "ok";
    if (pct >= thresholds.conformarePct.warn) return "warn";
    return "danger";
  };
  const toneFluctuatie = (pct: number): Tone => {
    if (!isFinite(pct)) return null;
    if (pct >= thresholds.fluctuatiePct.danger) return "danger";
    if (pct >= thresholds.fluctuatiePct.warn) return "warn";
    return "ok";
  };
  const toneRatio = (r: number): Tone => {
    if (!isFinite(r)) return null;
    if (r >= thresholds.currentRatio.okGE) return "ok";
    if (r >= thresholds.currentRatio.dangerLT) return "warn";
    return "danger";
  };
  const toneDSO = (d: number): Tone => {
    if (!isFinite(d)) return null;
    if (d > thresholds.dso.dangerGT) return "danger";
    if (d > thresholds.dso.warnGT) return "warn";
    return "ok";
  };
  const toneDPO = (d: number): Tone => {
    if (!isFinite(d)) return null;
    if (d > thresholds.dpo.dangerGT) return "danger";
    if (d > thresholds.dpo.warnGT) return "warn";
    return "ok";
  };

  const tipOrg = orgType === 'institutie_publica' ? 'Instituție Publică' : 'Companie';
  const lblAngajat = orgType === 'institutie_publica' ? 'Funcționar' : 'Angajat';
  const lblAngajati = orgType === 'institutie_publica' ? 'Funcționari' : 'Angajați';
  const lblDept = orgType === 'institutie_publica' ? 'Direcție' : 'Departament';

  return (
    <div style={styles.page}>

      {/* Header organizație */}
      {denumire && (
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{tipOrg}:</span>
            <span style={{ fontSize: 13, color: '#4F46E5', fontWeight: 700, marginLeft: 6 }}>{denumire}</span>
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{year} – {quarter}</span>
        </div>
      )}

      {/* Filtre + Upload */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.h1}>Dashboard</h1>
          <div style={styles.filters}>
            <SelectUI value={year} onChange={setYear} label="An" options={years} />
            <SelectUI value={quarter} onChange={setQuarter} label="Trimestru" options={quarters} />
            {departments.length > 1 && (
              <SelectUI value={activeDept} onChange={setActiveDept} label={lblDept} options={departments} />
            )}
          </div>
          <UploaderPanel onFiles={handleFilesSelected} uploadedFiles={uploadedFiles} parsedTables={parsedTables} message={uploaderMsg} />
        </div>
        <div style={styles.headerRight}>
          <TabNav active={activeTab} onChange={setActiveTab} orgType={orgType} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.smallBtn} onClick={() => { localStorage.removeItem(SAVE_KEY); setYear(years[0]); setQuarter("T1"); setActiveTab("hr"); setThresholds(DEFAULT_THRESHOLDS); }}>
              Reset view
            </button>
          </div>
        </div>
      </header>

      {/* Mapping Panel */}
      <MappingPanel
        tables={parsedTables}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
        mapping={mapping}
        onChangeMapping={(field, col) => setMapping(m => ({ ...m, [field]: col }))}
        orgType={orgType}
        lblAngajati={lblAngajati}
      />

      {/* ===== SECȚIUNEA 1 — HR ===== */}
      <Section title={`${lblAngajati} & Resurse Umane`}>
        <div style={styles.kpiGrid}>
          {[
            {
              key: "angajati", title: `${lblAngajati} activi`,
              value: fmtNr(D?.angajati ?? dbStats.angajatiActivi),
              subtitle: "total cu contract activ",
              badge: null as Tone,
              hint: "Din baza de date + date CSV",
            },
            {
              key: "fluctuatie", title: "Fluctuație personal",
              value: fmtPct(D?.fluctuatie ?? NaN),
              subtitle: D?.plecati ? `${fmtNr(D.plecati)} plecați` : "Încarcă CSV pentru date",
              badge: toneFluctuatie(D?.fluctuatie ?? NaN),
              hint: `Alertă >${thresholds.fluctuatiePct.warn}%, Risc >${thresholds.fluctuatiePct.danger}%`,
            },
            {
              key: "prezenta", title: "Prezență medie",
              value: fmtPct(D?.prezentaPct ?? NaN),
              subtitle: "din zile lucrătoare",
              badge: (isFinite(D?.prezentaPct ?? NaN) ? ((D?.prezentaPct ?? 0) >= 95 ? "ok" : (D?.prezentaPct ?? 0) >= 85 ? "warn" : "danger") : null) as Tone,
              hint: "100% - zile absență / (angajați × zile lucrătoare)",
            },
            {
              key: "productivitate", title: "Productivitate",
              value: fmtRON(D?.productivitate ?? NaN),
              subtitle: `CA / ${lblAngajat}`,
              badge: null as Tone,
              hint: "Cifra de afaceri împărțită la numărul de angajați",
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SECȚIUNEA 2 — Conformare ISO/ESG ===== */}
      <Section title="Conformare ISO & ESG">
        <div style={styles.kpiGrid}>
          {[
            {
              key: "conf_pct", title: "Conformare ISO",
              value: fmtPct(conformarePct),
              subtitle: `${fmtNr(D?.cerinteConforme ?? dbStats.cerinteConforme)} / ${fmtNr(D?.cerinteTotal ?? dbStats.cerinte)} cerințe`,
              badge: toneConformare(conformarePct),
              hint: `OK ≥${thresholds.conformarePct.ok}%, Atenție ≥${thresholds.conformarePct.warn}%`,
            },
            {
              key: "nc_deschise", title: "Neconformități deschise",
              value: fmtNr(D?.ncDeschise ?? dbStats.ncDeschise),
              subtitle: "neremediate la data curentă",
              badge: ((D?.ncDeschise ?? dbStats.ncDeschise) === 0 ? "ok" : (D?.ncDeschise ?? dbStats.ncDeschise) <= 3 ? "warn" : "danger") as Tone,
              hint: "Neconformități cu status diferit de 'conform'",
            },
            {
              key: "audituri", title: "Audituri planificate",
              value: fmtNr(D?.audituri ?? NaN),
              subtitle: "în perioada selectată",
              badge: null as Tone,
              hint: "Audituri interne și externe programate",
            },
            {
              key: "riscuri", title: "Riscuri deschise",
              value: fmtNr(D?.riscuri ?? dbStats.riscuriDeschise),
              subtitle: "registru riscuri activ",
              badge: ((D?.riscuri ?? dbStats.riscuriDeschise) === 0 ? "ok" : (D?.riscuri ?? dbStats.riscuriDeschise) <= 5 ? "warn" : "danger") as Tone,
              hint: "Riscuri identificate și neînchise",
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SECȚIUNEA 3 — SSM/PSI ===== */}
      <Section title="Securitate & Sănătate în Muncă">
        <div style={styles.kpiGrid}>
          {[
            {
              key: "incidente", title: "Incidente SSM",
              value: fmtNr(D?.incidente ?? dbStats.incidenteSSM),
              subtitle: "luna curentă",
              badge: ((D?.incidente ?? dbStats.incidenteSSM) === 0 ? "ok" : (D?.incidente ?? dbStats.incidenteSSM) <= 2 ? "warn" : "danger") as Tone,
              hint: "Accidente, incidente, near miss înregistrate",
            },
            {
              key: "eip", title: "EIP expirate",
              value: fmtNr(D?.eip ?? dbStats.eipExpirate),
              subtitle: "echipamente de protecție",
              badge: ((D?.eip ?? dbStats.eipExpirate) === 0 ? "ok" : (D?.eip ?? dbStats.eipExpirate) <= 3 ? "warn" : "danger") as Tone,
              hint: "EIP neconfirmate sau cu data expirată",
            },
            {
              key: "instruiri", title: "Instruiri scadente",
              value: fmtNr(D?.instruiri ?? dbStats.instruiriScadente),
              subtitle: "nefinalizate",
              badge: ((D?.instruiri ?? dbStats.instruiriScadente) === 0 ? "ok" : (D?.instruiri ?? dbStats.instruiriScadente) <= 5 ? "warn" : "danger") as Tone,
              hint: "Instruiri SSM programate și nerealizate",
            },
            {
              key: "riscuri_ssm", title: "Riscuri SSM deschise",
              value: fmtNr(D?.riscuri ?? dbStats.riscuriDeschise),
              subtitle: "evaluare riscuri",
              badge: ((D?.riscuri ?? dbStats.riscuriDeschise) === 0 ? "ok" : "warn") as Tone,
              hint: "Din registrul de riscuri SSM",
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SECȚIUNEA 4 — Financiar ===== */}
      <Section title="Financiar & Rezultate">
        <div style={styles.kpiGrid}>
          {[
            {
              key: "ca", title: "Cifră de afaceri",
              value: fmtRON(D?.ca ?? NaN),
              subtitle: `${year} – ${quarter}`,
              badge: null as Tone,
              hint: "Total venituri din activitatea de bază",
            },
            {
              key: "chelt", title: "Cheltuieli totale",
              value: fmtRON(D?.chelt ?? NaN),
              subtitle: "operaționale",
              badge: null as Tone,
            },
            {
              key: "rezultat", title: "Rezultat operațional",
              value: fmtRON(D?.rezultat ?? NaN),
              subtitle: fmtPct(D?.marja ?? NaN) !== "–" ? `Marjă: ${fmtPct(D?.marja ?? NaN)}` : undefined,
              badge: (isFinite(D?.rezultat ?? NaN) ? ((D?.rezultat ?? 0) >= 0 ? "ok" : "danger") : null) as Tone,
              hint: "Venituri minus Cheltuieli operaționale",
            },
            {
              key: "salarii_pct", title: "Pondere salarii",
              value: (isFinite(D?.salarii ?? NaN) && isFinite(D?.chelt ?? NaN) && (D?.chelt ?? 0) > 0)
                ? fmtPct(((D?.salarii ?? 0) / (D?.chelt ?? 1)) * 100) : "–",
              subtitle: "din total cheltuieli",
              badge: null as Tone,
              hint: "Cheltuieli salarii / Cheltuieli totale",
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SECȚIUNEA 5 — Contracte ===== */}
      <Section title="Contracte & Furnizori">
        <div style={styles.kpiGrid}>
          {[
            {
              key: "contracte_active", title: "Contracte active",
              value: fmtNr(D?.contracteActive ?? NaN),
              subtitle: "în vigoare",
              badge: null as Tone,
            },
            {
              key: "contracte_exp", title: "Contracte expirante",
              value: fmtNr(D?.contracteExpirante ?? NaN),
              subtitle: "în ≤ 60 zile",
              badge: (isFinite(D?.contracteExpirante ?? NaN) ? ((D?.contracteExpirante ?? 0) === 0 ? "ok" : (D?.contracteExpirante ?? 0) <= 3 ? "warn" : "danger") : null) as Tone,
              hint: "Contracte care expiră în mai puțin de 60 de zile",
            },
            {
              key: "val_contracte", title: "Valoare contracte",
              value: fmtRON(D?.valContracte ?? NaN),
              subtitle: "total valoare angajată",
              badge: null as Tone,
            },
            {
              key: "furnizori_val", title: "Datorii furnizori",
              value: fmtRON(D?.furnizori ?? NaN),
              subtitle: "sold la data raportării",
              badge: null as Tone,
              hint: "Sold furnizori — comparați cu active circulante",
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SECȚIUNEA 6 — Lichiditate ===== */}
      <Section title="Lichiditate & Flux Financiar">
        <div style={styles.kpiGrid}>
          {[
            {
              key: "wc", title: "Working Capital",
              value: fmtRON(D?.wcRON ?? NaN),
              subtitle: "Active curente minus Furnizori",
              badge: (isFinite(D?.wcRON ?? NaN) ? ((D?.wcRON ?? 0) >= 0 ? "ok" : "danger") : null) as Tone,
              hint: "Indicator lichiditate pe termen scurt",
            },
            {
              key: "curr_ratio", title: "Current Ratio",
              value: isFinite(D?.currRatio ?? NaN) ? (D?.currRatio ?? 0).toFixed(2) : "–",
              subtitle: "Active curente / Furnizori",
              badge: toneRatio(D?.currRatio ?? NaN),
              hint: `OK ≥${thresholds.currentRatio.okGE}, Risc <${thresholds.currentRatio.dangerLT}`,
            },
            {
              key: "dso", title: "DSO (zile încasare)",
              value: isFinite(D?.dso ?? NaN) ? `${D?.dso} zile` : "–",
              subtitle: "Days Sales Outstanding",
              badge: toneDSO(D?.dso ?? NaN),
              hint: `Alertă >${thresholds.dso.warnGT} zile`,
            },
            {
              key: "dpo", title: "DPO (zile plată)",
              value: isFinite(D?.dpo ?? NaN) ? `${D?.dpo} zile` : "–",
              subtitle: "Days Payable Outstanding",
              badge: toneDPO(D?.dpo ?? NaN),
              hint: `Alertă >${thresholds.dpo.warnGT} zile`,
            },
          ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} glossaryKey={rest.title} />)}
        </div>
      </Section>

      {/* ===== SCORECARDS DEPARTAMENTE ===== */}
      {departments.length > 1 && (
        <Section title={`Scorecard ${lblDept}e`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {departments.filter(d => d !== 'Toate').map(dept => (
              <div key={dept} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{dept}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  <div>Incidente: <strong>–</strong></div>
                  <div>Conformare: <strong>–</strong></div>
                  <div>Riscuri: <strong>–</strong></div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== TABURI SECUNDARE ===== */}
      <div style={{ marginTop: 16 }}>
        {activeTab === "hr" && D && <HrDetailSection data={D} lblAngajati={lblAngajati} />}
        {activeTab === "conformare" && <ConformareDetailSection data={D} dbStats={dbStats} />}
        {activeTab === "pl" && D && <PlDetailSection data={D} />}
        {activeTab === "flux" && D && (
          <FluxDetailSection data={D} thresholds={thresholds} setThresholds={setThresholds} />
        )}
      </div>

    </div>
  );
}

// ----------------------------------------------------------------
// TAB SECTIONS
// ----------------------------------------------------------------
function HrDetailSection({ data, lblAngajati }: { data: any; lblAngajati: string }) {
  const cards: KpiModel[] = [
    { key: "pct_sal", title: "Pondere salarii", value: fmtPct(isFinite(data.salarii) && isFinite(data.chelt) && data.chelt > 0 ? (data.salarii / data.chelt) * 100 : NaN), subtitle: "din cheltuieli totale" },
    { key: "pct_util", title: "Pondere utilități", value: fmtPct(isFinite(data.utilitati) && isFinite(data.chelt) && data.chelt > 0 ? (data.utilitati / data.chelt) * 100 : NaN), subtitle: "din cheltuieli totale" },
    { key: "pct_chirii", title: "Pondere chirii", value: fmtPct(isFinite(data.chirii) && isFinite(data.chelt) && data.chelt > 0 ? (data.chirii / data.chelt) * 100 : NaN), subtitle: "din cheltuieli totale" },
    { key: "prod", title: `Productivitate / ${lblAngajati}`, value: fmtRON(data.productivitate), subtitle: "CA / angajat" },
  ];
  return (
    <Section title={`${lblAngajati} – detaliu`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {cards.map(({ key, ...rest }) => <KpiCard key={key} {...rest} />)}
      </div>
    </Section>
  );
}

function ConformareDetailSection({ data, dbStats }: { data: any; dbStats: any }) {
  const cards: KpiModel[] = [
    { key: "cerinte", title: "Total cerințe evaluate", value: fmtNr(data?.cerinteTotal ?? dbStats.cerinte), subtitle: "din toate standardele" },
    { key: "conforme", title: "Cerințe conforme", value: fmtNr(data?.cerinteConforme ?? dbStats.cerinteConforme), subtitle: "îndeplinite" },
    { key: "nc", title: "Neconformități", value: fmtNr(data?.ncDeschise ?? dbStats.ncDeschise), subtitle: "deschise" },
    { key: "audituri", title: "Audituri planificate", value: fmtNr(data?.audituri ?? NaN), subtitle: "perioada curentă" },
  ];
  return (
    <Section title="Conformare – detaliu">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {cards.map(({ key, ...rest }) => <KpiCard key={key} {...rest} />)}
      </div>
    </Section>
  );
}

function PlDetailSection({ data }: { data: any }) {
  const total = data.chelt;
  const pct = (v: number) => (isFinite(v) && isFinite(total) && total > 0 ? fmtPct((v / total) * 100) : "–");
  const cards: KpiModel[] = [
    { key: "ca", title: "Cifră de afaceri", value: fmtRON(data.ca) },
    { key: "chelt", title: "Cheltuieli totale", value: fmtRON(data.chelt) },
    { key: "rez", title: "Rezultat operațional", value: fmtRON(data.rezultat), badge: (isFinite(data.rezultat) ? (data.rezultat >= 0 ? "ok" : "danger") : null) as Tone },
    { key: "marja", title: "Marjă profit", value: fmtPct(data.marja) },
    { key: "sal", title: "Salarii", value: `${fmtRON(data.salarii)} (${pct(data.salarii)})` },
    { key: "util", title: "Utilități", value: `${fmtRON(data.utilitati)} (${pct(data.utilitati)})` },
    { key: "chirii", title: "Chirii", value: `${fmtRON(data.chirii)} (${pct(data.chirii)})` },
    { key: "alte", title: "Alte cheltuieli", value: `${fmtRON(data.alteChelt)} (${pct(data.alteChelt)})` },
  ];
  return (
    <Section title="P&L – detaliu cheltuieli">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {cards.map(({ key, ...rest }) => <KpiCard key={key} {...rest} />)}
      </div>
    </Section>
  );
}

function FluxDetailSection({ data, thresholds, setThresholds }: { data: any; thresholds: Thresholds; setThresholds: React.Dispatch<React.SetStateAction<Thresholds>> }) {
  const [showAdmin, setShowAdmin] = React.useState(false);
  return (
    <Section title="Flux financiar – detaliu & praguri">
      <button onClick={() => setShowAdmin(s => !s)} style={{ marginBottom: 8, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,.12)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        {showAdmin ? "Ascunde praguri" : "Setează praguri"}
      </button>
      {showAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 12, border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 10, marginBottom: 12, background: '#fff' }}>
          {[
            { label: "Fluctuație warn %", val: thresholds.fluctuatiePct.warn, set: (v: number) => setThresholds(t => ({ ...t, fluctuatiePct: { ...t.fluctuatiePct, warn: v } })) },
            { label: "Fluctuație danger %", val: thresholds.fluctuatiePct.danger, set: (v: number) => setThresholds(t => ({ ...t, fluctuatiePct: { ...t.fluctuatiePct, danger: v } })) },
            { label: "Conformare ok %", val: thresholds.conformarePct.ok, set: (v: number) => setThresholds(t => ({ ...t, conformarePct: { ...t.conformarePct, ok: v } })) },
            { label: "Conformare warn %", val: thresholds.conformarePct.warn, set: (v: number) => setThresholds(t => ({ ...t, conformarePct: { ...t.conformarePct, warn: v } })) },
            { label: "Current Ratio ok ≥", val: thresholds.currentRatio.okGE, set: (v: number) => setThresholds(t => ({ ...t, currentRatio: { ...t.currentRatio, okGE: v } })) },
            { label: "DSO warn > zile", val: thresholds.dso.warnGT, set: (v: number) => setThresholds(t => ({ ...t, dso: { ...t.dso, warnGT: v } })) },
          ].map(({ label, val, set }) => (
            <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span style={{ opacity: 0.7 }}>{label}</span>
              <input type="number" value={val} onChange={e => set(parseFloat(e.target.value))} style={{ padding: "6px 8px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 700 }} step="0.1" />
            </label>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {[
          { key: "wc", title: "Working Capital", value: fmtRON(data.wcRON) },
          { key: "cr", title: "Current Ratio", value: isFinite(data.currRatio) ? data.currRatio.toFixed(2) : "–" },
          { key: "dso", title: "DSO", value: isFinite(data.dso) ? `${data.dso} zile` : "–" },
          { key: "dpo", title: "DPO", value: isFinite(data.dpo) ? `${data.dpo} zile` : "–" },
        ].map(({ key, ...rest }) => <KpiCard key={key} {...rest} />)}
      </div>
    </Section>
  );
}

// ----------------------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}><h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h2></div>
      {children}
    </section>
  );
}

function KpiCard({ title, value, subtitle, badge, hint, glossaryKey }: KpiModel & { glossaryKey?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(180deg, #fafafa, #fff)", gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {title}
          {glossaryKey && GLOSAR[glossaryKey] && (
            <span style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <span style={{ width: 16, height: 16, lineHeight: "16px", textAlign: "center", borderRadius: 999, fontSize: 11, fontWeight: 800, background: "rgba(37,99,235,.14)", color: "#1e40af", display: "inline-block", cursor: "default" }}>i</span>
              {open && <span style={{ position: "absolute", top: "120%", left: 0, zIndex: 30, maxWidth: 280, padding: "10px 12px", background: "#111827", color: "white", fontSize: 12, borderRadius: 10, boxShadow: "0 10px 20px rgba(0,0,0,.25)", whiteSpace: "normal" }}>{GLOSAR[glossaryKey]}</span>}
            </span>
          )}
        </span>
        {badge && <BadgeUI tone={badge} />}
      </div>
      <div style={{ padding: "8px 12px" }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
        {subtitle && <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>{subtitle}</div>}
      </div>
      {hint && <div style={{ padding: "8px 12px", fontSize: 11, opacity: 0.8, borderTop: "1px dashed rgba(0,0,0,0.06)" }}>{hint}</div>}
    </div>
  );
}

function BadgeUI({ tone }: { tone: NonNullable<Tone> }) {
  const map = {
    ok: { bg: "rgba(16,185,129,.14)", dot: "#10b981", text: "#065f46", label: "OK" },
    warn: { bg: "rgba(245,158,11,.14)", dot: "#f59e0b", text: "#7c2d12", label: "Atenție" },
    danger: { bg: "rgba(239,68,68,.14)", dot: "#ef4444", text: "#7f1d1d", label: "Risc" },
  } as const;
  const t = map[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 999, background: t.bg, color: t.text, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 8, height: 8, background: t.dot, borderRadius: 999 }} />
      {t.label}
    </span>
  );
}

type TabKey = "hr" | "conformare" | "pl" | "flux";

function TabNav({ active, onChange, orgType }: { active: TabKey; onChange: (t: TabKey) => void; orgType: string | null }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "hr", label: orgType === 'institutie_publica' ? "Funcționari" : "HR" },
    { key: "conformare", label: "Conformare ISO" },
    { key: "pl", label: "P&L detaliat" },
    { key: "flux", label: "Flux & Praguri" },
  ];
  return (
    <nav style={{ display: "flex", gap: 8 }}>
      {tabs.map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.12)", background: active === t.key ? "linear-gradient(180deg, #f0f7ff, #fff)" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", borderColor: active === t.key ? "rgba(45,125,246,0.35)" : undefined, boxShadow: active === t.key ? "0 1px 6px rgba(45,125,246,0.25)" : undefined }}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function SelectUI({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ appearance: "none", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "linear-gradient(180deg, #fff, #fafafa)", fontWeight: 600 }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function UploaderPanel({ onFiles, uploadedFiles, parsedTables, message }: { onFiles: (f: FileList | null) => void; uploadedFiles: File[]; parsedTables: ParsedTable[]; message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 8 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <input type="file" multiple accept=".csv" onChange={e => onFiles(e.target.files)} style={{ display: "none" }} />
        <span style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "linear-gradient(180deg, #f8fafc, #fff)", fontWeight: 700, fontSize: 12 }}>Încarcă CSV</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Date financiare, HR, conformare</span>
      </label>
      {message && <div style={{ fontSize: 12, color: "#7c2d12", background: "rgba(245,158,11,.14)", border: "1px solid rgba(245,158,11,.35)", padding: "6px 8px", borderRadius: 8 }}>{message}</div>}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 4, border: "1px dashed rgba(0,0,0,0.12)", borderRadius: 12, padding: 8, background: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Fișiere încărcate</div>
          {uploadedFiles.map(f => {
            const t = parsedTables.find(pt => pt.filename === f.name);
            return <div key={f.name} style={{ fontSize: 12, lineHeight: "20px" }}><strong>{f.name}</strong>{t?.rows.length ? ` • ${t.rows.length} rânduri` : " • neparsat"}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function MappingPanel({ tables, selectedFile, onSelectFile, mapping, onChangeMapping, orgType, lblAngajati }: {
  tables: ParsedTable[]; selectedFile: string | null; onSelectFile: (f: string | null) => void;
  mapping: Record<KpiFieldKey, string | null>; onChangeMapping: (f: KpiFieldKey, c: string | null) => void;
  orgType: string | null; lblAngajati: string;
}) {
  const active = tables.find(t => t.filename === selectedFile) ?? null;

  const groups: Array<{ title: string; fields: Array<{ key: KpiFieldKey; label: string }> }> = [
    {
      title: `${lblAngajati} & HR`,
      fields: [
        { key: "Angajati_activi", label: `${lblAngajati} activi` },
        { key: "Angajati_plecati", label: "Plecați / Demisii" },
        { key: "Zile_absenta", label: "Zile absență" },
        { key: "Zile_lucratoare", label: "Zile lucrătoare" },
      ],
    },
    {
      title: "Financiar",
      fields: [
        { key: "CA_RON", label: "Cifră afaceri (RON)" },
        { key: "Cheltuieli_RON", label: "Cheltuieli totale (RON)" },
        { key: "Salarii_RON", label: "Salarii (RON)" },
        { key: "Utilitati_RON", label: "Utilități (RON)" },
        { key: "Chirii_RON", label: "Chirii (RON)" },
        { key: "Alte_chelt_RON", label: "Alte cheltuieli (RON)" },
      ],
    },
    {
      title: "Lichiditate",
      fields: [
        { key: "Active_curente_RON", label: "Active circulante (RON)" },
        { key: "Furnizori_RON", label: "Furnizori (RON)" },
        { key: "Creante_clienti_RON", label: "Creanțe clienți (RON)" },
      ],
    },
    {
      title: "Conformare ISO",
      fields: [
        { key: "Cerinte_total", label: "Total cerințe" },
        { key: "Cerinte_conforme", label: "Cerințe conforme" },
        { key: "NC_deschise", label: "Neconformități deschise" },
        { key: "Audituri_planificate", label: "Audituri planificate" },
      ],
    },
    {
      title: "SSM/PSI",
      fields: [
        { key: "Incidente_SSM", label: "Incidente SSM" },
        { key: "Riscuri_deschise", label: "Riscuri deschise" },
        { key: "EIP_expirate", label: "EIP expirate" },
        { key: "Instruiri_scadente", label: "Instruiri scadente" },
      ],
    },
    {
      title: "Contracte",
      fields: [
        { key: "Contracte_active", label: "Contracte active" },
        { key: "Contracte_expirante", label: "Contracte expirante ≤60 zile" },
        { key: "Valoare_contracte_RON", label: "Valoare totală contracte (RON)" },
      ],
    },
  ];

  if (!tables.length) return null;

  return (
    <div style={{ marginTop: 10, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(180deg, #fafafa, #fff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>Mapare coloane → KPI</strong>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Asociază coloanele din CSV cu indicatorii</span>
        </div>
        <select value={selectedFile ?? ""} onChange={e => onSelectFile(e.target.value || null)} style={{ appearance: "none", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "linear-gradient(180deg, #fff, #fafafa)", fontWeight: 600, fontSize: 12 }}>
          <option value="">(Alege fișier)</option>
          {tables.map(t => <option key={t.filename} value={t.filename}>{t.filename}</option>)}
        </select>
      </div>
      {active && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, padding: 10 }}>
          {groups.map(g => (
            <div key={g.title} style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 10px", background: "#fafafa", fontWeight: 800, fontSize: 12 }}>{g.title}</div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {g.fields.map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 200, fontSize: 12, opacity: 0.8 }}>{f.label}</span>
                    <select style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "#fff" }} value={mapping[f.key] ?? ""} onChange={e => onChangeMapping(f.key, e.target.value || null)}>
                      <option value="">(neatribuit)</option>
                      {active.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  page: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  headerRight: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 800, margin: 0 },
  filters: { display: "flex", gap: 10, flexWrap: "wrap" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 },
  smallBtn: { padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" },
};