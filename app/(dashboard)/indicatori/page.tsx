// app/indicatori/page.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { Line, Bar, Radar } from "react-chartjs-2";
import KpiUploader from "@/components/KpiUploader";
import { useIndicatoriStore } from "@/store/indicatori";
import { useIndicatoriUi, type Period, type ChartKind } from "@/store/indicatoriUi";

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    Filler,
    Tooltip,
    Legend
);

/* ==================== TIPURI ==================== */
type KPI = {
    key: string;
    label: string;
    category: string;
    unit?: string;
    isPct?: boolean;
    derived?: boolean;
};

type Threshold =
    | { type: "higher"; green: number; yellow: number }
    | { type: "lower"; green: number; yellow: number }
    | { type: "band"; greenMin: number; greenMax: number; yellowMin: number; yellowMax: number };

/* ==================== KPI DEFINITIONS (inclusiv 3E) ==================== */
const ALL_KPIS: KPI[] = [
    // Venituri
    { key: "venituri_totale", label: "Venituri totale", category: "Venituri", unit: "Lei" },
    { key: "venituri_cnas_pct", label: "% venituri CNAS", category: "Venituri", isPct: true },
    { key: "venituri_private", label: "Venituri servicii private", category: "Venituri", unit: "Lei" },
    { key: "subventii", label: "Subvenții/transferuri", category: "Venituri", unit: "Lei" },
    { key: "venituri_granturi", label: "Venituri granturi", category: "Venituri", unit: "Lei" },

    // Cheltuieli
    { key: "cheltuieli_totale", label: "Cheltuieli totale", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_personal_pct", label: "% cheltuieli personal", category: "Cheltuieli", isPct: true },
    { key: "cheltuieli_personal_abs", label: "Cheltuieli personal (abs.)", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_medicamente", label: "Medicamente", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_materiale", label: "Materiale sanitare", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_utilitati", label: "Utilități", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_energie", label: "Energie (abs.)", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_echip_ment", label: "Echipamente + mentenanță", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_admin_it", label: "Administrative și IT", category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_directe", label: "Cheltuieli cu valoare adăugată", category: "Cheltuieli", unit: "Lei" },

    // Eficiență existentă
    { key: "cost_pacient", label: "Cost mediu/pacient", category: "Eficiență", unit: "Lei" },
    { key: "cost_caz_drg", label: "Cost mediu/caz DRG", category: "Eficiență", unit: "Lei" },
    { key: "cost_zi_spitalizare", label: "Cost/zi spitalizare (derivat)", category: "Eficiență", unit: "Lei", derived: true },
    { key: "venit_pacient", label: "Venit mediu/pacient", category: "Eficiență", unit: "Lei" },
    { key: "rap_admin_medical", label: "Chelt. admin / medicale", category: "Eficiență" },

    // Lichiditate / Îndatorare
    { key: "lichiditate_curenta", label: "Lichiditate curentă", category: "Lichiditate / Îndatorare" },
    { key: "grad_indatorare", label: "Grad de îndatorare", category: "Lichiditate / Îndatorare" },
    { key: "zile_incasare", label: "Zile medii încasare (DSO)", category: "Lichiditate / Îndatorare", derived: true },
    { key: "zile_plata", label: "Zile medii plată (DPO)", category: "Lichiditate / Îndatorare", derived: true },
    { key: "ccc", label: "Cash Conversion Cycle (CCC)", category: "Lichiditate / Îndatorare", derived: true },
    { key: "autonomie_fin", label: "Autonomie financiară", category: "Lichiditate / Îndatorare" },

    // Rezultat / Cashflow
    { key: "rezultat_operational", label: "Rezultat operațional", category: "Rezultat / Cashflow", unit: "Lei" },
    { key: "marja_operationala", label: "Marjă operațională", category: "Rezultat / Cashflow" },
    { key: "rezultat_net", label: "Rezultat net", category: "Rezultat / Cashflow", unit: "Lei" },
    { key: "cashflow_operational", label: "Cashflow operațional", category: "Rezultat / Cashflow", unit: "Lei" },

    // Clinic-financiar
    { key: "ocupare_paturi_pct", label: "Rata ocupare paturi %", category: "Clinic-financiar", isPct: true },
    { key: "icm", label: "Indice complexitate (ICM)", category: "Clinic-financiar" },
    { key: "cazuri_decontate", label: "Cazuri decontate", category: "Clinic-financiar" },
    { key: "valoare_medie_caz", label: "Valoare medie/caz", category: "Clinic-financiar", unit: "Lei" },
    { key: "zile_spitalizare", label: "Zile de spitalizare (output)", category: "Clinic-financiar" },
    { key: "pat_zile", label: "Pat-zile (output)", category: "Clinic-financiar" },

    /* -------- 3E – ECONOMICITATE -------- */
    { key: "dpo", label: "DPO (Zile medii plată)", category: "3E – Economicitate", derived: true },
    { key: "discount_capturat_pct", label: "Discount capturat (%)", category: "3E – Economicitate", isPct: true, derived: true },
    { key: "abatere_exec_buget_pct", label: "Abatere execuție vs buget (%)", category: "3E – Economicitate", isPct: true, derived: true },

    /* -------- 3E – EFICIENȚĂ -------- */
    { key: "zile_stoc", label: "Rotația stocurilor (zile)", category: "3E – Eficiență", derived: true },
    { key: "cost_energie_pat_zi", label: "Cost energie / pat-zi", category: "3E – Eficiență", unit: "Lei", derived: true },
    { key: "utilizare_active", label: "Utilizare active (Venituri/Active)", category: "3E – Eficiență", derived: true },

    /* -------- 3E – EFICACITATE -------- */
    { key: "incasare_vs_contract_cas_pct", label: "Încăsare vs contract CAS (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "rezultat_operational_vs_buget_pct", label: "Rezultat operațional vs buget (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "pondere_valoare_adaugata_pct", label: "Chelt. cu valoare adăugată / total (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "economii_improvement", label: "Economii din proiecte de îmbunătățire", category: "3E – Eficacitate", unit: "Lei" },
    { key: "cost_neconformitate_pct", label: "Cost de neconformitate / venituri (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "penalitati_pct", label: "Penalități / venituri (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "roi_proiecte_pct", label: "ROI proiecte (%)", category: "3E – Eficacitate", isPct: true, derived: true },
];

/* ==================== PRAGURI (Semafor) ==================== */
const THRESHOLDS: Record<string, Threshold> = {
    zile_incasare: { type: "lower", green: 30, yellow: 45 },
    zile_plata: { type: "band", greenMin: 30, greenMax: 45, yellowMin: 20, yellowMax: 60 },
    dpo: { type: "band", greenMin: 30, greenMax: 45, yellowMin: 20, yellowMax: 60 },
    ccc: { type: "lower", green: 30, yellow: 45 },
    zile_stoc: { type: "lower", green: 30, yellow: 45 },
    cost_energie_pat_zi: { type: "lower", green: 20, yellow: 30 },
    cost_zi_spitalizare: { type: "lower", green: 900, yellow: 1100 },
    incasare_vs_contract_cas_pct: { type: "higher", green: 98, yellow: 95 },
    rezultat_operational_vs_buget_pct: { type: "higher", green: 100, yellow: 95 },
    pondere_valoare_adaugata_pct: { type: "higher", green: 60, yellow: 50 },
    cost_neconformitate_pct: { type: "lower", green: 0.5, yellow: 1.0 },
    penalitati_pct: { type: "lower", green: 0.1, yellow: 0.5 },
    discount_capturat_pct: { type: "higher", green: 80, yellow: 50 },
    roi_proiecte_pct: { type: "higher", green: 20, yellow: 10 },
    utilizare_active: { type: "higher", green: 1.5, yellow: 1.0 },
    abatere_exec_buget_pct: { type: "lower", green: 2, yellow: 5 },
};

/* ==================== UTILITARE ==================== */
const monthsLabels = (): string[] => ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];
const quartersLabels = (): string[] => ["T1", "T2", "T3", "T4"];
const yearsLabels = (start = 2023, n = 3): string[] => Array.from({ length: n }, (_, i) => String(start + i));

function hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
}
function genSeries(key: string, len = 12): number[] {
    const base = Math.abs(hashCode(key)) % 1000;
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
        const noise = ((hashCode(key + ":" + i) % 200) - 100) / 100;
        const trend = i * ((base % 7) - 3) * 0.02;
        let v = base * 100 + trend * base + noise * base;
        if (key.includes("_pct")) v = 30 + ((base % 50) * 0.01) * 60 + noise * 5;
        if (key.includes("lichiditate")) v = 0.8 + ((base % 30) * 0.01) * 1.2 + noise * 0.2;
        if (key.includes("grad_indatorare")) v = 0.2 + ((base % 50) * 0.01) * 1.2 + noise * 0.2;
        if (key.includes("zile_")) v = 20 + (base % 60) + noise * 5;
        if (key.includes("icm")) v = 0.7 + ((base % 80) * 0.01) * 1.5 + noise * 0.15;
        if (key.includes("cazuri_decontate")) v = 500 + (base % 1500) + noise * 100;
        if (key.includes("valoare_medie_caz")) v = 1500 + (base % 1500) + noise * 200;
        if (key.includes("cost_") || key.includes("venit_")) v = 1000 + (base % 3000) + noise * 300;
        if (key.includes("rezultat_") || key.includes("cashflow")) v = -200000 + (base % 800000) + noise * 50000;
        if (key.includes("cheltuieli_") || ["venituri_totale", "subventii", "venituri_private", "venituri_granturi"].includes(key))
            v = 1_000_000 + (base % 5_000_000) + noise * 200_000;
        if (key.includes("ocupare_paturi")) v = 55 + (base % 35) + noise * 5;
        if (key.includes("marja_operationala")) v = 5 + (base % 15) + noise * 3;
        if (key === "zile_stoc" || key === "dpo" || key === "zile_incasare" || key === "zile_plata" || key === "ccc")
            v = 20 + (base % 40) + noise * 5;
        arr.push(Number(v.toFixed(2)));
    }
    return arr;
}
const avg = (arr: number[]) => Number((arr.reduce((a, b) => a + b, 0) / (arr.length || 1)).toFixed(2));
const toQuarterly = (arr: number[]) => [0, 3, 6, 9].map((i) => avg(arr.slice(i, i + 3)));
const toYearly = (arr: number[]) => [avg(arr.slice(0, 12))];

const EPS = 1e-6;
const safeDiv = (a: number, b: number) => (Math.abs(b) < EPS ? 0 : a / b);

/* ==================== CALCULE DERIVATE (3E & co.) ==================== */
type SeriesMap = Record<string, number[] | undefined>;
const computeDerived: Record<string, (get: (k: string) => number[] | undefined) => number[] | undefined> = {
    zile_incasare: (get) => {
        const crean = get("creante");
        const venit = get("venituri_totale");
        if (!crean || !venit) return undefined;
        return crean.map((c, i) => Number((safeDiv(c, safeDiv(venit[i], 30))).toFixed(2)));
    },
    zile_plata: (get) => {
        const datorii = get("datorii_comerciale");
        const achiz = get("achizitii") ?? get("cheltuieli_totale");
        if (!datorii || !achiz) return undefined;
        return datorii.map((d, i) => Number((safeDiv(d, safeDiv(achiz[i], 30))).toFixed(2)));
    },
    dpo: (get) => computeDerived["zile_plata"](get),
    zile_stoc: (get) => {
        const stoc = get("stoc_mediu");
        const consum = get("consum_lunar");
        if (!stoc || !consum) return undefined;
        return stoc.map((s, i) => Number((safeDiv(s, safeDiv(consum[i], 30))).toFixed(2)));
    },
    ccc: (get) => {
        const dso = computeDerived["zile_incasare"](get);
        const zs = computeDerived["zile_stoc"](get);
        const dpo = computeDerived["zile_plata"](get);
        if (!dso || !zs || !dpo) return undefined;
        return dso.map((v, i) => Number((v + zs[i] - dpo[i]).toFixed(2)));
    },
    cost_zi_spitalizare: (get) => {
        const che = get("cheltuieli_totale");
        const zile = get("zile_spitalizare");
        if (!che || !zile) return undefined;
        return che.map((c, i) => Number((safeDiv(c, Math.max(zile[i], EPS))).toFixed(2)));
    },
    cost_energie_pat_zi: (get) => {
        const en = get("cheltuieli_energie");
        const patz = get("pat_zile");
        if (!en || !patz) return undefined;
        return en.map((e, i) => Number((safeDiv(e, Math.max(patz[i], EPS))).toFixed(2)));
    },
    utilizare_active: (get) => {
        const ven = get("venituri_totale");
        const act = get("active_nete");
        if (!ven || !act) return undefined;
        return ven.map((v, i) => Number((safeDiv(v, Math.max(act[i], EPS))).toFixed(2)));
    },
    incasare_vs_contract_cas_pct: (get) => {
        const inc = get("incasat_cas");
        const con = get("contract_cas");
        if (!inc || !con) return undefined;
        return inc.map((x, i) => Number((safeDiv(x, Math.max(con[i], EPS)) * 100).toFixed(2)));
    },
    rezultat_operational_vs_buget_pct: (get) => {
        const rez = get("rezultat_operational");
        const buget = get("buget_rezultat_operational");
        if (!rez || !buget) return undefined;
        return rez.map((x, i) => Number((safeDiv(x, Math.max(buget[i], EPS)) * 100).toFixed(2)));
    },
    pondere_valoare_adaugata_pct: (get) => {
        const cd = get("cheltuieli_directe");
        const ct = get("cheltuieli_totale");
        if (!cd || !ct) return undefined;
        return cd.map((x, i) => Number((safeDiv(x, Math.max(ct[i], EPS)) * 100).toFixed(2)));
    },
    cost_neconformitate_pct: (get) => {
        const cnc = get("cost_neconformitati");
        const ven = get("venituri_totale");
        if (!cnc || !ven) return undefined;
        return cnc.map((x, i) => Number((safeDiv(x, Math.max(ven[i], EPS)) * 100).toFixed(2)));
    },
    penalitati_pct: (get) => {
        const pen = get("penalitati");
        const ven = get("venituri_totale");
        if (!pen || !ven) return undefined;
        return pen.map((x, i) => Number((safeDiv(x, Math.max(ven[i], EPS)) * 100).toFixed(2)));
    },
    roi_proiecte_pct: (get) => {
        const ben = get("beneficii_nete_anuale");
        const inv = get("investitie_capex");
        if (!ben || !inv) return undefined;
        return ben.map((x, i) => Number((safeDiv(x, Math.max(inv[i], EPS)) * 100).toFixed(2)));
    },
    discount_capturat_pct: (get) => {
        const ob = get("discounturi_obtinute");
        const po = get("discounturi_posibile");
        if (!ob || !po) return undefined;
        return ob.map((x, i) => Number((safeDiv(x, Math.max(po[i], EPS)) * 100).toFixed(2)));
    },
    abatere_exec_buget_pct: (get) => {
        const exec = get("cheltuieli_totale");
        const buget = get("buget_cheltuieli_totale");
        if (!exec || !buget) return undefined;
        return exec.map((x, i) => Number((safeDiv(Math.abs(x - buget[i]), Math.max(buget[i], EPS)) * 100).toFixed(2)));
    },
};

/* ==================== CULORI ==================== */
const PALETTE = ["#6366F1", "#22C55E", "#EF4444", "#F59E0B", "#06B6D4", "#EC4899", "#8B5CF6", "#10B981", "#F97316", "#84CC16"];
const withAlpha = (hex: string, a = 1) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};
type ChartArea = { top: number; bottom: number; left: number; right: number; width: number; height: number };
function vGradient(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, withAlpha(color, 0.35));
    g.addColorStop(1, withAlpha(color, 0.06));
    return g;
}
function vGradientStrong(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, withAlpha(color, 0.9));
    g.addColorStop(1, withAlpha(color, 0.35));
    return g;
}
function radialGradient(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const cx = area.left + area.width / 2;
    const cy = area.top + area.height / 2;
    const r = Math.max(area.width, area.height) / 1.8;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, withAlpha(color, 0.32));
    g.addColorStop(1, withAlpha(color, 0.08));
    return g;
}

/* ==================== EVAL PRAG + BADGE ==================== */
type Traffic = "green" | "yellow" | "red" | "na";
function evalThreshold(key: string, value: number | undefined): Traffic {
    if (value === undefined || Number.isNaN(value)) return "na";
    const t = THRESHOLDS[key];
    if (!t) return "na";
    if (t.type === "higher") return value >= t.green ? "green" : value >= t.yellow ? "yellow" : "red";
    if (t.type === "lower") return value <= t.green ? "green" : value <= t.yellow ? "yellow" : "red";
    const inGreen = value >= t.greenMin && value <= t.greenMax;
    const inYellow = value >= t.yellowMin && value <= t.yellowMax && !inGreen;
    return inGreen ? "green" : inYellow ? "yellow" : "red";
}
const badgeStyle = (t: Traffic): React.CSSProperties => {
    const map: Record<Traffic, { bg: string; fg: string; bd: string }> = {
        green: { bg: "#DCFCE7", fg: "#166534", bd: "#22C55E" },
        yellow: { bg: "#FEF9C3", fg: "#854D0E", bd: "#EAB308" },
        red: { bg: "#FEE2E2", fg: "#991B1B", bd: "#EF4444" },
        na: { bg: "#E5E7EB", fg: "#374151", bd: "#9CA3AF" },
    };
    const c = map[t];
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, border: `1px solid ${c.bd}`, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" };
};

/* ==================== PAGINA ==================== */
export default function Indicatori() {
    const series = (useIndicatoriStore((s) => s.series) ?? {}) as Record<string, { values: number[] } | undefined>;
    const getMonthlyRaw = (key: string): number[] | undefined => {
        const vals = series?.[key]?.values;
        if (Array.isArray(vals) && vals.length === 12) return vals;
        return undefined;
    };

    // --- NEW: detectăm ani disponibili din chei (ex. "venituri_totale__2022", "venituri_totale_2023")
    const allYears = useMemo(() => {
        const years = new Set<number>();
        Object.keys(series ?? {}).forEach((k) => {
            const m = k.match(/(?:__|_|^)(20\d{2}|19\d{2})$/); // suportă ...__2024 sau ..._2024 sau "2024"
            if (m) years.add(Number(m[1]));
        });
        return Array.from(years).sort((a, b) => a - b);
    }, [series]);

    // selecție interval ani (neatribuit = null)
    const [yearFrom, setYearFrom] = useState<number | null>(null);
    const [yearTo, setYearTo] = useState<number | null>(null);

    // caută seria lunară pentru un KPI într-un anumit an (dacă există)
    const getMonthlyForYear = (key: string, year: number): number[] | undefined => {
        const patterns = [`${key}__${year}`, `${key}_${year}`, `${year}_${key}`, `${key}${year}`];
        for (const p of patterns) {
            const v = getMonthlyRaw(p);
            if (v) return v;
        }
        return undefined;
    };

    // UI persistente
    const category = useIndicatoriUi((s) => s.category);
    const selected = useIndicatoriUi((s) => s.selected);
    const period = useIndicatoriUi((s) => s.period);
    const chartKind = useIndicatoriUi((s) => s.chartKind);
    const setCategory = useIndicatoriUi((s) => s.setCategory);
    const setSelected = useIndicatoriUi((s) => s.setSelected);
    const setPeriod = useIndicatoriUi((s) => s.setPeriod);
    const setChartKind = useIndicatoriUi((s) => s.setChartKind);

    const DEFAULT_H = 260;
    const [hLine, setHLine] = useState<number>(DEFAULT_H);
    const [hBar, setHBar] = useState<number>(DEFAULT_H);
    const [hRadar, setHRadar] = useState<number>(DEFAULT_H);
    useEffect(() => { setHLine(DEFAULT_H); setHBar(DEFAULT_H); setHRadar(DEFAULT_H); }, []);

    const categories = useMemo(() => Array.from(new Set(ALL_KPIS.map((k) => k.category))), []);
    const visibleKpis = useMemo(() => ALL_KPIS.filter((k) => k.category === category), [category]);

    // labels (dinamic pentru ANUAL dacă alegi ani; pentru restul – neschimbat)
    const labels = useMemo(() => {
        if (period === "lunar") return monthsLabels();
        if (period === "trimestrial") return quartersLabels();
        // anual
        const selectedYears = allYears.length ? allYears.filter(y => (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo)) : [];
        if (selectedYears.length) return selectedYears.map(String);
        return yearsLabels(2023, 3);
    }, [period, allYears, yearFrom, yearTo]);

    // generare dataset pentru un KPI (respectă calc. derivate + suport ani selectați pe "anual")
    const getSeriesForKey = (key: string): number[] => {
        const def = ALL_KPIS.find((k) => k.key === key);
        let monthlyBase: number[] | undefined;

        // 1) derived?
        if (def?.derived && computeDerived[key]) {
            monthlyBase = computeDerived[key]((kk) => getMonthlyRaw(kk));
        }
        // 2) fallback: seria lunară "de bază"
        if (!monthlyBase) {
            monthlyBase = getMonthlyRaw(key);
        }
        // 3) dacă nu există nimic -> demo
        if (!monthlyBase) {
            monthlyBase = genSeries(key, 12);
        }

        if (period === "lunar") return monthlyBase;
        if (period === "trimestrial") return toQuarterly(monthlyBase);

        // ANUAL: dacă ai ani în store și utilizatorul a ales interval → agregăm per an din seriile "key__YYYY"
        const selectedYears = allYears.filter(y => (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo));
        if (selectedYears.length) {
            const valsPerYear = selectedYears.map((y) => {
                const m = getMonthlyForYear(key, y) ?? monthlyBase; // fallback la seria de bază dacă nu există varianta pe an
                return avg(m);
            });
            return valsPerYear;
        }

        // fallback – comportamentul vechi (o singură valoare/an)
        return toYearly(monthlyBase);
    };

    const datasets = useMemo(
        () =>
            selected.map((key, idx) => {
                const color = PALETTE[idx % PALETTE.length];
                const data = getSeriesForKey(key);
                const kpi = ALL_KPIS.find((k) => k.key === key);
                return {
                    label: kpi?.label ?? key,
                    data,
                    tension: 0.35,
                    borderWidth: 2,
                    borderColor: color,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: color,
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: "#fff",
                    backgroundColor: (ctx: any) => {
                        const chart = ctx.chart;
                        const area = chart?.chartArea as any;
                        const c2d = chart?.ctx as CanvasRenderingContext2D | undefined;
                        if (!area || !c2d) return withAlpha(color, chart.config.type === "bar" ? 0.6 : 0.18);
                        if (chart.config.type === "radar") return radialGradient(c2d, area, color);
                        if (chart.config.type === "bar") return vGradientStrong(c2d, area, color);
                        return vGradient(c2d, area, color);
                    },
                    fill: chartKind === "area" ? "origin" : false,
                };
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selected, period, chartKind, series, yearFrom, yearTo, allYears]
    );

    const dataCombined = useMemo(() => ({ labels, datasets }), [labels, datasets]);

    const optionsLine: any = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "top" } },
        scales: { x: { grid: { color: "rgba(0,0,0,0.08)" } }, y: { grid: { color: "rgba(0,0,0,0.08)" } } },
    }), []);
    const optionsBar: any = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
            x: { stacked: chartKind === "stacked", grid: { color: "rgba(0,0,0,0.08)" } },
            y: { stacked: chartKind === "stacked", grid: { color: "rgba(0,0,0,0.08)" } },
        },
    }), [chartKind]);
    const optionsRadar: any = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" } },
        elements: { line: { borderWidth: 2 } },
        scales: { r: { angleLines: { color: "rgba(0,0,0,0.08)" }, grid: { color: "rgba(0,0,0,0.08)" }, ticks: { showLabelBackdrop: false } } },
    }), []);

    useEffect(() => {
        const still = selected.filter((k) => visibleKpis.some((v) => v.key === k));
        if (still.length === 0 && visibleKpis[0]) setSelected([visibleKpis[0].key]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const currentValue = (key: string): number | undefined => {
        const arr = getSeriesForKey(key);
        return arr?.[arr.length - 1];
    };

    return (
        <div className="content" style={{ padding: 16 }}>
            <h1 className="h1" style={{ marginBottom: 12 }}>Indicatori financiari</h1>

            {/* Filtre */}
            <div className="card" style={{ padding: 12, marginBottom: 12, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label>
                        <b>Categorie:</b>&nbsp;
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {[...new Set(ALL_KPIS.map(k=>k.category))].map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                    </label>

                    <label>
                        <b>Perioadă:</b>&nbsp;
                        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                            <option value="lunar">Lunar</option>
                            <option value="trimestrial">Trimestrial</option>
                            <option value="anual">Anual</option>
                        </select>
                    </label>

                    <label>
                        <b>Tip grafic:</b>&nbsp;
                        <select value={chartKind} onChange={(e) => setChartKind(e.target.value as ChartKind)}>
                            <option value="line">Line</option>
                            <option value="area">Area (cu gradient)</option>
                            <option value="bar">Bar</option>
                            <option value="stacked">Stacked Bars</option>
                        </select>
                    </label>

                    {/* === NEW: Filtru ani (neatribuit -> toți anii) disponibil pe oricare perioadă; activ pe "anual" === */}
                    <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
                        <b>Ani:</b>
                        <select value={yearFrom ?? ""} onChange={(e)=>setYearFrom(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">(neatribuit)</option>
                            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span style={{ color: "#9CA3AF" }}>—</span>
                        <select value={yearTo ?? ""} onChange={(e)=>setYearTo(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">(toți)</option>
                            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {(!yearFrom && !yearTo) && <span style={{ fontSize: 12, color: "#6b7280" }}>(toți anii)</span>}
                    </div>
                </div>

                {/* Selectoare KPI cu mini-badge semafor */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                    {visibleKpis.map((k) => {
                        const val = currentValue(k.key);
                        const traffic = evalThreshold(k.key, val);
                        return (
                            <label key={k.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(k.key)}
                                    onChange={() =>
                                        setSelected(selected.includes(k.key) ? selected.filter((kk) => kk !== k.key) : [...selected, k.key])
                                    }
                                />
                                <span>{k.label}</span>
                                <span style={badgeStyle(traffic)}>
                                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: traffic === "green" ? "#16A34A" : traffic === "yellow" ? "#CA8A04" : traffic === "red" ? "#DC2626" : "#6B7280", }} />
                                    {val !== undefined ? (k.isPct ? `${val.toFixed(2)}%` : k.unit ? `${val.toLocaleString("ro-RO")} ${k.unit}` : val.toLocaleString("ro-RO")) : "n/a"}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Rezumat */}
            {selected.length > 0 && (
                <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Rezumat valori curente</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                        {selected.map((key) => {
                            const def = ALL_KPIS.find((k) => k.key === key)!;
                            const val = currentValue(key);
                            const t = evalThreshold(key, val);
                            return (
                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ minWidth: 24, height: 8, borderRadius: 4, background: t === "green" ? "#16A34A" : t === "yellow" ? "#CA8A04" : t === "red" ? "#DC2626" : "#9CA3AF" }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: "#111827" }}>{def.label}</div>
                                        <div style={{ fontWeight: 700 }}>
                                            {val !== undefined ? (def.isPct ? `${val.toFixed(2)}%` : def.unit ? `${val.toLocaleString("ro-RO")} ${def.unit}` : val.toLocaleString("ro-RO")) : "n/a"}
                                        </div>
                                    </div>
                                    <span style={badgeStyle(t)}>{t.toUpperCase()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Uploader – neschimbat */}
            <KpiUploader
                kpis={[
                    { key: "venituri_totale", label: "Venituri totale" },
                    { key: "cheltuieli_totale", label: "Cheltuieli totale" },
                    { key: "lichiditate_curenta", label: "Lichiditate curentă" },
                    { key: "grad_indatorare", label: "Grad de îndatorare" },
                    { key: "rezultat_operational", label: "Rezultat operațional" },
                    { key: "zile_spitalizare", label: "Zile spitalizare" },
                    { key: "pat_zile", label: "Pat-zile" },
                    { key: "cazuri_decontate", label: "Cazuri decontate" },
                    { key: "creante", label: "Creanțe" },
                    { key: "datorii_comerciale", label: "Datorii comerciale" },
                    { key: "achizitii", label: "Achiziții (consum/cumpărări)" },
                    { key: "stoc_mediu", label: "Stoc mediu" },
                    { key: "consum_lunar", label: "Consum lunar" },
                    { key: "cheltuieli_energie", label: "Cheltuieli energie" },
                    { key: "active_nete", label: "Active nete" },
                    { key: "incasat_cas", label: "Încasat CAS" },
                    { key: "contract_cas", label: "Contract CAS" },
                    { key: "cheltuieli_directe", label: "Cheltuieli cu valoare adăugată" },
                    { key: "cost_neconformitati", label: "Costuri neconformități" },
                    { key: "penalitati", label: "Penalități" },
                    { key: "beneficii_nete_anuale", label: "Beneficii nete anuale (proiecte)" },
                    { key: "investitie_capex", label: "Investiție CapEx (proiecte)" },
                    { key: "discounturi_obtinute", label: "Discounturi obținute" },
                    { key: "discounturi_posibile", label: "Discounturi posibile" },
                    { key: "buget_cheltuieli_totale", label: "Buget cheltuieli totale" },
                    { key: "buget_rezultat_operational", label: "Buget rezultat operațional" },
                ]}
            />

            {/* ===== GRAFICE ===== */}
            <div
                className="card"
                onDoubleClick={() => setHLine(260)}
                style={{ padding: 12, height: hLine, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", marginTop: 12, marginBottom: 12, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                title="Dublu-click pentru reset dimensiune"
            >
                <div style={{ fontWeight: 600, marginBottom: 8, alignSelf: "flex-start" }}>Evoluție</div>
                <div style={{ flex: 1, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Line data={dataCombined as any} options={optionsLine} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap", width: "100%" }}>
                <div
                    className="card"
                    onDoubleClick={() => setHBar(260)}
                    style={{ padding: 12, height: hBar, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", flex: "1 1 520px", minWidth: 420, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                    title="Dublu-click pentru reset dimensiune"
                >
                    <div style={{ fontWeight: 600, marginBottom: 8, alignSelf: "flex-start" }}>Comparativ (Bar)</div>
                    <div style={{ flex: 1, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Bar data={dataCombined as any} options={optionsBar} />
                    </div>
                </div>

                <div
                    className="card"
                    onDoubleClick={() => setHRadar(260)}
                    style={{ padding: 12, height: hRadar, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", flex: "1 1 520px", minWidth: 420, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                    title="Dublu-click pentru reset dimensiune"
                >
                    <div style={{ fontWeight: 600, marginBottom: 8, alignSelf: "flex-start" }}>Profil (Radar)</div>
                    <div style={{ flex: 1, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {period === "lunar" ? (
                            <Radar data={dataCombined as any} options={optionsRadar} />
                        ) : (
                            <div className="text-sm" style={{ color: "#6b7280" }}>
                                Radar-ul arată cel mai bine pe 12 axe (luni). Selectează perioada <b>„lunar”</b>.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
