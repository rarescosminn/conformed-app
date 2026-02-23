// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { useMemo, useState, useEffect, useRef } from "react";

/** ============================================================
 *  Glosar / Metodologie (pentru tooltip)
 *  ============================================================ */
const GLOSAR: Record<string, string> = {
    "NrCE / NrCEV":
        "NrCE = Număr cazuri externate; NrCEV = Număr cazuri externate validate. %Validare = NrCEV / NrCE.",
    ICM:
        "Indicele Case Mix: exprimă complexitatea medie a cazurilor externate (ponderat DRG).",
    "DMS (Durată medie)":
        "Durata medie de spitalizare: zile spitalizare / caz externat.",
    "GrOP% (ocupare paturi)":
        "Grad ocupare paturi = (Zile paturi ocupate / Zile paturi disponibile) × 100.",
    "% DRG chirurgical":
        "Pondere cazuri DRG chirurgicale în total cazuri externate (acuți).",
    "Rata decontării":
        "Raport dintre realizat, facturat și contractat (CJAS). Alertă la sume sub contract.",
    "Pondere salarii %":
        "Cheltuieli cu personalul / Cheltuieli totale (operațional).",
    "% cazuri invalidate":
        "Procent din cazurile externate care nu au fost validate la raportarea DRG.",
    "Contribuție operațională totală":
        "Rezultatul operațional agregat (după cheltuieli directe și indirecte).",
    "Active circulante vs. Furnizori":
        "Indicator de lichiditate: dacă furnizori > active curente → presiune pe cash.",
    "Scorecard Secții":
        "Mini-KPI pe secție: NrCE, ICM, DMS, GrOP, Contribuție, cu link la taskuri corective.",
    DSS:
        "Durată de spitalizare standardizată: raport vs medie, corelat cu patologie și complexitate.",
    OH:
        "Overhead (cheltuieli nerepartizabile): administrație, contabilitate, întreținere, pază etc.",
    "UPU – cost mediu pe caz":
        "Costul mediu al unui caz UPU/CPU. Util pentru comparație (benchmark) și control costuri.",
    "Structură cheltuieli UPU":
        "Pondere cheltuieli UPU pentru pacienții ne-internați: salarii, medicamente, materiale, altele.",
    "Structură venituri și cheltuieli (P&L)":
        "Sumar operațional: venituri (CJAS, alte surse) și cheltuieli (salarii, medicamente, materiale, utilități, telecom, piese de schimb, alte cheltuieli).",
    "Alte cheltuieli – detaliu":
        "Detalii tipice: combustibil, chirii, deplasări, malpraxis; restul se reflectă în „Rest alte cheltuieli”.",
};

/** ============================================================
 *  Praguri și ținte — CONFIG LOCAL (mutăm ulterior în Admin)
 *  ============================================================ */
type Tone = "ok" | "warn" | "danger" | null;

const thresholdsConfig = {
    validareMinPct: 97,
    icm: { minAccept: 1.0 },
    dms: { warnOverNatPct: 20, dangerOverNatPct: 40 },
    grop: { okMin: 75, okMax: 90, warnHigh: 95 },
    drgChir: { bench: 38 },
    rataDecontarii: { minPct: 90 },
    salariiPct: { warn: 58, danger: 65 },
    invalidatePct: { warn: 2.0, danger: 5.0 },
    lichiditate: { requireActiveGEFurnizori: true },
    upuCostBenchMax: 500, // RON/caz – exemplu pentru badge; îl vom face configurabil
} as const;

type Thresholds = {
    // Working Capital / current ratio
    currentRatio: { okGE: number; warnLT: number; dangerLT: number };
    // DSO/DPO praguri informative
    dso: { warnGT: number; dangerGT: number };
    dpo: { warnGT: number; dangerGT: number };
};

const DEFAULT_THRESHOLDS: Thresholds = {
    currentRatio: { okGE: 1.0, warnLT: 1.0, dangerLT: 0.9 },   // ok dacă ≥1.0; <1.0 galben; <0.9 roșu
    dso: { warnGT: 60, dangerGT: 90 },                         // >60 zile galben, >90 roșu
    dpo: { warnGT: 75, dangerGT: 100 },                        // >75 zile galben, >100 roșu
};

/** ===========================
 *  Uploader: tipuri + utilitare CSV/XLSX
 *  =========================== */
type ParsedTable = {
    filename: string;
    rows: Record<string, string | number>[];
    columns: string[];
};

function parseCSV(text: string): ParsedTable {
    const raw = text.replace(/\r\n/g, "\n").trim();
    const delimiter = raw.includes(";") && !raw.includes(",") ? ";" : ",";
    const lines = raw.split("\n").filter(Boolean);
    if (lines.length === 0) return { filename: "", rows: [], columns: [] };

    const header = splitCSVLine(lines[0], delimiter);
    const columns = header.map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cells = splitCSVLine(lines[i], delimiter);
        const row: Record<string, string> = {};
        for (let c = 0; c < columns.length; c++) {
            row[columns[c]] = (cells[c] ?? "").trim();
        }
        rows.push(row);
    }
    return { filename: "", rows, columns };
}

function splitCSVLine(line: string, delimiter: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            out.push(cur);
            cur = "";
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out;
}

/** ===========================
 *  Helpers evaluare praguri
 *  =========================== */
function toneValidare(validPct: number): Tone {
    if (validPct >= thresholdsConfig.validareMinPct) return "ok";
    if (validPct >= thresholdsConfig.validareMinPct - 2) return "warn";
    return "danger";
}
function toneICM(v: number): Tone {
    if (v >= thresholdsConfig.icm.minAccept) return "ok";
    return "warn";
}
function toneDMS(dms: number, nat: number): Tone {
    const overPct = ((dms - nat) / Math.max(nat, 0.0001)) * 100;
    if (overPct >= thresholdsConfig.dms.dangerOverNatPct) return "danger";
    if (overPct >= thresholdsConfig.dms.warnOverNatPct) return "warn";
    return "ok";
}
function toneGrOP(v: number): Tone {
    if (v > thresholdsConfig.grop.warnHigh) return "danger";
    if (v >= thresholdsConfig.grop.okMin && v <= thresholdsConfig.grop.okMax) return "ok";
    return "warn";
}
function toneDrgChir(pct: number): Tone {
    if (pct >= thresholdsConfig.drgChir.bench) return "ok";
    if (pct >= thresholdsConfig.drgChir.bench - 3) return "warn";
    return "danger";
}
function toneRataDecontarii(pct: number, subcontractRON: number): Tone {
    if (pct >= thresholdsConfig.rataDecontarii.minPct && subcontractRON >= 0) return "ok";
    if (pct >= thresholdsConfig.rataDecontarii.minPct - 3) return "warn";
    return "danger";
}
function toneSalariiPct(pct: number): Tone {
    if (pct >= thresholdsConfig.salariiPct.danger) return "danger";
    if (pct >= thresholdsConfig.salariiPct.warn) return "warn";
    return "ok";
}
function toneInvalidatePct(pct: number): Tone {
    if (pct >= thresholdsConfig.invalidatePct.danger) return "danger";
    if (pct >= thresholdsConfig.invalidatePct.warn) return "warn";
    return "ok";
}
function toneUpuCost(cost: number): Tone {
    if (!isFinite(cost)) return null;
    if (cost <= thresholdsConfig.upuCostBenchMax) return "ok";
    if (cost <= thresholdsConfig.upuCostBenchMax * 1.15) return "warn";
    return "danger";
}
function daysInQuarter(y: number, t: string) {
    const map: Record<string, [number, number]> = { T1: [0, 2], T2: [3, 5], T3: [6, 8], T4: [9, 11] };
    const [mStart, mEnd] = map[t] ?? [0, 2];
    const start = new Date(y, mStart, 1);
    const end = new Date(y, mEnd + 1, 0); // ultima zi a lunii mEnd
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    return Math.max(1, Math.round(diff));
}

/** Formatare */
const fmtPct = (n: number) => (isFinite(n) ? `${n.toFixed(1)}%` : "–");
const fmtRON = (n: number) =>
    isFinite(n)
        ? new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(n)
        : "–";

/** Tipuri simple */
type KpiModel = {
    key: string;
    title: string;
    value: string;
    subtitle?: string;
    badge?: Tone;
    hint?: string;
    glossaryKey?: string;
};

/** ============================
 *  Mapare coloane → KPI (wizard simplu)
 *  ============================ */
type KpiFieldKey =
    | "NrCE" | "NrCEV" | "ICM" | "DMS" | "DMS_nat" | "GrOP"
    | "DRG_chir_pct" | "Rata_decontarii_pct" | "Subcontract_RON"
    | "Realizat_RON" | "Facturat_RON" | "Contractat_RON"
    | "Salarii_pct" | "Invalidate_pct"
    | "Active_curente_RON" | "Furnizori_RON" | "Contributie_totala_RON" | "Creante_clienti_RON" 
    // Servicii interne
    | "ATI_cost_unit_RON" | "ATI_volum_zile"
    | "BO_cost_minut_RON" | "BO_volum_minute"
    | "RAD_cost_investigatie_RON" | "RAD_volum_investigatii"
    | "STER_cost_ciclu_RON" | "STER_volum_cicluri"
    // UPU/CPU
    | "UPU_cost_caz_RON"
    | "UPU_struct_salarii_pct"
    | "UPU_struct_medicamente_pct"
    | "UPU_struct_materiale_pct"
    | "UPU_struct_altele_pct"
    | "UPU_venituri_neinternati_RON"
    // P&L operațional
    | "PL_venituri_CJAS_RON"
    | "PL_alte_venituri_RON"
    | "PL_salarii_RON"
    | "PL_medicamente_RON"
    | "PL_materiale_RON"
    | "PL_utilitati_RON"
    | "PL_telecom_RON"
    | "PL_piese_schimb_RON"
    | "PL_alte_cheltuieli_RON"
    | "PL_det_combustibil_RON"
    | "PL_det_chirii_RON"
    | "PL_det_deplasari_RON"
    | "PL_det_malpraxis_RON";

const DEFAULT_MAPPING: Record<KpiFieldKey, string | null> = {
    // operațional + financiar
    NrCE: null, NrCEV: null, ICM: null, DMS: null, DMS_nat: null, GrOP: null,
    DRG_chir_pct: null, Rata_decontarii_pct: null, Subcontract_RON: null,
    Realizat_RON: null, Facturat_RON: null, Contractat_RON: null,
    Salarii_pct: null, Invalidate_pct: null,
    Active_curente_RON: null, Furnizori_RON: null, Contributie_totala_RON: null, Creante_clienti_RON: null, 

    // servicii interne
    ATI_cost_unit_RON: null, ATI_volum_zile: null,
    BO_cost_minut_RON: null, BO_volum_minute: null,
    RAD_cost_investigatie_RON: null, RAD_volum_investigatii: null,
    STER_cost_ciclu_RON: null, STER_volum_cicluri: null,

    // UPU/CPU
    UPU_cost_caz_RON: null,
    UPU_struct_salarii_pct: null,
    UPU_struct_medicamente_pct: null,
    UPU_struct_materiale_pct: null,
    UPU_struct_altele_pct: null,
    UPU_venituri_neinternati_RON: null,

    // P&L operațional
    PL_venituri_CJAS_RON: null,
    PL_alte_venituri_RON: null,
    PL_salarii_RON: null,
    PL_medicamente_RON: null,
    PL_materiale_RON: null,
    PL_utilitati_RON: null,
    PL_telecom_RON: null,
    PL_piese_schimb_RON: null,
    PL_alte_cheltuieli_RON: null,
    PL_det_combustibil_RON: null,
    PL_det_chirii_RON: null,
    PL_det_deplasari_RON: null,
    PL_det_malpraxis_RON: null,
};


/** ============================================================
 *  Utilitare: parsare numere + filtrare după perioadă/secție
 *  ============================================================ */
function toNumber(v: unknown): number {
    if (v === null || v === undefined) return NaN;
    const s = String(v)
        .trim()
        .replace(/\s/g, "")     // scoate spațiile
        .replace("%", "")       // scoate procentul
        .replace(/\.(?=\d{3}\b)/g, "") // scoate punctele de mii (1.234 -> 1234)
        .replace(",", ".");     // suportă „1,23”
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
}

function mean(nums: number[]): number {
    const arr = nums.filter((x) => isFinite(x));
    if (!arr.length) return NaN;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function sum(nums: number[]): number {
    const arr = nums.filter((x) => isFinite(x));
    if (!arr.length) return NaN;
    return arr.reduce((a, b) => a + b, 0);
}
// --- Trend pe 5 ani (ICM/DMS + DMS_nat) ---
function buildTrend5y(
    table: ParsedTable | null,
    mapping: Record<KpiFieldKey, string | null>,
    quarter: string,
    currentYearStr: string
) {
    const empty = { years: [] as string[], icm: [] as number[], dms: [] as number[], dmsNat: [] as number[] };
    if (!table || !table.rows.length) return empty;

    const t = table as ParsedTable;

    const currentYear = Number(currentYearStr);
    const yearsList = Array.from({ length: 5 }, (_, i) => String(currentYear - (4 - i)));

    const colAn = detectColumn(t.columns, ["An", "Year"]);
    const colTrim = detectColumn(t.columns, ["Trimestru", "Trim", "Quarter"]);

    const colICM = (mapping?.ICM ?? detectColumn(t.columns, ["ICM","icm"])) as string | null;
    const colDMS = (mapping?.DMS ?? detectColumn(t.columns, ["DMS","dms","Durata","Durata medie"])) as string | null;
    const colDMSnat = (mapping?.DMS_nat ?? detectColumn(t.columns, ["DMS_nat","DMS national","DMS_national","DMS național","DMS_național"])) as string | null;

    const agg = (yearStr: string, col: string | null): number => {
        if (!col) return NaN;
        let rows = t.rows;
        if (colAn) rows = rows.filter((r) => String(r[colAn]) === yearStr);
        if (colTrim) rows = rows.filter((r) => String(r[colTrim]) === quarter);
        if (!rows.length) return NaN;
        const vals = rows.map((r) => toNumber(r[col])).filter((x) => Number.isFinite(x));
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
    };

    return {
        years: yearsList,
        icm: yearsList.map((y) => agg(y, colICM)),
        dms: yearsList.map((y) => agg(y, colDMS)),
        dmsNat: yearsList.map((y) => agg(y, colDMSnat))
    };
}
// --- Agregare adresabilitate pe coloane "Județ" și "Spital" ---
function buildAdresabilitate(
    table: ParsedTable | null,
    quarter: string,
    year: string
) {
    if (!table || !table.rows.length) return { judete: {}, spitale: {} };

    const colAn = detectColumn(table.columns, ["An", "Year"]);
    const colTrim = detectColumn(table.columns, ["Trimestru", "Trim", "Quarter"]);
    const colJud = detectColumn(table.columns, ["Judet", "Județ"]);
    const colSpit = detectColumn(table.columns, ["Spital", "Unitate", "Trimitere"]);

    let rows = table.rows;
    if (colAn) rows = rows.filter(r => String(r[colAn]) === year);
    if (colTrim) rows = rows.filter(r => String(r[colTrim]) === quarter);

    const judete: Record<string, number> = {};
    const spitale: Record<string, number> = {};

    for (const r of rows) {
        if (colJud) {
            const k = String(r[colJud] ?? "necunoscut");
            judete[k] = (judete[k] ?? 0) + 1;
        }
        if (colSpit) {
            const k = String(r[colSpit] ?? "necunoscut");
            spitale[k] = (spitale[k] ?? 0) + 1;
        }
    }

    return { judete, spitale };
}

// auto-detect „An”, „Trimestru”, „Secție”
function detectColumn(columns: string[], candidates: string[]): string | null {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const set = new Set(columns.map((c) => norm(c)));
    for (const cand of candidates) {
        const n = norm(cand);
        if (set.has(n)) {
            const idx = columns.findIndex((c) => norm(c) === n);
            return idx >= 0 ? columns[idx] : cand;
        }
    }
    for (const col of columns) {
        const ncol = norm(col);
        if (candidates.some((cand) => ncol.startsWith(norm(cand)))) return col;
    }
    return null;
}

/** ============================================================
 *  Pagina Dashboard
 *  ============================================================ */
export default function DashboardPage() {
    // ==== Filtre UI: An + Trimestru (ultimii 5 ani + anul curent) ====
    const currentYear = new Date().getFullYear();
    const years = useMemo(
        () => Array.from({ length: 6 }, (_, i) => String(currentYear - i)),
        [currentYear]
    );
    const quarters = ["T1", "T2", "T3", "T4"];

    // Lista completă de secții (27), configurabilă ulterior per spital
    const ALL_SECTIONS = [
        "ATI", "Bloc operator", "Boli infecțioase", "Cardiologie", "Chirurgie generală", "CSSD/CPIVD (Sterilizare)", "Dermatologie",
        "Diabet, nutriție și boli metabolice", "Endocrinologie", "Farmacie", "Gastroenterologie", "Hematologie", "Laborator",
        "Nefrologie", "Neonatologie", "Neurologie", "Obstetrică–Ginecologie", "Oftalmologie", "Oncologie", "ORL", "Ortopedie",
        "Pediatrie", "Pneumologie", "Psihiatrie", "Radiologie–Imagistică", "Recuperare medicală", "UPU"
    ];

    const [year, setYear] = useState<string>(years[0] ?? String(currentYear));
    const [quarter, setQuarter] = useState<string>(quarters[0]);
    const [section, setSection] = useState<string>("Toate secțiile");
    const [activeTab, setActiveTab] = useState<TabKey>("servicii");
    const periodLabel = `${year} – ${quarter}`;
    const [thresholds, setThresholds] = React.useState<Thresholds>(DEFAULT_THRESHOLDS);
    // === Save view (localStorage) ===
    const SAVE_KEY = "dash_view_v1";

    // load la mount
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const p = JSON.parse(raw) as {
                year?: string; quarter?: string; section?: string; tab?: TabKey;
                thresholds?: Thresholds;
            };
            if (p.year) setYear(p.year);
            if (p.quarter) setQuarter(p.quarter);
            if (p.section) setSection(p.section);
            if (p.tab) setActiveTab(p.tab);
            if (p.thresholds) setThresholds(p.thresholds);
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // save automat când se schimbă filtrele/taba/pragurile
    React.useEffect(() => {
        try {
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify({
                    year, quarter, section, tab: activeTab, thresholds
                })
            );
        } catch { }
    }, [year, quarter, section, activeTab, thresholds]);

    // ==== Uploader de fișiere ====
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]);
    const [uploaderMsg, setUploaderMsg] = useState<string>("");

    async function handleFilesSelected(files: FileList | null) {
        if (!files || files.length === 0) return;
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
            } else if (ext === "xlsx" || ext === "xls") {
                try {
                    // @ts-ignore – rezolvat la runtime dacă lib există
                    const XLSX = (await import("xlsx")).default ?? (await import("xlsx"));
                    const arrayBuffer = await f.arrayBuffer();
                    const wb = XLSX.read(arrayBuffer, { type: "array" });
                    const sheetName = wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                    const columns = json.length ? Object.keys(json[0]) : [];
                    parsed.push({ filename: f.name, rows: json as Record<string, string | number>[], columns });
                } catch {
                    parsed.push({ filename: f.name, rows: [], columns: [] });
                    setUploaderMsg("Pentru XLS/XLSX este necesar pachetul „xlsx”. CSV funcționează deja.");
                }
            } else {
                parsed.push({ filename: f.name, rows: [], columns: [] });
                setUploaderMsg(`Format neacceptat: ${ext}. Folosește CSV pentru testare rapidă.`);
            }
        }

        setParsedTables(parsed);
        if (parsed.length) setSelectedFile(parsed[0].filename);
    }

    // ==== Mapare coloane → KPI ====
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [mapping, setMapping] = useState<Record<KpiFieldKey, string | null>>({ ...DEFAULT_MAPPING });

    const activeTable = useMemo(
        () => parsedTables.find((t) => t.filename === selectedFile) ?? null,
        [parsedTables, selectedFile]
    );

    // auto-select first table if none selected
    useEffect(() => {
        if (!selectedFile && parsedTables.length) {
            setSelectedFile(parsedTables[0].filename);
        }
    }, [parsedTables, selectedFile]);

    function updateMapping(field: KpiFieldKey, column: string | null) {
        setMapping((m) => ({ ...m, [field]: column }));
    }

    /** ============================================================
     *  ➊ EXTRAGERE DATE KPI din tabelul activ, după filtre
     *  ============================================================ */
    const kpiData = useMemo(() => {
        const fallback = {
            nrce: NaN, nrcev: NaN, validPct: NaN,
            icm: NaN, dms: NaN, dmsNat: NaN, grop: NaN,
            drgChir: NaN, rataDecontarii: NaN, subcontractRON: NaN,
            realizatRON: NaN, facturatRON: NaN, contractatRON: NaN,
            salariiPct: NaN, invalidatePct: NaN,
            active: NaN, furnizori: NaN, creanteClienti: NaN,
            contributieTotalaRON: NaN,
            serviciiInterne: {
                atiCostUnit: NaN, atiVolumZile: NaN,
                boCostMinut: NaN, boVolumMinute: NaN,
                radCostInvest: NaN, radVolum: NaN,
                sterCostCiclu: NaN, sterVolum: NaN,
            },
            upu: {
                costCaz: NaN,
                structSalarii: NaN,
                structMedicamente: NaN,
                structMateriale: NaN,
                structAltele: NaN,
                venituriNeinternati: NaN,
            },
            pl: {
                venituriTotale: NaN,
                venituriCJAS: NaN,
                alteVenituri: NaN,
                cheltTotale: NaN,
                salarii: NaN,
                medicamente: NaN,
                materiale: NaN,
                utilitati: NaN,
                telecom: NaN,
                pieseSchimb: NaN,
                alteCheltuieli: NaN,
                rezultatOper: NaN,
                // detaliu „Alte cheltuieli”
                detCombustibil: NaN,
                detChirii: NaN,
                detDeplasari: NaN,
                detMalpraxis: NaN,
                detRemainder: NaN,
                // ponderi
                pctSalarii: NaN, pctMedicamente: NaN, pctMateriale: NaN, pctUtilitati: NaN,
                pctTelecom: NaN, pctPiese: NaN, pctAlte: NaN,
            },
        };

        if (!activeTable || !activeTable.rows.length) return fallback;

        // autodetect An / Trimestru / Secție
        const colAn = detectColumn(activeTable.columns, ["An", "Year"]);
        const colTrim = detectColumn(activeTable.columns, ["Trimestru", "Trim", "Quarter"]);
        const colSectie = detectColumn(activeTable.columns, ["Secție", "Sectie", "Sectia", "Sec"]);

        // filtrare
        let rows = activeTable.rows;
        if (colAn) rows = rows.filter((r) => String(r[colAn]) === year);
        if (colTrim) rows = rows.filter((r) => String(r[colTrim]) === quarter);
        if (section !== "Toate secțiile" && colSectie) rows = rows.filter((r) => String(r[colSectie]) === section);

        if (!rows.length) return fallback;

        const M = mapping;

        // NrCE / NrCEV
        const nrceVals = M.NrCE ? rows.map((r) => toNumber(r[M.NrCE!])) : rows.map(() => 1);
        const nrcevVals = M.NrCEV ? rows.map((r) => toNumber(r[M.NrCEV!])) : rows.map(() => 1);
        const nrce = M.NrCE ? sum(nrceVals) : rows.length;
        const nrcev = M.NrCEV ? sum(nrcevVals) : rows.length;
        const validPct = nrce > 0 ? (nrcev / nrce) * 100 : NaN;

        // --- helper: întâi folosește coloana din mapare (UI), altfel detectează pe aliasuri.
        // Notă: nu folosește parametri „opționali” ca să evităm TS1016; întoarce undefined, nu null.
        // acceptă string | null | undefined la mapped
        const pickCol = (
            mapped: string | null | undefined,
            aliases: string[]
        ): string | undefined => {
            const cols = activeTable.columns.map((c) => String(c).trim());

            // normalizează mapped (poate fi null/undefined)
            const m = (mapped ?? "").trim();
            if (m.length) return m;

            const auto = detectColumn(cols, aliases);
            return auto ?? undefined; // nu propagăm null
        };

        // rezolvă coloanele (aliasuri tolerante)
        const colICM = pickCol(M.ICM, ["ICM", "icm"]);
        const colDMS = pickCol(M.DMS, ["DMS", "dms", "Durata", "Durata medie"]);
        const colDMSN = pickCol(M.DMS_nat, ["DMS_nat", "DMS national", "DMS_national", "DMS național", "DMS_național"]);
        const colGrOP = pickCol(M.GrOP, [
            "GrOP","GrOP%","GROP",
            "Grad ocupare","Grad de ocupare",
            "Grad ocupare paturi","Grad de ocupare paturi",
            "Grad ocupare paturi (%)","Grad de ocupare (%)",
            "ocupare paturi","ocupare paturi %","ocupare paturi (%)",
            "ocupare","ocupare (%)",
            "ocupare_%","ocupare_paturi_%"
        ]);

        // calcule pe rândurile FILTRATE (an / trimestru / secție)
        const icm = colICM ? mean(rows.map((r) => toNumber(r[colICM as string]))) : NaN;
        const dms = colDMS ? mean(rows.map((r) => toNumber(r[colDMS as string]))) : NaN;
        const dmsNat = colDMSN ? mean(rows.map((r) => toNumber(r[colDMSN as string]))) : NaN;
        const _gropRaw = colGrOP ? mean(rows.map((r) => toNumber(r[colGrOP as string]))) : NaN;
        // dacă vine ca 0.87 => 87; dacă deja e 87 (%) rămâne 87
        const grop = Number.isFinite(_gropRaw)
            ? (_gropRaw > 0 && _gropRaw <= 1 ? _gropRaw * 100 : _gropRaw)
            : NaN;

        const drgChir = M.DRG_chir_pct ? mean(rows.map((r) => toNumber(r[M.DRG_chir_pct!]))) : NaN;
        const rataDec = M.Rata_decontarii_pct ? mean(rows.map((r) => toNumber(r[M.Rata_decontarii_pct!]))) : NaN;
        const subcontractRON = M.Subcontract_RON ? sum(rows.map((r) => toNumber(r[M.Subcontract_RON!]))) : NaN;

        const realizatRON = M.Realizat_RON ? sum(rows.map((r) => toNumber(r[M.Realizat_RON!]))) : NaN;
        const facturatRON = M.Facturat_RON ? sum(rows.map((r) => toNumber(r[M.Facturat_RON!]))) : NaN;
        const contractatRON = M.Contractat_RON ? sum(rows.map((r) => toNumber(r[M.Contractat_RON!]))) : NaN;

        const salariiPct = M.Salarii_pct ? mean(rows.map((r) => toNumber(r[M.Salarii_pct!]))) : NaN;
        const invalPct = M.Invalidate_pct ? mean(rows.map((r) => toNumber(r[M.Invalidate_pct!]))) : NaN;

        const activeRON = M.Active_curente_RON ? sum(rows.map((r) => toNumber(r[M.Active_curente_RON!]))) : NaN;
        const furnizoriRON = M.Furnizori_RON ? sum(rows.map((r) => toNumber(r[M.Furnizori_RON!]))) : NaN;
        const creanteClRON = M.Creante_clienti_RON ? sum(rows.map((r) => toNumber(r[M.Creante_clienti_RON!]))) : NaN;

        const contribRON = M.Contributie_totala_RON ? sum(rows.map((r) => toNumber(r[M.Contributie_totala_RON!]))) : NaN;

        // Servicii interne
        const atiCostUnit = M.ATI_cost_unit_RON ? mean(rows.map((r) => toNumber(r[M.ATI_cost_unit_RON!]))) : NaN;
        const atiVolumZile = M.ATI_volum_zile ? sum(rows.map((r) => toNumber(r[M.ATI_volum_zile!]))) : NaN;

        const boCostMinut = M.BO_cost_minut_RON ? mean(rows.map((r) => toNumber(r[M.BO_cost_minut_RON!]))) : NaN;
        const boVolumMinute = M.BO_volum_minute ? sum(rows.map((r) => toNumber(r[M.BO_volum_minute!]))) : NaN;

        const radCostInvest = M.RAD_cost_investigatie_RON ? mean(rows.map((r) => toNumber(r[M.RAD_cost_investigatie_RON!]))) : NaN;
        const radVolum = M.RAD_volum_investigatii ? sum(rows.map((r) => toNumber(r[M.RAD_volum_investigatii!]))) : NaN;

        const sterCostCiclu = M.STER_cost_ciclu_RON ? mean(rows.map((r) => toNumber(r[M.STER_cost_ciclu_RON!]))) : NaN;
        const sterVolum = M.STER_volum_cicluri ? sum(rows.map((r) => toNumber(r[M.STER_volum_cicluri!]))) : NaN;

        // UPU/CPU
        const upuCostCaz = M.UPU_cost_caz_RON ? mean(rows.map((r) => toNumber(r[M.UPU_cost_caz_RON!]))) : NaN;
        const upuStructSal = M.UPU_struct_salarii_pct ? mean(rows.map((r) => toNumber(r[M.UPU_struct_salarii_pct!]))) : NaN;
        const upuStructMed = M.UPU_struct_medicamente_pct ? mean(rows.map((r) => toNumber(r[M.UPU_struct_medicamente_pct!]))) : NaN;
        const upuStructMat = M.UPU_struct_materiale_pct ? mean(rows.map((r) => toNumber(r[M.UPU_struct_materiale_pct!]))) : NaN;
        const upuStructAlt = M.UPU_struct_altele_pct ? mean(rows.map((r) => toNumber(r[M.UPU_struct_altele_pct!]))) : NaN;
        const upuVenitNeintRON = M.UPU_venituri_neinternati_RON ? sum(rows.map((r) => toNumber(r[M.UPU_venituri_neinternati_RON!]))) : NaN;

        // P&L operațional
        const plVenCJAS = M.PL_venituri_CJAS_RON ? sum(rows.map((r) => toNumber(r[M.PL_venituri_CJAS_RON!]))) : NaN;
        const plAlteVen = M.PL_alte_venituri_RON ? sum(rows.map((r) => toNumber(r[M.PL_alte_venituri_RON!]))) : NaN;
        const plSalarii = M.PL_salarii_RON ? sum(rows.map((r) => toNumber(r[M.PL_salarii_RON!]))) : NaN;
        const plMed = M.PL_medicamente_RON ? sum(rows.map((r) => toNumber(r[M.PL_medicamente_RON!]))) : NaN;
        const plMat = M.PL_materiale_RON ? sum(rows.map((r) => toNumber(r[M.PL_materiale_RON!]))) : NaN;
        const plUtil = M.PL_utilitati_RON ? sum(rows.map((r) => toNumber(r[M.PL_utilitati_RON!]))) : NaN;
        const plTel = M.PL_telecom_RON ? sum(rows.map((r) => toNumber(r[M.PL_telecom_RON!]))) : NaN;
        const plPiese = M.PL_piese_schimb_RON ? sum(rows.map((r) => toNumber(r[M.PL_piese_schimb_RON!]))) : NaN;
        const plAlteCh = M.PL_alte_cheltuieli_RON ? sum(rows.map((r) => toNumber(r[M.PL_alte_cheltuieli_RON!]))) : NaN;

        const plComb = M.PL_det_combustibil_RON ? sum(rows.map((r) => toNumber(r[M.PL_det_combustibil_RON!]))) : NaN;
        const plChirii = M.PL_det_chirii_RON ? sum(rows.map((r) => toNumber(r[M.PL_det_chirii_RON!]))) : NaN;
        const plDepl = M.PL_det_deplasari_RON ? sum(rows.map((r) => toNumber(r[M.PL_det_deplasari_RON!]))) : NaN;
        const plMalp = M.PL_det_malpraxis_RON ? sum(rows.map((r) => toNumber(r[M.PL_det_malpraxis_RON!]))) : NaN;

        const venituriTot = (isFinite(plVenCJAS) ? plVenCJAS : 0) + (isFinite(plAlteVen) ? plAlteVen : 0);
        const cheltTot =
            (isFinite(plSalarii) ? plSalarii : 0) +
            (isFinite(plMed) ? plMed : 0) +
            (isFinite(plMat) ? plMat : 0) +
            (isFinite(plUtil) ? plUtil : 0) +
            (isFinite(plTel) ? plTel : 0) +
            (isFinite(plPiese) ? plPiese : 0) +
            (isFinite(plAlteCh) ? plAlteCh : 0);

        const rezultatOper = (isFinite(venituriTot) && isFinite(cheltTot)) ? (venituriTot - cheltTot) : NaN;

        // repartizare „Alte cheltuieli”
        const detSumKnown =
            (isFinite(plComb) ? plComb : 0) +
            (isFinite(plChirii) ? plChirii : 0) +
            (isFinite(plDepl) ? plDepl : 0) +
            (isFinite(plMalp) ? plMalp : 0);
        const detRemainder = isFinite(plAlteCh) ? (plAlteCh - detSumKnown) : NaN;

        // ponderi (din cheltuieli totale)
        const pct = (part: number, tot: number) => (isFinite(part) && isFinite(tot) && tot !== 0 ? (part / tot) * 100 : NaN);
        const pctSalarii = pct(plSalarii, cheltTot);
        const pctMedicamente = pct(plMed, cheltTot);
        const pctMateriale = pct(plMat, cheltTot);
        const pctUtilitati = pct(plUtil, cheltTot);
        const pctTelecom = pct(plTel, cheltTot);
        const pctPiese = pct(plPiese, cheltTot);
        const pctAlte = pct(plAlteCh, cheltTot);

        return {
            nrce, nrcev, validPct,
            icm, dms, dmsNat, grop,
            drgChir, rataDecontarii: rataDec, subcontractRON,
            realizatRON, facturatRON, contractatRON,
            salariiPct, invalidatePct: invalPct,
            active: activeRON, furnizori: furnizoriRON, creanteClienti: creanteClRON,
            contributieTotalaRON: contribRON,
            serviciiInterne: {
                atiCostUnit, atiVolumZile,
                boCostMinut, boVolumMinute,
                radCostInvest, radVolum,
                sterCostCiclu, sterVolum,
            },
            upu: {
                costCaz: upuCostCaz,
                structSalarii: upuStructSal,
                structMedicamente: upuStructMed,
                structMateriale: upuStructMat,
                structAltele: upuStructAlt,
                venituriNeinternati: upuVenitNeintRON,
            },
            pl: {
                venituriTotale: venituriTot,
                venituriCJAS: plVenCJAS,
                alteVenituri: plAlteVen,
                cheltTotale: cheltTot,
                salarii: plSalarii,
                medicamente: plMed,
                materiale: plMat,
                utilitati: plUtil,
                telecom: plTel,
                pieseSchimb: plPiese,
                alteCheltuieli: plAlteCh,
                rezultatOper,
                detCombustibil: plComb,
                detChirii: plChirii,
                detDeplasari: plDepl,
                detMalpraxis: plMalp,
                detRemainder,
                pctSalarii, pctMedicamente, pctMateriale, pctUtilitati, pctTelecom, pctPiese, pctAlte,
            },
        };
    }, [activeTable, mapping, year, quarter, section]);

    // --- Trend 5 ani pentru ICM/DMS (vs DMS național) ---
    const trend5y = useMemo(
        () => buildTrend5y(activeTable, mapping, quarter, year),
        [activeTable, mapping, quarter, year]
    );

    // --- Adresabilitate (județe + spitale trimitere) ---
    const adresabilitate = useMemo(
        () => buildAdresabilitate(activeTable, quarter, year),
        [activeTable, quarter, year]
    );

    /** ============================================================
     *  ➋ Construim cardurile KPI folosind kpiData (cu fallback „–”)
     *  ============================================================ */
    const kpiR1: KpiModel[] = useMemo(() => {
        const validVal = isFinite(kpiData.validPct) ? kpiData.validPct : NaN;
        const dmsVal = isFinite(kpiData.dms) ? kpiData.dms : NaN;
        const dmsNat = isFinite(kpiData.dmsNat) ? kpiData.dmsNat : NaN;
        const icmVal = isFinite(kpiData.icm) ? kpiData.icm : NaN;
        const gropVal = isFinite(kpiData.grop) ? kpiData.grop : NaN;

        return [
            {
                key: "nrce",
                title: "NrCE / NrCEV",
                value:
                    (isFinite(kpiData.nrce) ? Math.round(kpiData.nrce).toLocaleString("ro-RO") : "–") +
                    " / " +
                    (isFinite(kpiData.nrcev) ? Math.round(kpiData.nrcev).toLocaleString("ro-RO") : "–") +
                    (isFinite(validVal) ? ` (${fmtPct(validVal)})` : ""),
                subtitle: "cazuri externate și validate",
                badge: isFinite(validVal) ? toneValidare(validVal) : null,
                hint: `Țintă validare ≥ ${thresholdsConfig.validareMinPct}%`,
                glossaryKey: "NrCE / NrCEV",
            },
            {
                key: "icm",
                title: "ICM",
                value: isFinite(icmVal) ? icmVal.toFixed(2).replace(".", ",") : "–",
                subtitle: "trend: din date",
                badge: isFinite(icmVal) ? toneICM(icmVal) : null,
                hint: "Complexitatea medie a cazurilor",
                glossaryKey: "ICM",
            },
            {
                key: "dms",
                title: "DMS (Durată medie)",
                value: isFinite(dmsVal) ? `${dmsVal.toFixed(1)} zile` : "–",
                subtitle: `vs medie națională: ${isFinite(dmsNat) ? dmsNat.toFixed(1) : "–"}`,
                badge: isFinite(dmsVal) && isFinite(dmsNat) ? toneDMS(dmsVal, dmsNat) : null,
                hint: `Alertă > ${thresholdsConfig.dms.warnOverNatPct}% peste medie`,
                glossaryKey: "DMS (Durată medie)",
            },
            {
                key: "grop",
                title: "GrOP% (ocupare paturi)",
                value: fmtPct(gropVal),
                subtitle: "țintă operațională 75–90%",
                badge: isFinite(gropVal) ? toneGrOP(gropVal) : null,
                hint: `Alertă > ${thresholdsConfig.grop.warnHigh}% susținut`,
                glossaryKey: "GrOP% (ocupare paturi)",
            },
        ];
    }, [kpiData]);

    const kpiR2: KpiModel[] = useMemo(() => {
        const drg = isFinite(kpiData.drgChir) ? kpiData.drgChir : NaN;
        const rd = isFinite(kpiData.rataDecontarii) ? kpiData.rataDecontarii : NaN;
        const sc = isFinite(kpiData.subcontractRON) ? kpiData.subcontractRON : NaN;
        const sal = isFinite(kpiData.salariiPct) ? kpiData.salariiPct : NaN;
        const inv = isFinite(kpiData.invalidatePct) ? kpiData.invalidatePct : NaN;

        return [
            {
                key: "drg_chir",
                title: "% DRG chirurgical",
                value: fmtPct(drg),
                subtitle: `vs bench: ${thresholdsConfig.drgChir.bench}%`,
                badge: isFinite(drg) ? toneDrgChir(drg) : null,
                glossaryKey: "% DRG chirurgical",
            },
            {
                key: "rata_decontarii",
                title: "Rata decontării",
                value: fmtPct(rd),
                subtitle: `Sub contract: ${fmtRON(sc)}`,
                badge: isFinite(rd) && isFinite(sc) ? toneRataDecontarii(rd, sc) : null,
                hint: "Realizat – Facturat – Contractat",
                glossaryKey: "Rata decontării",
            },
            {
                key: "salarii",
                title: "Pondere salarii %",
                value: fmtPct(sal),
                subtitle: "operațional",
                badge: isFinite(sal) ? toneSalariiPct(sal) : null,
                glossaryKey: "Pondere salarii %",
            },
            {
                key: "invalidate",
                title: "% cazuri invalidate",
                value: fmtPct(inv),
                subtitle: "calitate codificare DRG",
                badge: isFinite(inv) ? toneInvalidatePct(inv) : null,
                glossaryKey: "% cazuri invalidate",
            },
        ];
    }, [kpiData]);

    const kpiR3: KpiModel[] = useMemo(() => {
        const contrib = kpiData.contributieTotalaRON;
        return [
            {
                key: "contrib_total",
                title: "Contribuție operațională totală",
                value: fmtRON(contrib),
                subtitle: "după cheltuieli directe și indirecte",
                badge: isFinite(contrib) ? (contrib >= 0 ? "ok" : "danger") : null,
                glossaryKey: "Contribuție operațională totală",
            },
        ];
    }, [kpiData]);

    // Scorecards pe secții — placeholder (va fi legat la pasul dedicat)
    const sectii = [
        { nume: "Chirurgie generală", nrce: 320, icm: 1.15, dms: 7.1, grop: 92, contrib: -5 },
        { nume: "ATI", nrce: 180, icm: 2.05, dms: 3.8, grop: 97, contrib: 8 },
        { nume: "Ortopedie", nrce: 220, icm: 1.10, dms: 6.5, grop: 90, contrib: 0 },
        { nume: "Pediatrie", nrce: 260, icm: 0.98, dms: 5.3, grop: 84, contrib: 2 },
        { nume: "UPU", nrce: 2100, icm: 0.70, dms: 0.3, grop: 0, contrib: -1 },
        { nume: "Cardiologie", nrce: 190, icm: 1.35, dms: 6.0, grop: 88, contrib: 4 },
    ];
    const riscBadge: Tone =
        isFinite(kpiData.active) && isFinite(kpiData.furnizori)
            ? (() => {
                const diff = Math.abs(kpiData.active - kpiData.furnizori);
                const ratio = kpiData.furnizori !== 0 ? diff / kpiData.furnizori : 0;
                if (ratio < 0.05) return "warn";   // diferență sub 5% => galben
                return kpiData.active > kpiData.furnizori ? "ok" : "danger";
            })()
            : null;

    return (
        <div style={styles.page}>
            {/* ===== Header + Filtre ===== */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.h1}>Dashboard</h1>
                    <div style={styles.filters}>
                        <Select value={year} onChange={setYear} label="An" options={years} />
                        <Select value={quarter} onChange={setQuarter} label="Trimestru" options={quarters} />
                        {/* Select Secție cu căutare și scroll */}
                        <SectionSelect
                            value={section}
                            onChange={setSection}
                            label="Secție"
                            options={ALL_SECTIONS}
                        />
                    </div>

                    <UploaderPanel
                        onFiles={handleFilesSelected}
                        uploadedFiles={uploadedFiles}
                        parsedTables={parsedTables}
                        message={uploaderMsg}
                    />
                </div>
                <div style={styles.headerRight}>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>
                        Perioadă: <strong>{periodLabel}</strong>
                    </span>

                    <TabNav active={activeTab} onChange={setActiveTab} />

                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            type="button"
                            style={styles.smallBtn}
                            onClick={() => {
                                if (!activeTable || !activeTable.rows.length) return;
                                const colAn = detectColumn(activeTable.columns, ["An", "Year"]);
                                const colTrim = detectColumn(activeTable.columns, ["Trimestru", "Trim", "Quarter"]);
                                const colSectie = detectColumn(activeTable.columns, ["Secție", "Sectie", "Sectia", "Sec"]);
                                let rows = activeTable.rows;
                                if (colAn) rows = rows.filter(r => String(r[colAn]) === year);
                                if (colTrim) rows = rows.filter(r => String(r[colTrim]) === quarter);
                                if (section !== "Toate secțiile" && colSectie) rows = rows.filter(r => String(r[colSectie]) === section);
                                exportCSV(`export_${year}_${quarter}.csv`, rows as any[]);
                            }}
                        >
                            Export CSV
                        </button>

                        <button
                            type="button"
                            style={styles.smallBtn}
                            onClick={() => {
                                const payload = { year, quarter, section, tab: activeTab, thresholds };
                                localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
                                alert("Vedere salvată!");
                            }}
                        >
                            Save view
                        </button>

                        <button
                            type="button"
                            style={styles.smallBtn}
                            onClick={() => {
                                localStorage.removeItem(SAVE_KEY);
                                setYear(years[0] ?? String(new Date().getFullYear()));
                                setQuarter("T1");
                                setSection("Toate secțiile");
                                setActiveTab("servicii");
                                setThresholds(DEFAULT_THRESHOLDS);
                            }}
                        >
                            Reset view
                        </button>
                    </div>
                </div>  

            </header>

            {/* ===== Mapping Panel (wizard simplu) ===== */}
            <MappingPanel
                tables={parsedTables}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                mapping={mapping}
                onChangeMapping={updateMapping}
            />

            {/* ===== KPI Row 1 ===== */}
            <Section title="Operațional și Clinic">
                <div style={styles.kpiGrid}>
                    {kpiR1.map(({ key: _key, ...rest }) => (
                        <KpiCard key={_key} {...rest} />
                    ))}
                </div>
            </Section>
            <Section title="Evoluții și benchmark – ICM / DMS (ultimii 5 ani)">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Col stânga: ICM pe 5 ani */}
                    <div style={bigCardStyles.card}>
                        <div style={bigCardStyles.header}>
                            <span style={bigCardStyles.title}>
                                ICM – trend 5 ani <Tooltip label="i" text={GLOSAR["ICM"] ?? ""} />
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, trend5y.years.length)}, 1fr)`, gap: 8, paddingTop: 6 }}>
                            {trend5y.years.map((y, i) => (
                                <div key={y} style={{ padding: 8, background: "#fafafa", border: "1px solid rgba(0,0,0,.06)", borderRadius: 10 }}>
                                    <div style={{ fontSize: 12, opacity: .7 }}>{y}</div>
                                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                                        {isFinite(trend5y.icm[i]) ? trend5y.icm[i].toFixed(2).replace(".", ",") : "–"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col dreapta: DMS vs medie națională */}
                    <div style={bigCardStyles.card}>
                        <div style={bigCardStyles.header}>
                            <span style={bigCardStyles.title}>
                                DMS – trend 5 ani vs medie națională <Tooltip label="i" text={GLOSAR["DMS (Durată medie)"] ?? ""} />
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, trend5y.years.length)}, 1fr)`, gap: 8, paddingTop: 6 }}>
                            {trend5y.years.map((y, i) => {
                                const d = trend5y.dms[i];
                                const nat = trend5y.dmsNat[i];
                                const tone = (isFinite(d) && isFinite(nat)) ? toneDMS(d, nat) : null;
                                const overPct = (isFinite(d) && isFinite(nat) && nat !== 0) ? ((d - nat) / nat) * 100 : NaN;
                                return (
                                    <div key={y} style={{ padding: 8, background: "#fafafa", border: "1px solid rgba(0,0,0,.06)", borderRadius: 10 }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                            <div style={{ fontSize: 12, opacity: .7 }}>{y}</div>
                                            {tone && <Badge tone={tone} />}
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: 18 }}>
                                            {isFinite(d) ? `${d.toFixed(1)} zile` : "–"}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: .8 }}>
                                            {isFinite(nat) ? `național: ${nat.toFixed(1)} zile` : "național: –"}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
                                            {isFinite(overPct) ? `${overPct >= 0 ? "+" : ""}${overPct.toFixed(1)}% vs nat.` : "–"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Migrație și adresabilitate – Județe / Spitale">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Adresabilitate pe județe */}
                    <div style={bigCardStyles.card}>
                        <div style={bigCardStyles.header}>
                            <span style={bigCardStyles.title}>Adresabilitate pe județe</span>
                        </div>
                        <ul style={{ maxHeight: 260, overflow: "auto", margin: 0, padding: "0 8px" }}>
                            {Object.entries(adresabilitate.judete)
                                .sort((a, b) => b[1] - a[1])
                                .map(([jud, val]) => (
                                    <li key={jud} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                                        <span>{jud}</span>
                                        <strong>{val}</strong>
                                    </li>
                                ))}
                            {Object.keys(adresabilitate.judete).length === 0 && (
                                <li style={{ padding: "4px 0", opacity: .6 }}>— fără coloana „Județ” în fișier —</li>
                            )}
                        </ul>
                    </div>

                    {/* Adresabilitate pe spitale */}
                    <div style={bigCardStyles.card}>
                        <div style={bigCardStyles.header}>
                            <span style={bigCardStyles.title}>Adresabilitate pe spitale</span>
                        </div>
                        <ul style={{ maxHeight: 260, overflow: "auto", margin: 0, padding: "0 8px" }}>
                            {Object.entries(adresabilitate.spitale)
                                .sort((a, b) => b[1] - a[1])
                                .map(([sp, val]) => (
                                    <li key={sp} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                                        <span>{sp}</span>
                                        <strong>{val}</strong>
                                    </li>
                                ))}
                            {Object.keys(adresabilitate.spitale).length === 0 && (
                                <li style={{ padding: "4px 0", opacity: .6 }}>— fără coloana „Spital/Trimitere” în fișier —</li>
                            )}
                        </ul>
                    </div>
                </div>
            </Section>

            {/* ===== KPI Row 2 ===== */}
            <Section title="Contractare, Financiar și Calitate">
                <div style={styles.kpiGrid}>
                    {kpiR2.map(({ key: _key, ...rest }) => (
                        <KpiCard key={_key} {...rest} />
                    ))}
                </div>
            </Section>

            {/* ===== Contractare și Decontare ===== */}
            <Section title="Contractare și Decontare">
                <BigCard
                    title="Execuție contract"
                    glossaryKey="Rata decontării"
                    badge={
                        isFinite(kpiData.rataDecontarii) && isFinite(kpiData.subcontractRON)
                            ? toneRataDecontarii(kpiData.rataDecontarii, kpiData.subcontractRON)
                            : null
                    }
                >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                        <Stat label="Realizat" value={fmtRON(kpiData.realizatRON)} />
                        <Stat label="Facturat" value={fmtRON(kpiData.facturatRON)} />
                        <Stat label="Contractat" value={fmtRON(kpiData.contractatRON)} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                        {isFinite(kpiData.contractatRON) && isFinite(kpiData.realizatRON)
                            ? kpiData.realizatRON < kpiData.contractatRON
                                ? "Spitalul nu a reușit să deconteze toate sumele disponibile"
                                : "Toate sumele contractate au fost acoperite"
                            : "–"}
                    </div>
                </BigCard>
            </Section>

            {/* ===== Rezultat operațional ===== */}
            <Section title="Rezultat operațional">
                <div style={styles.kpiGridOne}>
                    {kpiR3.map(({ key: _key, ...rest }) => (
                        <KpiCard key={_key} {...rest} />
                    ))}
                </div>
            </Section>

            {/* ===== Lichiditate + Scorecards ===== */}
            <div style={styles.twoCols}>
                <div style={styles.leftCol}>
                    <BigCard title="Active circulante vs. Furnizori" badge={riscBadge} glossaryKey="Active circulante vs. Furnizori">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Stat label="Active circulante" value={fmtRON(kpiData.active)} />
                            <Stat label="Furnizori" value={fmtRON(kpiData.furnizori)} />
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                            {isFinite(kpiData.active) && isFinite(kpiData.furnizori)
                                ? (kpiData.active < kpiData.furnizori
                                    ? "Presiune pe cash: Furnizori > Active circulante"
                                    : "Lichiditate adecvată")
                                : "–"}
                        </div>
                    </BigCard>
                </div>
                <div style={styles.rightCol}>
                    <BigCard title="Scorecard Secții" hint="Mini-carduri pe secție; link spre taskuri corective" glossaryKey="Scorecard Secții">
                        <div style={styles.scoreGrid}>
                            {sectii.map((s) => (
                                <ScoreCard key={s.nume} {...s} />
                            ))}
                        </div>
                    </BigCard>
                </div>
            </div>

            {/* ===== Taburi Secundare ===== */}
            <div style={{ marginTop: 18 }}>
                {activeTab === "servicii" && (
                    <ServiciiInterneSection data={kpiData.serviciiInterne} />
                )}
                {activeTab === "upu" && <UpuCpuSection data={kpiData.upu} />}
                {activeTab === "pl" && <PlSection data={kpiData.pl} />}
                {activeTab === "flux" &&
                    <FluxFinanciar
                        kpiData={kpiData}
                        year={year}
                        quarter={quarter}
                        thresholds={thresholds}
                        setThresholds={setThresholds}
                    />
                }
            </div>
        </div>
    );
}
// ===== Export util =====
function exportCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows?.length) return;
    const cols = Object.keys(rows[0]);
    const esc = (v: any) => {
        let s = v == null ? "" : String(v);
        if (s.includes('"') || s.includes(';') || s.includes('\n')) {
            s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };
    const csv = [cols.join(";")].concat(rows.map(r => cols.map(c => esc(r[c])).join(";"))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/** ===========================
 *  Componente UI locale
 *  =========================== */

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 16 }}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.h2}>{props.title}</h2>
            </div>
            {props.children}
        </section>
    );
}

function KpiCard({
    title,
    value,
    subtitle,
    badge,
    hint,
    glossaryKey,
}: KpiModel) {
    return (
        <div style={cardStyles.card}>
            <div style={cardStyles.header}>
                <span style={cardStyles.title}>
                    {title} {glossaryKey && <Tooltip label="i" text={GLOSAR[glossaryKey] ?? ""} />}
                </span>
                {badge && <Badge tone={badge} />}
            </div>
            <div style={cardStyles.body}>
                <div style={cardStyles.value}>{value}</div>
                {subtitle && <div style={cardStyles.subtitle}>{subtitle}</div>}
            </div>
            {hint && <div style={cardStyles.footer}>{hint}</div>}
        </div>
    );
}

function BigCard({
    title,
    children,
    hint,
    badge,
    glossaryKey,
}: {
    title: string;
    children: React.ReactNode;
    hint?: string;
    badge?: Tone;
    glossaryKey?: string;
}) {
    return (
        <div style={bigCardStyles.card}>
            <div style={bigCardStyles.header}>
                <span style={bigCardStyles.title}>
                    {title} {glossaryKey && <Tooltip label="i" text={GLOSAR[glossaryKey] ?? ""} />}
                </span>
                {badge && <Badge tone={badge} />}
            </div>
            <div style={bigCardStyles.body}>{children}</div>
            {hint && <div style={bigCardStyles.footer}>{hint}</div>}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: 8, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
        </div>
    );
}

function ScoreCard({
    nume,
    nrce,
    icm,
    dms,
    grop,
    contrib,
}: {
    nume: string;
    nrce: number;
    icm: number;
    dms: number;
    grop: number;
    contrib: number;
}) {
    const contribTone: Tone = contrib > 0 ? "ok" : contrib < 0 ? "danger" : null;

    return (
        <div
            style={scoreCardStyles.card}
            onDoubleClick={() => alert(`Taskuri corective pentru ${nume} (placeholder)`)}
        >
            <div style={scoreCardStyles.header}>
                <span style={scoreCardStyles.title}>
                    {nume} <Tooltip label="i" text="Mini-KPI esențiale la nivel de secție; clic pe Taskuri pentru corecții." />
                </span>
                {contribTone && <Badge tone={contribTone} />}
            </div>
            <div style={scoreCardStyles.grid}>
                <MiniStat label="NrCE" value={String(nrce)} />
                <MiniStat label="ICM" value={icm.toFixed(2)} />
                <MiniStat label="DMS" value={`${dms.toFixed(1)} zile`} />
                <MiniStat label="GrOP" value={fmtPct(grop)} />
                <MiniStat label="Contrib." value={(contrib > 0 ? "+" : "") + contrib + "%"} />
            </div>
            <div style={scoreCardStyles.footer}>
                <button
                    type="button"
                    style={styles.linkBtn}
                    onClick={() => alert(`Taskuri corective pentru ${nume} (placeholder)`)}
                >
                    Taskuri corective
                </button>
            </div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: "6px 8px", background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
        </div>
    );
}

function Badge({ tone }: { tone: NonNullable<Tone> }) {
    const map = {
        ok: { bg: "rgba(16, 185, 129, .14)", dot: "#10b981", text: "#065f46", label: "OK" },
        warn: { bg: "rgba(245, 158, 11, .14)", dot: "#f59e0b", text: "#7c2d12", label: "Atenție" },
        danger: { bg: "rgba(239, 68, 68, .14)", dot: "#ef4444", text: "#7f1d1d", label: "Risc" },
    } as const;
    const t = map[tone];
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 999, background: t.bg, color: t.text, fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, background: t.dot, borderRadius: 999 }} />
            {t.label}
        </span>
    );
}

/** Tooltip simplu (fără dependențe) */
function Tooltip({ label, text }: { label: string; text: string }) {
    const [open, setOpen] = useState(false);
    return (
        <span
            style={{ position: "relative", display: "inline-flex", marginLeft: 6 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <span
                aria-label="info"
                style={{
                    width: 16,
                    height: 16,
                    lineHeight: "16px",
                    textAlign: "center",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: "rgba(37, 99, 235, .14)",
                    color: "#1e40af",
                    display: "inline-block",
                    cursor: "default",
                }}
            >
                {label}
            </span>
            {open && text && (
                <span
                    role="tooltip"
                    style={{
                        position: "absolute",
                        top: "120%",
                        left: 0,
                        zIndex: 30,
                        maxWidth: 320,
                        padding: "10px 12px",
                        background: "#111827",
                        color: "white",
                        fontSize: 12,
                        borderRadius: 10,
                        boxShadow: "0 10px 20px rgba(0,0,0,.25)",
                        whiteSpace: "normal",
                    }}
                >
                    {text}
                </span>
            )}
        </span>
    );
}

/** ===========================
 *  SectionSelect – cu căutare și scroll
 *  =========================== */
function SectionSelect({
    value,
    onChange,
    label,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    options: string[];
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const boxRef = React.useRef<HTMLDivElement | null>(null);

    const filtered = useMemo(() => {
        const sorted = [...options].sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }));
        if (!query.trim()) return sorted;
        const q = query.toLowerCase();
        return sorted.filter((s) => s.toLowerCase().includes(q));
    }, [options, query]);

    React.useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    function handleSelect(v: string) {
        onChange(v);
        setOpen(false);
        setQuery("");
    }

    return (
        <label style={{ ...styles.selectLabel, position: "relative" }} ref={boxRef as any}>
            <span style={styles.selectSpan}>{label}</span>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{ ...styles.select, width: 260, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "Toate secțiile"}
                </span>
                <span style={{ opacity: 0.6 }}>▾</span>
            </button>

            {open && (
                <div
                    role="listbox"
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 40,
                        width: 320,
                        marginTop: 6,
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 12,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#fafafa" }}>
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Caută secția…"
                            style={{
                                width: "100%", padding: "8px 10px", borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.12)", outline: "none",
                            }}
                        />
                    </div>

                    <div
                        onClick={() => handleSelect("Toate secțiile")}
                        style={{
                            padding: "8px 12px", cursor: "pointer", fontWeight: value === "Toate secțiile" ? 700 : 600,
                            background: value === "Toate secțiile" ? "rgba(37,99,235,.06)" : "#fff",
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                    >
                        Toate secțiile
                    </div>

                    {/* max 6 opțiuni vizibile */}
                    <div style={{ maxHeight: 6 * 38, overflowY: "auto" }}>
                        {filtered.map((opt) => (
                            <div
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                style={{
                                    padding: "9px 12px",
                                    cursor: "pointer",
                                    background: value === opt ? "rgba(37,99,235,.06)" : "#fff",
                                    fontWeight: value === opt ? 700 : 500,
                                }}
                            >
                                {opt}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: "10px 12px", opacity: 0.65, fontSize: 12 }}>Nicio secție găsită</div>
                        )}
                    </div>
                </div>
            )}
        </label>
    );
}

/** ===========================
 *  UploaderPanel (UI)
 *  =========================== */
function UploaderPanel({
    onFiles,
    uploadedFiles,
    parsedTables,
    message,
}: {
    onFiles: (files: FileList | null) => void;
    uploadedFiles: File[];
    parsedTables: ParsedTable[];
    message: string;
}) {
    return (
        <div style={uploaderStyles.wrap}>
            <label htmlFor="uploader" style={uploaderStyles.label}>
                <input
                    id="uploader"
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => onFiles(e.target.files)}
                    style={{ display: "none" }}
                />
                <span style={uploaderStyles.btn}>Încarcă fișiere (CSV/XLSX)</span>
                <span style={uploaderStyles.hint}>CSV funcționează deja. XLSX e suportat cu import dinamic (dacă pachetul „xlsx” există).</span>
            </label>

            {message && <div style={uploaderStyles.msg}>{message}</div>}

            {uploadedFiles.length > 0 && (
                <div style={uploaderStyles.preview}>
                    <div style={uploaderStyles.previewTitle}>Fișiere încărcate</div>
                    <ul style={uploaderStyles.list}>
                        {uploadedFiles.map((f) => {
                            const t = parsedTables.find((pt) => pt.filename === f.name);
                            const hasRows = !!t && t.rows.length > 0;
                            return (
                                <li key={f.name} style={uploaderStyles.item}>
                                    <strong>{f.name}</strong>
                                    {hasRows ? (
                                        <span style={uploaderStyles.meta}>
                                            • rânduri: {t?.rows.length ?? 0} • coloane: {t?.columns.length ?? 0}
                                        </span>
                                    ) : (
                                        <span style={uploaderStyles.metaMuted}> • neparsat sau pachet „xlsx” lipsă</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

const uploaderStyles: Record<string, React.CSSProperties> = {
    wrap: { display: "flex", flexDirection: "column", gap: 6, marginLeft: 8 },
    label: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
    btn: {
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "linear-gradient(180deg, #f8fafc, #fff)",
        fontWeight: 700,
        fontSize: 12,
    },
    hint: { fontSize: 12, opacity: 0.7 },
    msg: {
        fontSize: 12,
        color: "#7c2d12",
        background: "rgba(245, 158, 11, .14)",
        border: "1px solid rgba(245, 158, 11, .35)",
        padding: "6px 8px",
        borderRadius: 8,
    },
    preview: {
        marginTop: 4,
        border: "1px dashed rgba(0,0,0,0.12)",
        borderRadius: 12,
        padding: 8,
        background: "#fff",
    },
    previewTitle: { fontWeight: 800, fontSize: 12, marginBottom: 6 },
    list: { margin: 0, paddingLeft: 16 },
    item: { display: "flex", gap: 8, alignItems: "center", fontSize: 12, lineHeight: "20px" },
    meta: { opacity: 0.85 },
    metaMuted: { opacity: 0.55 },
};

/** ===========================
 *  MappingPanel (UI) — wizard de mapare
 *  =========================== */
function MappingPanel({
    tables,
    selectedFile,
    onSelectFile,
    mapping,
    onChangeMapping,
}: {
    tables: ParsedTable[];
    selectedFile: string | null;
    onSelectFile: (f: string | null) => void;
    mapping: Record<KpiFieldKey, string | null>;
    onChangeMapping: (field: KpiFieldKey, col: string | null) => void;
}) {
    const fileOptions = tables.map((t) => t.filename);
    const active = tables.find((t) => t.filename === selectedFile) ?? null;

    const fieldGroups: Array<{ title: string; fields: Array<{ key: KpiFieldKey; label: string }> }> = [ 
        {
            title: "Operațional & Clinic",
            fields: [
                { key: "ICM", label: "ICM" },
                { key: "DMS", label: "DMS (durată medie)" },
                { key: "DMS_nat", label: "DMS – medie națională" },
            ],
        },
        {
            title: "P&L operațional",
            fields: [
                { key: "PL_venituri_CJAS_RON", label: "Venituri CJAS (RON)" },
                { key: "PL_alte_venituri_RON", label: "Alte venituri (RON)" },
                { key: "PL_salarii_RON", label: "Cheltuieli salarii (RON)" },
                { key: "PL_medicamente_RON", label: "Cheltuieli medicamente (RON)" },
                { key: "PL_materiale_RON", label: "Cheltuieli materiale sanitare (RON)" },
                { key: "PL_utilitati_RON", label: "Cheltuieli utilități (RON)" },
                { key: "PL_telecom_RON", label: "Cheltuieli telecom (RON)" },
                { key: "PL_piese_schimb_RON", label: "Cheltuieli piese de schimb (RON)" },
                { key: "PL_alte_cheltuieli_RON", label: "Alte cheltuieli (RON)" },
                // detaliu „Alte cheltuieli”
                { key: "PL_det_combustibil_RON", label: "— Combustibil (RON)" },
                { key: "PL_det_chirii_RON", label: "— Chirii (RON)" },
                { key: "PL_det_deplasari_RON", label: "— Deplasări (RON)" },
                { key: "PL_det_malpraxis_RON", label: "— Malpraxis (RON)" },
            ],
        },
        {
            title: "Contractare și Financiar",
            fields: [
                { key: "DRG_chir_pct", label: "% DRG chirurgical" },
                { key: "Rata_decontarii_pct", label: "Rata decontării %" },
                { key: "Subcontract_RON", label: "Sub contract (RON)" },
                { key: "Realizat_RON", label: "Realizat (RON)" },
                { key: "Facturat_RON", label: "Facturat (RON)" },
                { key: "Contractat_RON", label: "Contractat (RON)" },
                { key: "Salarii_pct", label: "Pondere salarii %" },
                { key: "Contributie_totala_RON", label: "Contribuție operațională totală (RON)" },
            ],
        },
        {
            title: "Servicii interne",
            fields: [
                { key: "ATI_cost_unit_RON", label: "ATI – cost unitar pe zi (RON)" },
                { key: "ATI_volum_zile", label: "ATI – volum (zile)" },
                { key: "BO_cost_minut_RON", label: "Bloc operator – cost pe minut (RON)" },
                { key: "BO_volum_minute", label: "Bloc operator – volum (minute)" },
                { key: "RAD_cost_investigatie_RON", label: "Radiologie/CT – cost pe investigație (RON)" },
                { key: "RAD_volum_investigatii", label: "Radiologie/CT – volum (nr investigații)" },
                { key: "STER_cost_ciclu_RON", label: "Sterilizare – cost pe ciclu (RON)" },
                { key: "STER_volum_cicluri", label: "Sterilizare – volum (nr cicluri)" },
            ],
        },
        {
            title: "UPU/CPU",
            fields: [
                { key: "UPU_cost_caz_RON", label: "UPU – cost mediu pe caz (RON)" },
                { key: "UPU_struct_salarii_pct", label: "UPU – struct. salarii %" },
                { key: "UPU_struct_medicamente_pct", label: "UPU – struct. medicamente %" },
                { key: "UPU_struct_materiale_pct", label: "UPU – struct. materiale %" },
                { key: "UPU_struct_altele_pct", label: "UPU – struct. altele %" },
                { key: "UPU_venituri_neinternati_RON", label: "UPU – venituri/donații ne-internați (RON)" },
            ],
        },
        {
            title: "Calitate și Lichiditate",
            fields: [
                { key: "Invalidate_pct", label: "% cazuri invalidate" },
                { key: "Active_curente_RON", label: "Active circulante (RON)" },
                { key: "Furnizori_RON", label: "Furnizori (RON)" },
            ],
        },
    ];

    return (
        <div style={mapStyles.wrap}>
            <div style={mapStyles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>Mapare coloane → KPI</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Selectează fișierul și asociază coloane</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select
                        value={selectedFile ?? ""}
                        onChange={(e) => onSelectFile(e.target.value || null)}
                        style={mapStyles.select}
                    >
                        <option value="">(Alege fișier)</option>
                        {fileOptions.map((fn) => (
                            <option key={fn} value={fn}>{fn}</option>
                        ))}
                    </select>
                </div>
            </div>

            {active ? (
                <div style={mapStyles.grid}>
                    {fieldGroups.map((g) => (
                        <div key={g.title} style={mapStyles.card}>
                            <div style={mapStyles.cardHeader}>{g.title}</div>
                            <div style={mapStyles.cardBody}>
                                {g.fields.map((f) => (
                                    <label key={f.key} style={mapStyles.row}>
                                        <span style={mapStyles.rowLabel}>{f.label}</span>
                                        <select
                                            style={mapStyles.rowSelect}
                                            value={mapping[f.key] ?? ""}
                                            onChange={(e) => onChangeMapping(f.key, e.target.value || null)}
                                        >
                                            <option value="">(neatribuit)</option>
                                            {active.columns.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={mapStyles.placeholder}>Încarcă un fișier și selectează-l pentru mapare.</div>
            )}
        </div>
    );
}

const mapStyles: Record<string, React.CSSProperties> = {
    wrap: { marginTop: 10, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, background: "#fff" },
    header: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg, #fafafa, #fff)",
    },
    select: {
        appearance: "none",
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "linear-gradient(180deg, #fff, #fafafa)",
        fontWeight: 600,
        fontSize: 12,
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, padding: 10 },
    card: { border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, overflow: "hidden" },
    cardHeader: { padding: "8px 10px", background: "#fafafa", fontWeight: 800, fontSize: 12 },
    cardBody: { padding: 10, display: "flex", flexDirection: "column", gap: 8 },
    row: { display: "flex", alignItems: "center", gap: 8 },
    rowLabel: { width: 230, fontSize: 12, opacity: 0.8 },
    rowSelect: {
        flex: 1,
        padding: "6px 8px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
    },
    placeholder: { padding: 12, fontSize: 12, opacity: 0.7 },
};

/** ===========================
 *  Taburi secundare
 *  =========================== */
type TabKey = "servicii" | "upu" | "pl" | "flux";

function TabNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
    const tabs: { key: TabKey; label: string }[] = [
        { key: "servicii", label: "Servicii interne" },
        { key: "upu", label: "UPU/CPU" },
        { key: "pl", label: "Structură venituri și cheltuieli (P&L)" },
        { key: "flux", label: "Flux financiar și risc" },
    ];
    return (
        <nav style={styles.tabs}>
            {tabs.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    onClick={() => onChange(t.key)}
                    style={{ ...styles.tabBtn, ...(active === t.key ? styles.tabBtnActive : {}) }}
                >
                    {t.label}
                </button>
            ))}
        </nav>
    );
}

function ServiciiInterneSection({
    data,
}: {
    data: {
        atiCostUnit: number; atiVolumZile: number;
        boCostMinut: number; boVolumMinute: number;
        radCostInvest: number; radVolum: number;
        sterCostCiclu: number; sterVolum: number;
    };
}) {
    const cards: KpiModel[] = [
        {
            key: "ati_unit",
            title: "ATI – cost unitar pe zi",
            value: fmtRON(data.atiCostUnit),
            subtitle: `volum: ${isFinite(data.atiVolumZile) ? Math.round(data.atiVolumZile).toLocaleString("ro-RO") + " zile" : "–"}`,
            badge: isFinite(data.atiCostUnit) ? "ok" : null,
            glossaryKey: "Servicii interne",
        },
        {
            key: "bo_unit",
            title: "Bloc operator – cost pe minut",
            value: fmtRON(data.boCostMinut),
            subtitle: `volum: ${isFinite(data.boVolumMinute) ? Math.round(data.boVolumMinute).toLocaleString("ro-RO") + " minute" : "–"}`,
            badge: isFinite(data.boCostMinut) ? "warn" : null,
            glossaryKey: "Servicii interne",
        },
        {
            key: "rad_unit",
            title: "Radiologie/CT – cost pe investigație",
            value: fmtRON(data.radCostInvest),
            subtitle: `volum: ${isFinite(data.radVolum) ? Math.round(data.radVolum).toLocaleString("ro-RO") + " investigații" : "–"}`,
            badge: isFinite(data.radCostInvest) ? "ok" : null,
            glossaryKey: "Servicii interne",
        },
        {
            key: "ster_unit",
            title: "Sterilizare – cost pe ciclu",
            value: fmtRON(data.sterCostCiclu),
            subtitle: `volum: ${isFinite(data.sterVolum) ? Math.round(data.sterVolum).toLocaleString("ro-RO") + " cicluri" : "–"}`,
            badge: isFinite(data.sterCostCiclu) ? "warn" : null,
            glossaryKey: "Servicii interne",
        },
    ];

    return (
        <Section title="Servicii interne – costuri unitare și volum">
            <div style={styles.kpiGrid}>
                {cards.map(({ key: _key, ...rest }) => (
                    <KpiCard key={_key} {...rest} />
                ))}
            </div>
        </Section>
    );
}

function UpuCpuSection({
    data,
}: {
    data: {
        costCaz: number;
        structSalarii: number;
        structMedicamente: number;
        structMateriale: number;
        structAltele: number;
        venituriNeinternati: number;
    };
}) {
    const structText = [
        isFinite(data.structSalarii) ? `Sal. ${data.structSalarii.toFixed(0)}%` : null,
        isFinite(data.structMedicamente) ? `Med. ${data.structMedicamente.toFixed(0)}%` : null,
        isFinite(data.structMateriale) ? `Mat. ${data.structMateriale.toFixed(0)}%` : null,
        isFinite(data.structAltele) ? `Altele ${data.structAltele.toFixed(0)}%` : null,
    ].filter(Boolean).join(" • ") || "–";

    const cards: KpiModel[] = [
        {
            key: "upu_cost",
            title: "UPU – cost mediu pe caz",
            value: fmtRON(data.costCaz),
            subtitle: isFinite(data.venituriNeinternati) ? `venituri/donații: ${fmtRON(data.venituriNeinternati)}` : undefined,
            badge: toneUpuCost(data.costCaz),
            glossaryKey: "UPU – cost mediu pe caz",
        },
        {
            key: "upu_struct",
            title: "Structură cheltuieli UPU",
            value: structText,
            subtitle: "pacienți ne-internați",
            badge: null,
            glossaryKey: "Structură cheltuieli UPU",
        },
    ];

    return (
        <Section title="UPU / CPU">
            <div style={styles.kpiGridSmall}>
                {cards.map(({ key: _key, ...rest }) => (
                    <KpiCard key={_key} {...rest} />
                ))}
            </div>
        </Section>
    );
}

function PlSection({
    data,
}: {
    data: {
        venituriTotale: number; venituriCJAS: number; alteVenituri: number;
        cheltTotale: number; salarii: number; medicamente: number; materiale: number;
        utilitati: number; telecom: number; pieseSchimb: number; alteCheltuieli: number;
        rezultatOper: number;
        detCombustibil: number; detChirii: number; detDeplasari: number; detMalpraxis: number; detRemainder: number;
        pctSalarii: number; pctMedicamente: number; pctMateriale: number; pctUtilitati: number; pctTelecom: number; pctPiese: number; pctAlte: number;
    };
}) {
    const headCards: KpiModel[] = [
        { key: "venituri", title: "Venituri totale", value: fmtRON(data.venituriTotale), subtitle: `CJAS: ${fmtRON(data.venituriCJAS)} • Alte: ${fmtRON(data.alteVenituri)}` },
        { key: "chelt", title: "Cheltuieli totale", value: fmtRON(data.cheltTotale), subtitle: "operațional" },
        { key: "rez", title: "Rezultat operațional", value: fmtRON(data.rezultatOper), badge: isFinite(data.rezultatOper) ? (data.rezultatOper >= 0 ? "ok" : "danger") : null },
    ];

    const structCards: KpiModel[] = [
        { key: "p_sal", title: "Salarii din total cheltuieli", value: fmtPct(data.pctSalarii) },
        { key: "p_med", title: "Medicamente din total cheltuieli", value: fmtPct(data.pctMedicamente) },
        { key: "p_mat", title: "Materiale sanitare din total cheltuieli", value: fmtPct(data.pctMateriale) },
        { key: "p_util", title: "Utilități din total cheltuieli", value: fmtPct(data.pctUtilitati) },
        { key: "p_tel", title: "Telecom din total cheltuieli", value: fmtPct(data.pctTelecom) },
        { key: "p_piese", title: "Piese de schimb din total cheltuieli", value: fmtPct(data.pctPiese) },
        { key: "p_alte", title: "Alte cheltuieli din total cheltuieli", value: fmtPct(data.pctAlte) },
    ];

    return (
        <>
            <Section title="P&L operațional – sumar">
                <div style={styles.kpiGrid}>
                    {headCards.map(({ key: _key, ...rest }) => <KpiCard key={_key} {...rest} />)}
                </div>
            </Section>

            <Section title="Structură cheltuieli (ponderi)">
                <div style={styles.kpiGrid}>
                    {structCards.map(({ key: _key, ...rest }) => <KpiCard key={_key} {...rest} />)}
                </div>
            </Section>

            <Section title="Alte cheltuieli – detaliu">
                <BigCard title="Drill-down Alte cheltuieli">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                        <Stat label="Combustibil" value={fmtRON(data.detCombustibil)} />
                        <Stat label="Chirii" value={fmtRON(data.detChirii)} />
                        <Stat label="Deplasări" value={fmtRON(data.detDeplasari)} />
                        <Stat label="Malpraxis" value={fmtRON(data.detMalpraxis)} />
                        <Stat label="Rest alte cheltuieli" value={fmtRON(data.detRemainder)} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                        Suma detaliilor ar trebui să fie ≤ „Alte cheltuieli” totale. Dacă depășește, verifică maparea coloanelor.
                    </div>
                </BigCard>
            </Section>
        </>
    );
}
function FluxFinanciar({
    kpiData, year, quarter, thresholds, setThresholds
}: {
    kpiData: any;
    year: string;
    quarter: string;
    thresholds: Thresholds;
    setThresholds: React.Dispatch<React.SetStateAction<Thresholds>>;
}) {
    const y = Number(year);
    const days = daysInQuarter(isFinite(y) ? y : new Date().getFullYear(), quarter);

    // --- Working Capital & Current Ratio ---
    const active = isFinite(kpiData.active) ? kpiData.active : NaN;
    const furni = isFinite(kpiData.furnizori) ? kpiData.furnizori : NaN;
    const wcRON = (isFinite(active) && isFinite(furni)) ? (active - furni) : NaN;
    const currRatio = (isFinite(active) && isFinite(furni) && furni !== 0) ? (active / furni) : NaN;

    // badge risc pe baza lichidității (similar cu cardul din stânga)
    const riscFlux: Tone = isFinite(currRatio)
        ? (currRatio >= thresholds.currentRatio.okGE
            ? "ok"
            : (currRatio >= thresholds.currentRatio.dangerLT ? "warn" : "danger"))
        : null;

    // --- DPO (Days Payable Outstanding) ---
    const pl = kpiData.pl ?? {};
    const cogs = [pl.materiale, pl.medicamente, pl.pieseSchimb]
        .map((v: number) => (isFinite(v) ? v : 0))
        .reduce((a: number, b: number) => a + b, 0);
    const dailyPurch = (isFinite(cogs) && days > 0) ? (cogs / days) : NaN;
    const dpo = (isFinite(furni) && isFinite(dailyPurch) && dailyPurch > 0) ? Math.round(furni / dailyPurch) : NaN;

    // --- DSO (Days Sales Outstanding) ---
    const venitTot = isFinite(pl.venituriTotale) ? pl.venituriTotale : NaN;
    const dailyRev = (isFinite(venitTot) && days > 0) ? (venitTot / days) : NaN;
    const creante = isFinite(kpiData.creanteClienti) ? kpiData.creanteClienti : NaN;
    const dso = (isFinite(creante) && isFinite(dailyRev) && dailyRev > 0) ? Math.round(creante / dailyRev) : NaN;

    // --- badge-uri bazate pe praguri din Admin ---
    const dpoBadge: Tone = isFinite(dpo)
        ? (dpo > thresholds.dpo.dangerGT ? "danger" : (dpo > thresholds.dpo.warnGT ? "warn" : "ok"))
        : null;

    const dsoBadge: Tone = isFinite(dso)
        ? (dso > thresholds.dso.dangerGT ? "danger" : (dso > thresholds.dso.warnGT ? "warn" : "ok"))
        : null;

    const cards: KpiModel[] = [
        {
            key: "wc", title: "Working Capital", value: isFinite(wcRON) ? fmtRON(wcRON) : "–",
            subtitle: isFinite(currRatio) ? `Current Ratio: ${currRatio.toFixed(2)}` : "–",
            badge: riscFlux, glossaryKey: "Active circulante vs. Furnizori",
        },
        {
            key: "dpo", title: "DPO (zile de plată)", value: isFinite(dpo) ? `${dpo} zile` : "–",
            subtitle: "approx. pe baza chelt. materiale/medicamente/piese",
            badge: dpoBadge, glossaryKey: "Flux financiar și risc",
        },
        {
            key: "dso", title: "DSO (zile de încasare)", value: isFinite(dso) ? `${dso} zile` : "–",
            subtitle: isFinite(dso)
                ? `venit/zi ~ ${isFinite(dailyRev) ? fmtRON(dailyRev) : "–"}`
                : "mapați „Creante_clienti_RON” pentru DSO",
            badge: dsoBadge, glossaryKey: "Flux financiar și risc",
        },
    ];

    // --- Mini Admin praguri (toggle) ---
    const [showAdmin, setShowAdmin] = React.useState(false);
    const adminBox: React.CSSProperties = {
        display: showAdmin ? "grid" : "none",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        padding: 10,
        border: "1px dashed rgba(0,0,0,0.15)",
        borderRadius: 10,
        background: "#fff",
        marginBottom: 8,
    };

    function Num({
        label, value, onChange
    }: { label: string; value: number; onChange: (n: number) => void }) {
        return (
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                <span style={{ opacity: .7 }}>{label}</span>
                <input
                    type="number"
                    value={Number.isFinite(value) ? value : 0}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    style={{ padding: "8px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 700 }}
                    step="0.01"
                />
            </label>
        );
    }

    return (
        <Section title="Flux financiar și risc – DSO / DPO / Working Capital">
            <button
                onClick={() => setShowAdmin((s) => !s)}
                style={{
                    marginBottom: 8, padding: "6px 10px", borderRadius: 999,
                    border: "1px solid rgba(0,0,0,.12)", background: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}
            >
                {showAdmin ? "Ascunde praguri" : "Admin – Setări praguri"}
            </button>

            <div style={adminBox}>
                <Num label="Current Ratio – ok ≥"
                    value={thresholds.currentRatio.okGE}
                    onChange={(v) => setThresholds(t => ({ ...t, currentRatio: { ...t.currentRatio, okGE: v } }))} />
                <Num label="Current Ratio – warn <"
                    value={thresholds.currentRatio.warnLT}
                    onChange={(v) => setThresholds(t => ({ ...t, currentRatio: { ...t.currentRatio, warnLT: v } }))} />
                <Num label="Current Ratio – danger <"
                    value={thresholds.currentRatio.dangerLT}
                    onChange={(v) => setThresholds(t => ({ ...t, currentRatio: { ...t.currentRatio, dangerLT: v } }))} />

                <Num label="DSO – warn >"
                    value={thresholds.dso.warnGT}
                    onChange={(v) => setThresholds(t => ({ ...t, dso: { ...t.dso, warnGT: v } }))} />
                <Num label="DSO – danger >"
                    value={thresholds.dso.dangerGT}
                    onChange={(v) => setThresholds(t => ({ ...t, dso: { ...t.dso, dangerGT: v } }))} />

                <Num label="DPO – warn >"
                    value={thresholds.dpo.warnGT}
                    onChange={(v) => setThresholds(t => ({ ...t, dpo: { ...t.dpo, warnGT: v } }))} />
                <Num label="DPO – danger >"
                    value={thresholds.dpo.dangerGT}
                    onChange={(v) => setThresholds(t => ({ ...t, dpo: { ...t.dpo, dangerGT: v } }))} />
            </div>

            <div style={styles.kpiGrid}>
                {cards.map(({ key: _key, ...rest }) => (
                    <KpiCard key={_key} {...rest} />
                ))}
            </div>
        </Section>
    );
}

/** ===========================
 *  Select simplu (UI)
 *  =========================== */
function Select({
    value,
    onChange,
    label,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    options: string[];
}) {
    return (
        <label style={styles.selectLabel}>
            <span style={styles.selectSpan}>{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={styles.select}
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </label>
    );
}

/** ===========================
 *  STYLES
 *  =========================== */
const styles: Record<string, React.CSSProperties> = {
    page: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
    headerLeft: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
    headerRight: { display: "flex", alignItems: "center", gap: 12 },
    h1: { fontSize: 22, fontWeight: 800, margin: 0 },
    h2: { fontSize: 16, fontWeight: 800, margin: 0 },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    filters: { display: "flex", gap: 10, flexWrap: "wrap" },
    selectLabel: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12 },
    selectSpan: { opacity: 0.7 },
    select: {
        appearance: "none",
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "linear-gradient(180deg, #fff, #fafafa)",
        fontWeight: 600,
    },
    tabs: { display: "flex", gap: 8 },
    tabBtn: {
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
    },
    tabBtnActive: { background: "linear-gradient(180deg, #f0f7ff, #fff)", borderColor: "rgba(45,125,246,0.35)", boxShadow: "0 1px 6px rgba(45,125,246,0.25)" },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 },
    kpiGridSmall: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 },
    kpiGridOne: { display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 10 },
    twoCols: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 10 },
    leftCol: { minWidth: 320 },
    rightCol: {},
    scoreGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 },
    linkBtn: {
        border: "none",
        background: "transparent",
        textDecoration: "underline",
        color: "#2563eb",
        cursor: "pointer",
        fontWeight: 700,
        padding: 0,
    },
    smallBtn: {
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
    },
};

const cardStyles: Record<string, React.CSSProperties> = {
    card: {
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 114,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg, #fafafa, #fff)",
        gap: 8,
    },
    title: { fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
    body: { padding: "8px 12px" },
    value: { fontSize: 24, fontWeight: 800 },
    subtitle: { marginTop: 4, fontSize: 12, opacity: 0.7 },
    footer: { padding: "8px 12px", fontSize: 11, opacity: 0.8, borderTop: "1px dashed rgba(0,0,0,0.06)" },
};

const bigCardStyles: Record<string, React.CSSProperties> = {
    card: {
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 220,
        height: "100%",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg, #fafafa, #fff)",
        gap: 8,
    },
    title: { fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
    body: { padding: 12, display: "flex", flexDirection: "column", gap: 8 },
    footer: { padding: "8px 12px", fontSize: 11, opacity: 0.8, borderTop: "1px dashed rgba(0,0,0,0.06)" },
};

const scoreCardStyles: Record<string, React.CSSProperties> = {
    card: {
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg, #fafafa, #fff)",
        gap: 8,
    },
    title: { fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
    grid: {
        padding: 10,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 8,
    },
    footer: { padding: "8px 10px", borderTop: "1px dashed rgba(0,0,0,0.06)", display: "flex", justifyContent: "flex-end" },
};
