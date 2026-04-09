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
import { useOrg } from '@/lib/context/OrgContext';

ChartJS.register(
    CategoryScale, LinearScale, RadialLinearScale,
    PointElement, LineElement, BarElement,
    Filler, Tooltip, Legend
);

/* ==================== TIPURI ==================== */
type OrgType = 'companie' | 'institutie_publica' | 'spital';

type KPI = {
    key: string;
    label: string;
    category: string;
    unit?: string;
    isPct?: boolean;
    derived?: boolean;
    forTypes?: OrgType[];
};

type Threshold =
    | { type: "higher"; green: number; yellow: number }
    | { type: "lower"; green: number; yellow: number }
    | { type: "band"; greenMin: number; greenMax: number; yellowMin: number; yellowMax: number };

/* ==================== KPI DEFINITIONS ==================== */
const ALL_KPIS: KPI[] = [

    /* -------- VENITURI -------- */
    { key: "venituri_totale",        label: "Venituri totale",              category: "Venituri", unit: "Lei" },
    { key: "venituri_private",       label: "Venituri servicii private",    category: "Venituri", unit: "Lei",  forTypes: ['companie', 'spital'] },
    { key: "venituri_cnas_pct",      label: "% venituri CNAS",             category: "Venituri", isPct: true,  forTypes: ['spital'] },
    { key: "subventii",              label: "Subvenții / transferuri",      category: "Venituri", unit: "Lei",  forTypes: ['institutie_publica', 'spital'] },
    { key: "venituri_granturi",      label: "Venituri granturi / fonduri",  category: "Venituri", unit: "Lei",  forTypes: ['institutie_publica'] },
    { key: "venituri_proprii_pct",   label: "% venituri proprii din total", category: "Venituri", isPct: true,  forTypes: ['institutie_publica'], derived: true },

    /* -------- CHELTUIELI -------- */
    { key: "cheltuieli_totale",        label: "Cheltuieli totale",               category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_personal_abs",  label: "Cheltuieli personal",             category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_personal_pct",  label: "% cheltuieli personal",           category: "Cheltuieli", isPct: true, derived: true },
    { key: "cheltuieli_utilitati",     label: "Utilități",                       category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_energie",       label: "Energie (abs.)",                  category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_echip_ment",    label: "Echipamente + mentenanță",        category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_admin_it",      label: "Administrative și IT",            category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_directe",       label: "Cheltuieli cu valoare adăugată",  category: "Cheltuieli", unit: "Lei" },
    { key: "cheltuieli_medicamente",   label: "Medicamente",                     category: "Cheltuieli", unit: "Lei", forTypes: ['spital'] },
    { key: "cheltuieli_materiale",     label: "Materiale sanitare",              category: "Cheltuieli", unit: "Lei", forTypes: ['spital'] },

    /* -------- EFICIENȚĂ -------- */
    { key: "cost_pacient",         label: "Cost mediu / client",          category: "Eficiență", unit: "Lei", forTypes: ['companie', 'spital'] },
    { key: "cost_per_beneficiar",  label: "Cost mediu / beneficiar",      category: "Eficiență", unit: "Lei", forTypes: ['institutie_publica'] },
    { key: "venit_pacient",        label: "Venit mediu / client",         category: "Eficiență", unit: "Lei", forTypes: ['companie', 'spital'] },
    { key: "cost_caz_drg",         label: "Cost mediu / caz DRG",         category: "Eficiență", unit: "Lei", forTypes: ['spital'] },
    { key: "cost_zi_spitalizare",  label: "Cost / zi spitalizare",        category: "Eficiență", unit: "Lei", forTypes: ['spital'], derived: true },
    { key: "rap_admin_medical",    label: "Chelt. admin / operaționale",  category: "Eficiență" },

    /* -------- LICHIDITATE / ÎNDATORARE -------- */
    { key: "lichiditate_curenta",  label: "Lichiditate curentă",         category: "Lichiditate / Îndatorare" },
    { key: "grad_indatorare",      label: "Grad de îndatorare",          category: "Lichiditate / Îndatorare" },
    { key: "autonomie_fin",        label: "Autonomie financiară",        category: "Lichiditate / Îndatorare" },
    { key: "zile_incasare",        label: "Zile medii încasare (DSO)",   category: "Lichiditate / Îndatorare", derived: true },
    { key: "zile_plata",           label: "Zile medii plată (DPO)",      category: "Lichiditate / Îndatorare", derived: true },
    { key: "ccc",                  label: "Cash Conversion Cycle (CCC)", category: "Lichiditate / Îndatorare", derived: true },

    /* -------- REZULTAT / CASHFLOW -------- */
    { key: "rezultat_operational", label: "Rezultat operațional",  category: "Rezultat / Cashflow", unit: "Lei" },
    { key: "marja_operationala",   label: "Marjă operațională",    category: "Rezultat / Cashflow", derived: true },
    { key: "rezultat_net",         label: "Rezultat net",          category: "Rezultat / Cashflow", unit: "Lei" },
    { key: "cashflow_operational", label: "Cashflow operațional",  category: "Rezultat / Cashflow", unit: "Lei" },

    /* -------- CLINIC-FINANCIAR (doar spital) -------- */
    { key: "ocupare_paturi_pct",  label: "Rata ocupare paturi %",     category: "Clinic-financiar", isPct: true, forTypes: ['spital'] },
    { key: "icm",                 label: "Indice complexitate (ICM)", category: "Clinic-financiar",             forTypes: ['spital'] },
    { key: "cazuri_decontate",    label: "Cazuri decontate",          category: "Clinic-financiar",             forTypes: ['spital'] },
    { key: "valoare_medie_caz",   label: "Valoare medie / caz",       category: "Clinic-financiar", unit: "Lei", forTypes: ['spital'] },
    { key: "zile_spitalizare",    label: "Zile de spitalizare",       category: "Clinic-financiar",             forTypes: ['spital'] },
    { key: "pat_zile",            label: "Pat-zile",                  category: "Clinic-financiar",             forTypes: ['spital'] },

    /* -------- 3E – ECONOMICITATE -------- */
    { key: "dpo",                         label: "DPO (Zile medii plată)",         category: "3E – Economicitate", derived: true },
    { key: "abatere_exec_buget_pct",      label: "Abatere execuție vs buget (%)",  category: "3E – Economicitate", isPct: true, derived: true },
    { key: "discount_capturat_pct",       label: "Discount capturat (%)",          category: "3E – Economicitate", isPct: true, derived: true, forTypes: ['companie', 'spital'] },
    { key: "grad_absorbtie_fonduri_pct",  label: "Grad absorbție fonduri (%)",     category: "3E – Economicitate", isPct: true, derived: true, forTypes: ['institutie_publica'] },
    { key: "cost_per_beneficiar_3e",      label: "Cost mediu / beneficiar",        category: "3E – Economicitate", unit: "Lei", forTypes: ['institutie_publica'] },

    /* -------- 3E – EFICIENȚĂ -------- */
    { key: "zile_stoc",            label: "Rotația stocurilor (zile)",            category: "3E – Eficiență", derived: true, forTypes: ['companie', 'spital'] },
    { key: "utilizare_active",     label: "Utilizare active (Venituri/Active)",   category: "3E – Eficiență", derived: true },
    { key: "cost_energie_pat_zi",  label: "Cost energie / pat-zi",               category: "3E – Eficiență", unit: "Lei", derived: true, forTypes: ['spital'] },
    { key: "cost_functionar_luna", label: "Cost mediu / angajat / lună",         category: "3E – Eficiență", unit: "Lei", derived: true, forTypes: ['institutie_publica'] },
    { key: "venituri_proprii_3e",  label: "% venituri proprii din total",        category: "3E – Eficiență", isPct: true, derived: true, forTypes: ['institutie_publica'] },

    /* -------- 3E – EFICACITATE -------- */
    { key: "rezultat_operational_vs_buget_pct",  label: "Rezultat operațional vs buget (%)",      category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "pondere_valoare_adaugata_pct",        label: "Chelt. cu valoare adăugată / total (%)", category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "economii_improvement",                label: "Economii din proiecte de îmbunătățire",  category: "3E – Eficacitate", unit: "Lei" },
    { key: "cost_neconformitate_pct",             label: "Cost neconformitate / venituri (%)",     category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "penalitati_pct",                      label: "Penalități / venituri (%)",              category: "3E – Eficacitate", isPct: true, derived: true },
    { key: "roi_proiecte_pct",                    label: "ROI proiecte (%)",                       category: "3E – Eficacitate", isPct: true, derived: true, forTypes: ['companie', 'spital'] },
    { key: "incasare_vs_contract_cas_pct",        label: "Încasare vs contract CAS (%)",           category: "3E – Eficacitate", isPct: true, derived: true, forTypes: ['spital'] },
    { key: "rata_solutionare_petitii_pct",        label: "Petiții soluționate în termen (%)",      category: "3E – Eficacitate", isPct: true, forTypes: ['institutie_publica'] },
    { key: "proiecte_finalizate_la_termen_pct",   label: "Proiecte finalizate la termen (%)",      category: "3E – Eficacitate", isPct: true, forTypes: ['institutie_publica'] },

    /* -------- SUSTENABILITATE -------- */
    { key: "emisii_co2_tone",          label: "Emisii CO₂ (tone)",              category: "Sustenabilitate", unit: "tone" },
    { key: "consum_energie_mwh",       label: "Consum energie (MWh)",           category: "Sustenabilitate", unit: "MWh" },
    { key: "consum_apa_mc",            label: "Consum apă (m³)",               category: "Sustenabilitate", unit: "m³" },
    { key: "deseuri_reciclate_pct",    label: "Deșeuri reciclate (%)",         category: "Sustenabilitate", isPct: true },
    { key: "angajati_formati_pct",     label: "Angajați cu training (%)",      category: "Sustenabilitate", isPct: true },
    { key: "incidente_ssm",            label: "Accidente muncă (nr.)",         category: "Sustenabilitate" },
    { key: "femei_management_pct",     label: "Femei în management (%)",       category: "Sustenabilitate", isPct: true },
    { key: "furnizori_locali_pct",     label: "Furnizori locali (%)",          category: "Sustenabilitate", isPct: true },
    { key: "satisfactie_clienti_pct",  label: "Satisfacție clienți / NPS (%)", category: "Sustenabilitate", isPct: true },
    { key: "deseuri_medicale_tone",    label: "Deșeuri medicale (tone)",       category: "Sustenabilitate", unit: "tone", forTypes: ['spital'] },
    { key: "infectii_nosocomiale_pct", label: "Infecții nosocomiale (%)",      category: "Sustenabilitate", isPct: true,  forTypes: ['spital'] },

    /* -------- ILUMINAT STRADAL (doar instituție) -------- */
    { key: "puncte_iluminat_total",        label: "Puncte de iluminat (nr.)",        category: "Iluminat stradal", forTypes: ['institutie_publica'] },
    { key: "consum_energie_iluminat_mwh",  label: "Consum energie iluminat (MWh)",   category: "Iluminat stradal", unit: "MWh",  forTypes: ['institutie_publica'] },
    { key: "cost_kwh_iluminat",            label: "Cost mediu / kWh iluminat (Lei)", category: "Iluminat stradal", unit: "Lei",  forTypes: ['institutie_publica'], derived: true },
    { key: "grad_modernizare_led_pct",     label: "Corpuri LED din total (%)",       category: "Iluminat stradal", isPct: true,  forTypes: ['institutie_publica'] },
    { key: "avarii_iluminat_luna",         label: "Avarii / lună (nr.)",            category: "Iluminat stradal", forTypes: ['institutie_publica'] },

    /* -------- POLIȚIE LOCALĂ (doar instituție) -------- */
    { key: "agenti_activi",               label: "Agenți activi (nr.)",             category: "Poliție locală", forTypes: ['institutie_publica'] },
    { key: "interventii_luna",            label: "Intervenții / lună (nr.)",        category: "Poliție locală", forTypes: ['institutie_publica'] },
    { key: "timp_mediu_interventie_min",  label: "Timp mediu intervenție (min.)",   category: "Poliție locală", forTypes: ['institutie_publica'] },
    { key: "amenzi_aplicate_luna",        label: "Amenzi aplicate / lună (nr.)",    category: "Poliție locală", forTypes: ['institutie_publica'] },
    { key: "valoare_amenzi_lei",          label: "Valoare amenzi încasate (Lei)",   category: "Poliție locală", unit: "Lei", forTypes: ['institutie_publica'] },

    /* -------- SALUBRIZARE (doar instituție) -------- */
    { key: "tone_deseuri_colectate",       label: "Deșeuri colectate (tone)",   category: "Salubrizare", unit: "tone", forTypes: ['institutie_publica'] },
    { key: "grad_acoperire_colectare_pct", label: "Gospodării racordate (%)",   category: "Salubrizare", isPct: true,  forTypes: ['institutie_publica'] },
    { key: "tone_reciclate",               label: "Tone reciclate",             category: "Salubrizare", unit: "tone", forTypes: ['institutie_publica'] },
    { key: "rata_reciclare_pct",           label: "Rată reciclare (%)",        category: "Salubrizare", isPct: true,  forTypes: ['institutie_publica'], derived: true },
    { key: "cost_tona_colectata",          label: "Cost mediu / tonă (Lei)",    category: "Salubrizare", unit: "Lei",  forTypes: ['institutie_publica'], derived: true },
    { key: "reclamatii_salubrizare",       label: "Reclamații / lună (nr.)",   category: "Salubrizare", forTypes: ['institutie_publica'] },
];

/* ==================== PRAGURI ==================== */
const THRESHOLDS: Record<string, Threshold> = {
    zile_incasare:                       { type: "lower",  green: 30,   yellow: 45 },
    zile_plata:                          { type: "band",   greenMin: 30, greenMax: 45, yellowMin: 20, yellowMax: 60 },
    dpo:                                 { type: "band",   greenMin: 30, greenMax: 45, yellowMin: 20, yellowMax: 60 },
    ccc:                                 { type: "lower",  green: 30,   yellow: 45 },
    zile_stoc:                           { type: "lower",  green: 30,   yellow: 45 },
    cost_energie_pat_zi:                 { type: "lower",  green: 20,   yellow: 30 },
    cost_zi_spitalizare:                 { type: "lower",  green: 900,  yellow: 1100 },
    incasare_vs_contract_cas_pct:        { type: "higher", green: 98,   yellow: 95 },
    rezultat_operational_vs_buget_pct:   { type: "higher", green: 100,  yellow: 95 },
    pondere_valoare_adaugata_pct:        { type: "higher", green: 60,   yellow: 50 },
    cost_neconformitate_pct:             { type: "lower",  green: 0.5,  yellow: 1.0 },
    penalitati_pct:                      { type: "lower",  green: 0.1,  yellow: 0.5 },
    discount_capturat_pct:               { type: "higher", green: 80,   yellow: 50 },
    roi_proiecte_pct:                    { type: "higher", green: 20,   yellow: 10 },
    utilizare_active:                    { type: "higher", green: 1.5,  yellow: 1.0 },
    abatere_exec_buget_pct:              { type: "lower",  green: 2,    yellow: 5 },
    grad_absorbtie_fonduri_pct:          { type: "higher", green: 90,   yellow: 75 },
    rata_solutionare_petitii_pct:        { type: "higher", green: 95,   yellow: 80 },
    proiecte_finalizate_la_termen_pct:   { type: "higher", green: 90,   yellow: 75 },
    deseuri_reciclate_pct:               { type: "higher", green: 50,   yellow: 30 },
    angajati_formati_pct:                { type: "higher", green: 80,   yellow: 60 },
    incidente_ssm:                       { type: "lower",  green: 0,    yellow: 2 },
    femei_management_pct:                { type: "higher", green: 40,   yellow: 25 },
    infectii_nosocomiale_pct:            { type: "lower",  green: 1,    yellow: 3 },
    rata_reciclare_pct:                  { type: "higher", green: 50,   yellow: 30 },
    timp_mediu_interventie_min:          { type: "lower",  green: 10,   yellow: 20 },
    grad_modernizare_led_pct:            { type: "higher", green: 80,   yellow: 50 },
    ocupare_paturi_pct:                  { type: "band",   greenMin: 75, greenMax: 90, yellowMin: 60, yellowMax: 95 },
};

/* ==================== UTILITARE ==================== */
const monthsLabels  = (): string[] => ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Noi","Dec"];
const quartersLabels = (): string[] => ["T1","T2","T3","T4"];
const yearsLabels   = (start = 2023, n = 3): string[] => Array.from({ length: n }, (_, i) => String(start + i));

const MONTH_NAMES_RO   = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','noi','dec'];
const MONTH_NAMES_FULL = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];

const avg        = (arr: number[]) => Number((arr.reduce((a, b) => a + b, 0) / (arr.length || 1)).toFixed(2));
const toQuarterly = (arr: number[]) => [0, 3, 6, 9].map((i) => avg(arr.slice(i, i + 3)));
const toYearly   = (arr: number[]) => [avg(arr.slice(0, 12))];
const EPS        = 1e-6;
const safeDiv    = (a: number, b: number) => (Math.abs(b) < EPS ? 0 : a / b);

/* ==================== CALCULE DERIVATE ==================== */
const computeDerived: Record<string, (get: (k: string) => number[] | undefined) => number[] | undefined> = {
    cheltuieli_personal_pct: (get) => {
        const per = get("cheltuieli_personal_abs"); const tot = get("cheltuieli_totale");
        if (!per || !tot) return undefined;
        return per.map((p, i) => Number((safeDiv(p, Math.max(tot[i], EPS)) * 100).toFixed(2)));
    },
    venituri_proprii_pct: (get) => {
        const vp = get("venituri_proprii"); const vt = get("venituri_totale");
        if (!vp || !vt) return undefined;
        return vp.map((v, i) => Number((safeDiv(v, Math.max(vt[i], EPS)) * 100).toFixed(2)));
    },
    venituri_proprii_3e: (get) => computeDerived["venituri_proprii_pct"](get),
    marja_operationala: (get) => {
        const rez = get("rezultat_operational"); const ven = get("venituri_totale");
        if (!rez || !ven) return undefined;
        return rez.map((r, i) => Number((safeDiv(r, Math.max(ven[i], EPS)) * 100).toFixed(2)));
    },
    zile_incasare: (get) => {
        const crean = get("creante"); const venit = get("venituri_totale");
        if (!crean || !venit) return undefined;
        return crean.map((c, i) => Number((safeDiv(c, safeDiv(venit[i], 30))).toFixed(2)));
    },
    zile_plata: (get) => {
        const datorii = get("datorii_comerciale");
        const achiz   = get("achizitii") ?? get("cheltuieli_totale");
        if (!datorii || !achiz) return undefined;
        return datorii.map((d, i) => Number((safeDiv(d, safeDiv(achiz[i], 30))).toFixed(2)));
    },
    dpo: (get) => computeDerived["zile_plata"](get),
    zile_stoc: (get) => {
        const stoc = get("stoc_mediu"); const consum = get("consum_lunar");
        if (!stoc || !consum) return undefined;
        return stoc.map((s, i) => Number((safeDiv(s, safeDiv(consum[i], 30))).toFixed(2)));
    },
    ccc: (get) => {
        const dso = computeDerived["zile_incasare"](get);
        const zs  = computeDerived["zile_stoc"](get);
        const dpo = computeDerived["zile_plata"](get);
        if (!dso || !zs || !dpo) return undefined;
        return dso.map((v, i) => Number((v + zs[i] - dpo[i]).toFixed(2)));
    },
    cost_zi_spitalizare: (get) => {
        const che = get("cheltuieli_totale"); const zile = get("zile_spitalizare");
        if (!che || !zile) return undefined;
        return che.map((c, i) => Number((safeDiv(c, Math.max(zile[i], EPS))).toFixed(2)));
    },
    cost_energie_pat_zi: (get) => {
        const en = get("cheltuieli_energie"); const patz = get("pat_zile");
        if (!en || !patz) return undefined;
        return en.map((e, i) => Number((safeDiv(e, Math.max(patz[i], EPS))).toFixed(2)));
    },
    cost_functionar_luna: (get) => {
        const sal = get("cheltuieli_personal_abs"); const ang = get("numar_angajati");
        if (!sal || !ang) return undefined;
        return sal.map((s, i) => Number((safeDiv(s, Math.max(ang[i], EPS))).toFixed(2)));
    },
    utilizare_active: (get) => {
        const ven = get("venituri_totale"); const act = get("active_nete");
        if (!ven || !act) return undefined;
        return ven.map((v, i) => Number((safeDiv(v, Math.max(act[i], EPS))).toFixed(2)));
    },
    grad_absorbtie_fonduri_pct: (get) => {
        const abs = get("fonduri_absorbite"); const aloc = get("fonduri_alocate");
        if (!abs || !aloc) return undefined;
        return abs.map((x, i) => Number((safeDiv(x, Math.max(aloc[i], EPS)) * 100).toFixed(2)));
    },
    incasare_vs_contract_cas_pct: (get) => {
        const inc = get("incasat_cas"); const con = get("contract_cas");
        if (!inc || !con) return undefined;
        return inc.map((x, i) => Number((safeDiv(x, Math.max(con[i], EPS)) * 100).toFixed(2)));
    },
    rezultat_operational_vs_buget_pct: (get) => {
        const rez = get("rezultat_operational"); const buget = get("buget_rezultat_operational");
        if (!rez || !buget) return undefined;
        return rez.map((x, i) => Number((safeDiv(x, Math.max(buget[i], EPS)) * 100).toFixed(2)));
    },
    pondere_valoare_adaugata_pct: (get) => {
        const cd = get("cheltuieli_directe"); const ct = get("cheltuieli_totale");
        if (!cd || !ct) return undefined;
        return cd.map((x, i) => Number((safeDiv(x, Math.max(ct[i], EPS)) * 100).toFixed(2)));
    },
    cost_neconformitate_pct: (get) => {
        const cnc = get("cost_neconformitati"); const ven = get("venituri_totale");
        if (!cnc || !ven) return undefined;
        return cnc.map((x, i) => Number((safeDiv(x, Math.max(ven[i], EPS)) * 100).toFixed(2)));
    },
    penalitati_pct: (get) => {
        const pen = get("penalitati"); const ven = get("venituri_totale");
        if (!pen || !ven) return undefined;
        return pen.map((x, i) => Number((safeDiv(x, Math.max(ven[i], EPS)) * 100).toFixed(2)));
    },
    roi_proiecte_pct: (get) => {
        const ben = get("beneficii_nete_anuale"); const inv = get("investitie_capex");
        if (!ben || !inv) return undefined;
        return ben.map((x, i) => Number((safeDiv(x, Math.max(inv[i], EPS)) * 100).toFixed(2)));
    },
    discount_capturat_pct: (get) => {
        const ob = get("discounturi_obtinute"); const po = get("discounturi_posibile");
        if (!ob || !po) return undefined;
        return ob.map((x, i) => Number((safeDiv(x, Math.max(po[i], EPS)) * 100).toFixed(2)));
    },
    abatere_exec_buget_pct: (get) => {
        const exec = get("cheltuieli_totale"); const buget = get("buget_cheltuieli_totale");
        if (!exec || !buget) return undefined;
        return exec.map((x, i) => Number((safeDiv(Math.abs(x - buget[i]), Math.max(buget[i], EPS)) * 100).toFixed(2)));
    },
    cost_kwh_iluminat: (get) => {
        const cost = get("cheltuieli_energie_iluminat"); const kwh = get("consum_energie_iluminat_mwh");
        if (!cost || !kwh) return undefined;
        return cost.map((c, i) => Number((safeDiv(c, Math.max(kwh[i] * 1000, EPS))).toFixed(4)));
    },
    rata_reciclare_pct: (get) => {
        const rec = get("tone_reciclate"); const col = get("tone_deseuri_colectate");
        if (!rec || !col) return undefined;
        return rec.map((r, i) => Number((safeDiv(r, Math.max(col[i], EPS)) * 100).toFixed(2)));
    },
    cost_tona_colectata: (get) => {
        const cost = get("cheltuieli_salubrizare"); const tone = get("tone_deseuri_colectate");
        if (!cost || !tone) return undefined;
        return cost.map((c, i) => Number((safeDiv(c, Math.max(tone[i], EPS))).toFixed(2)));
    },
};

/* ==================== CULORI ==================== */
const PALETTE = ["#6366F1","#22C55E","#EF4444","#F59E0B","#06B6D4","#EC4899","#8B5CF6","#10B981","#F97316","#84CC16"];
const withAlpha = (hex: string, a = 1) => {
    const h = hex.replace("#","");
    const b = parseInt(h, 16);
    return `rgba(${(b >> 16) & 255}, ${(b >> 8) & 255}, ${b & 255}, ${a})`;
};
type ChartArea = { top: number; bottom: number; left: number; right: number; width: number; height: number };
function vGradient(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, withAlpha(color, 0.35)); g.addColorStop(1, withAlpha(color, 0.06)); return g;
}
function vGradientStrong(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, withAlpha(color, 0.9)); g.addColorStop(1, withAlpha(color, 0.35)); return g;
}
function radialGradient(ctx: CanvasRenderingContext2D, area: ChartArea, color: string) {
    const cx = area.left + area.width / 2, cy = area.top + area.height / 2;
    const r = Math.max(area.width, area.height) / 1.8;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, withAlpha(color, 0.32)); g.addColorStop(1, withAlpha(color, 0.08)); return g;
}

/* ==================== EVAL PRAG + BADGE ==================== */
type Traffic = "green" | "yellow" | "red" | "na";
function evalThreshold(key: string, value: number | undefined): Traffic {
    if (value === undefined || Number.isNaN(value)) return "na";
    const t = THRESHOLDS[key];
    if (!t) return "na";
    if (t.type === "higher") return value >= t.green ? "green" : value >= t.yellow ? "yellow" : "red";
    if (t.type === "lower")  return value <= t.green ? "green" : value <= t.yellow ? "yellow" : "red";
    const inG = value >= t.greenMin && value <= t.greenMax;
    const inY = value >= t.yellowMin && value <= t.yellowMax && !inG;
    return inG ? "green" : inY ? "yellow" : "red";
}
const badgeStyle = (t: Traffic): React.CSSProperties => {
    const m: Record<Traffic, { bg: string; fg: string; bd: string }> = {
        green:  { bg: "#DCFCE7", fg: "#166534", bd: "#22C55E" },
        yellow: { bg: "#FEF9C3", fg: "#854D0E", bd: "#EAB308" },
        red:    { bg: "#FEE2E2", fg: "#991B1B", bd: "#EF4444" },
        na:     { bg: "#E5E7EB", fg: "#374151", bd: "#9CA3AF" },
    };
    const c = m[t];
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, border: `1px solid ${c.bd}`, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" };
};

/* ==================== SAGA MAP ==================== */
const SAGA_MAP: Record<string, { kpi: string; col: 'rulajC' | 'rulajD' | 'soldFinalD' | 'soldFinalC' }> = {
    '701': { kpi: 'venituri_totale', col: 'rulajC' },
    '702': { kpi: 'venituri_totale', col: 'rulajC' },
    '703': { kpi: 'venituri_totale', col: 'rulajC' },
    '704': { kpi: 'venituri_totale', col: 'rulajC' },
    '705': { kpi: 'venituri_totale', col: 'rulajC' },
    '706': { kpi: 'venituri_totale', col: 'rulajC' },
    '707': { kpi: 'venituri_totale', col: 'rulajC' },
    '708': { kpi: 'venituri_totale', col: 'rulajC' },
    '641': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '642': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '643': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '644': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '645': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '646': { kpi: 'cheltuieli_personal_abs', col: 'rulajD' },
    '605': { kpi: 'cheltuieli_energie', col: 'rulajD' },
    '606': { kpi: 'cheltuieli_energie', col: 'rulajD' },
    '610': { kpi: 'cheltuieli_utilitati', col: 'rulajD' },
    '611': { kpi: 'cheltuieli_utilitati', col: 'rulajD' },
    '5121': { kpi: 'cashflow_operational', col: 'soldFinalD' },
    '5124': { kpi: 'cashflow_operational', col: 'soldFinalD' },
    '5125': { kpi: 'cashflow_operational', col: 'soldFinalD' },
    '5311': { kpi: 'cashflow_operational', col: 'soldFinalD' },
    '5314': { kpi: 'cashflow_operational', col: 'soldFinalD' },
    '4111': { kpi: 'creante', col: 'soldFinalD' },
    '4118': { kpi: 'creante', col: 'soldFinalD' },
    '413':  { kpi: 'creante', col: 'soldFinalD' },
    '418':  { kpi: 'creante', col: 'soldFinalD' },
    '401':  { kpi: 'datorii_comerciale', col: 'soldFinalC' },
    '403':  { kpi: 'datorii_comerciale', col: 'soldFinalC' },
    '404':  { kpi: 'datorii_comerciale', col: 'soldFinalC' },
    '405':  { kpi: 'datorii_comerciale', col: 'soldFinalC' },
    '300':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '301':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '302':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '303':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '304':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '345':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '371':  { kpi: 'stoc_mediu', col: 'soldFinalD' },
    '121':  { kpi: 'rezultat_net', col: 'soldFinalD' },
    '211':  { kpi: 'active_nete', col: 'soldFinalD' },
    '212':  { kpi: 'active_nete', col: 'soldFinalD' },
    '213':  { kpi: 'active_nete', col: 'soldFinalD' },
    '214':  { kpi: 'active_nete', col: 'soldFinalD' },
    '215':  { kpi: 'active_nete', col: 'soldFinalD' },
    '231':  { kpi: 'active_nete', col: 'soldFinalD' },
    '623':  { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
    '6231': { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
    '6232': { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
    '626':  { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
    '627':  { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
    '628':  { kpi: 'cheltuieli_admin_it', col: 'rulajD' },
};

/* ==================== PARSERE ==================== */
function toNum(v: any): number {
    if (!v && v !== 0) return 0;
    return parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;
}

function parseSAGA(rows: any[], acc: Record<string, number>) {
    let totalCheltuieli = 0, totalVenituri = 0;
    for (const row of rows) {
        const cont = String(row.label || '').trim().split(' ')[0];
        const vals: any[] = row.rawValues ?? [];
        const rulajD = toNum(vals[6]), rulajC = toNum(vals[7]);
        const soldFinalD = toNum(vals[10]), soldFinalC = toNum(vals[11]);
        if (/^6/.test(cont)) totalCheltuieli += rulajD;
        if (/^7/.test(cont)) totalVenituri   += rulajC;
        const mapping = SAGA_MAP[cont];
        if (mapping) {
            const val = mapping.col === 'rulajC' ? rulajC : mapping.col === 'rulajD' ? rulajD
                      : mapping.col === 'soldFinalD' ? soldFinalD : soldFinalC;
            acc[mapping.kpi] = (acc[mapping.kpi] || 0) + val;
        }
    }
    acc['cheltuieli_totale']    = totalCheltuieli;
    acc['venituri_totale']      = acc['venituri_totale'] || totalVenituri;
    acc['rezultat_operational'] = totalVenituri - totalCheltuieli;
}

function parseFOREXEBUG(rows: any[], acc: Record<string, number>) {
    const RD_MAP: Record<string, string> = {
        '11': 'venituri_totale', '5': 'subventii', '3': 'venituri_private',
        '13': 'cheltuieli_personal_abs', '14': 'cheltuieli_utilitati',
        '24': 'cheltuieli_totale', '25': 'rezultat_net', '9': 'stoc_mediu',
        '10': 'creante', '12': 'cashflow_operational', '15': 'lichiditate_curenta',
        '16': 'active_nete', '29': 'datorii_comerciale',
    };
    for (const row of rows) {
        const label = String(row.label || '').trim();
        const rdMatch = label.match(/^rd\.?(\d+)$/i) || label.match(/^(\d+)$/);
        if (rdMatch) {
            const kpi = RD_MAP[rdMatch[1]];
            if (kpi) acc[kpi] = (acc[kpi] || 0) + (row.value || 0);
        }
    }
    if (acc['venituri_totale'] && acc['cheltuieli_totale'])
        acc['rezultat_operational'] = acc['venituri_totale'] - acc['cheltuieli_totale'];
}

// Excel cu luni pe coloane: header row = Indicator | Ian | Feb | ... | Dec
function parseMonthlyColumns(rows: any[]): Record<string, number[]> | null {
    if (!rows?.length) return null;
    const firstRow  = rows[0];
    const headerArr = [String(firstRow.label || ''), ...(firstRow.rawValues || [])].map((v: any) =>
        String(v || '').toLowerCase().trim()
    );
    const monthIdxMap = headerArr.map(h => {
        let idx = MONTH_NAMES_RO.findIndex(m => h === m || h.startsWith(m));
        if (idx < 0) idx = MONTH_NAMES_FULL.findIndex(m => h.startsWith(m));
        return idx;
    });
    if (monthIdxMap.filter(x => x >= 0).length < 3) return null;
    const result: Record<string, number[]> = {};
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const kpi = String(row.label || '').trim().toLowerCase().replace(/\s+/g, '_');
        if (!kpi) continue;
        const vals  = [String(row.label || ''), ...(row.rawValues || [])];
        const serie = Array(12).fill(0);
        vals.forEach((v: any, ci: number) => {
            const mIdx = monthIdxMap[ci];
            if (mIdx >= 0 && mIdx <= 11) serie[mIdx] = toNum(v);
        });
        result[kpi] = serie;
    }
    return Object.keys(result).length > 0 ? result : null;
}

// Excel cu sheet per lună (sheet name = Ian / Ianuarie / etc.)
function parseSheetPerMonth(wb: any): Record<string, number[]> | null {
    const result: Record<string, number[]> = {};
    let found = false;
    for (const sheet of wb.sheets ?? []) {
        const name = (sheet.name || '').toLowerCase().trim();
        let mIdx = MONTH_NAMES_RO.findIndex(m => name === m || name.startsWith(m));
        if (mIdx < 0) mIdx = MONTH_NAMES_FULL.findIndex(m => name.startsWith(m));
        if (mIdx < 0) continue;
        found = true;
        const acc: Record<string, number> = {};
        parseSAGA(sheet.rows, acc);
        for (const [kpi, val] of Object.entries(acc)) {
            if (!result[kpi]) result[kpi] = Array(12).fill(0);
            result[kpi][mIdx] = val;
        }
    }
    return found ? result : null;
}

/* ==================== DETECȚIE LUNĂ & AN ==================== */
function detectMonthIndex(workbooks: any[]): number {
    for (const wb of workbooks) {
        if (wb.meta?.periodEnd) {
            const d = new Date(wb.meta.periodEnd);
            if (!isNaN(d.getTime())) return d.getMonth();
        }
        for (const sheet of wb.sheets ?? []) {
            for (const row of sheet.rows ?? []) {
                const text = String(row.label || '') + ' ' + String(row.rawValues?.join(' ') || '');
                const matches = [...text.matchAll(/\b(\d{2})\.(\d{2})\.(20\d{2})\b/g)];
                for (const m of matches) {
                    const month = parseInt(m[2], 10) - 1;
                    if (month >= 0 && month <= 11) return month;
                }
            }
        }
        for (const sheet of wb.sheets ?? []) {
            const name = (sheet.name || '').toLowerCase();
            let idx = MONTH_NAMES_RO.findIndex(m => name.includes(m));
            if (idx >= 0) return idx;
            idx = MONTH_NAMES_FULL.findIndex(m => name.includes(m));
            if (idx >= 0) return idx;
        }
    }
    return new Date().getMonth();
}

function detectYear(workbooks: any[]): number | null {
    for (const wb of workbooks) {
        if (wb.meta?.periodEnd) {
            const d = new Date(wb.meta.periodEnd);
            if (!isNaN(d.getTime())) return d.getFullYear();
        }
        for (const sheet of wb.sheets ?? []) {
            for (const row of sheet.rows ?? []) {
                const text = String(row.label || '') + ' ' + String(row.rawValues?.join(' ') || '');
                const matches = [...text.matchAll(/\b\d{2}\.\d{2}\.(20\d{2})\b/g)];
                for (const m of matches) {
                    const y = parseInt(m[1], 10);
                    if (y >= 2020) return y;
                }
            }
        }
        for (const sheet of wb.sheets ?? []) {
            const m = (sheet.name || '').match(/20\d{2}/);
            if (m) return parseInt(m[0], 10);
        }
    }
    return null;
}

/* ==================== PAGINA ==================== */
export default function Indicatori() {
    const { orgType } = useOrg();
    const mergeUploaded = useIndicatoriStore((s) => s.mergeUploaded);
    const series = (useIndicatoriStore((s) => s.series) ?? {}) as Record<string, { values: number[] } | undefined>;

    const [uploadedYear, setUploadedYear] = useState<number | null>(null);
    const [manualYear,   setManualYear]   = useState<number | null>(null);
    const activeYear = manualYear ?? uploadedYear ?? new Date().getFullYear();

    /* ---------- downloadTemplate ---------- */
    function downloadTemplate() {
        const isSpital     = orgType === 'spital';
        const isInstitutie = orgType === 'institutie_publica';
        const rows = [
            ['Indicator','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'],
            ['venituri_totale','','','','','','','','','','','',''],
            ['cheltuieli_totale','','','','','','','','','','','',''],
            ['cheltuieli_personal_abs','','','','','','','','','','','',''],
            ['cheltuieli_utilitati','','','','','','','','','','','',''],
            ['cheltuieli_energie','','','','','','','','','','','',''],
            ['rezultat_operational','','','','','','','','','','','',''],
            ['rezultat_net','','','','','','','','','','','',''],
            ['cashflow_operational','','','','','','','','','','','',''],
            ['lichiditate_curenta','','','','','','','','','','','',''],
            ['grad_indatorare','','','','','','','','','','','',''],
            ['creante','','','','','','','','','','','',''],
            ['datorii_comerciale','','','','','','','','','','','',''],
            ['active_nete','','','','','','','','','','','',''],
            ['buget_cheltuieli_totale','','','','','','','','','','','',''],
            ['buget_rezultat_operational','','','','','','','','','','','',''],
            ...(isSpital ? [
                ['incasat_cas','','','','','','','','','','','',''],
                ['contract_cas','','','','','','','','','','','',''],
                ['cheltuieli_medicamente','','','','','','','','','','','',''],
                ['cheltuieli_materiale','','','','','','','','','','','',''],
                ['cazuri_decontate','','','','','','','','','','','',''],
                ['zile_spitalizare','','','','','','','','','','','',''],
                ['pat_zile','','','','','','','','','','','',''],
                ['ocupare_paturi_pct','','','','','','','','','','','',''],
                ['icm','','','','','','','','','','','',''],
            ] : []),
            ...(isInstitutie ? [
                ['subventii','','','','','','','','','','','',''],
                ['venituri_granturi','','','','','','','','','','','',''],
                ['fonduri_alocate','','','','','','','','','','','',''],
                ['fonduri_absorbite','','','','','','','','','','','',''],
                ['numar_angajati','','','','','','','','','','','',''],
                ['rata_solutionare_petitii_pct','','','','','','','','','','','',''],
                ['proiecte_finalizate_la_termen_pct','','','','','','','','','','','',''],
            ] : [
                ['venituri_private','','','','','','','','','','','',''],
                ['achizitii','','','','','','','','','','','',''],
                ['stoc_mediu','','','','','','','','','','','',''],
                ['consum_lunar','','','','','','','','','','','',''],
            ]),
            ['emisii_co2_tone','','','','','','','','','','','',''],
            ['consum_energie_mwh','','','','','','','','','','','',''],
            ['consum_apa_mc','','','','','','','','','','','',''],
            ['deseuri_reciclate_pct','','','','','','','','','','','',''],
            ['angajati_formati_pct','','','','','','','','','','','',''],
            ['incidente_ssm','','','','','','','','','','','',''],
            ['femei_management_pct','','','','','','','','','','','',''],
            ['furnizori_locali_pct','','','','','','','','','','','',''],
            ['satisfactie_clienti_pct','','','','','','','','','','','',''],
        ];
        const tip = isSpital ? 'spital' : isInstitutie ? 'institutie' : 'companie';
        const csv = rows.map(r => r.join(';')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `template_indicatori_${tip}_${activeYear}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }

    /* ---------- handleParsed ---------- */
    function handleParsed(workbooks: any[]) {
        const detectedYear = detectYear(workbooks);
        if (detectedYear) setUploadedYear(detectedYear);
        const yearKey = detectedYear ?? activeYear;

        // Cazul 1: Excel sheet per lună
        for (const wb of workbooks) {
            const sheetResult = parseSheetPerMonth(wb);
            if (sheetResult) {
                const update: Record<string, { values: number[] }> = {};
                for (const [kpi, serie] of Object.entries(sheetResult))
                    update[`${kpi}__${yearKey}`] = { values: serie };
                mergeUploaded(update as any);
                return;
            }
        }

        // Cazul 2: Excel luni pe coloane
        for (const wb of workbooks) {
            for (const sheet of wb.sheets ?? []) {
                const colResult = parseMonthlyColumns(sheet.rows);
                if (colResult) {
                    const update: Record<string, { values: number[] }> = {};
                    for (const [kpi, serie] of Object.entries(colResult))
                        update[`${kpi}__${yearKey}`] = { values: serie };
                    mergeUploaded(update as any);
                    return;
                }
            }
        }

        // Cazul 3: PDF / SAGA / FOREXEBUG (o singură lună)
        const acc: Record<string, number> = {};
        const monthIdx = detectMonthIndex(workbooks);
        for (const wb of workbooks) {
            for (const sheet of wb.sheets) {
                const rows = sheet.rows;
                const isSAGA = rows.some((r: any) =>
                    /^\d{3,5}$/.test(String(r.label || '').trim().split(' ')[0])
                );
                const isFOREXEBUG = rows.some((r: any) =>
                    /^rd\.?\d+$/i.test(String(r.label || '').trim())
                );
                if (orgType === 'companie' || (orgType === 'spital' && isSAGA)) parseSAGA(rows, acc);
                else if (orgType === 'institutie_publica' || isFOREXEBUG) parseFOREXEBUG(rows, acc);
                else parseSAGA(rows, acc);
            }
        }
        const update: Record<string, { values: number[] }> = {};
        for (const [kpi, value] of Object.entries(acc)) {
            const storeKey = `${kpi}__${yearKey}`;
            const existing = (series?.[storeKey]?.values as number[] | undefined) ?? Array(12).fill(0);
            const updated  = [...existing];
            if (updated.length !== 12) updated.length = 12;
            updated[monthIdx] = value;
            update[storeKey] = { values: updated };
        }
        mergeUploaded(update as any);
    }

    /* ---------- hooks ---------- */
    const KPIS_FILTERED = useMemo(() =>
        ALL_KPIS.filter(k => !k.forTypes || k.forTypes.includes(orgType as OrgType)),
        [orgType]
    );

    const getMonthlyRaw = (key: string): number[] | undefined => {
        const withYear = series?.[`${key}__${activeYear}`]?.values;
        if (Array.isArray(withYear) && withYear.length === 12) return withYear;
        const plain = series?.[key]?.values;
        if (Array.isArray(plain) && plain.length === 12) return plain;
        return undefined;
    };

    const allYears = useMemo(() => {
        const years = new Set<number>();
        Object.keys(series ?? {}).forEach(k => {
            const m = k.match(/__((20|19)\d{2})$/);
            if (m) years.add(Number(m[1]));
        });
        return Array.from(years).sort((a, b) => a - b);
    }, [series]);

    const [yearFrom, setYearFrom] = useState<number | null>(null);
    const [yearTo,   setYearTo]   = useState<number | null>(null);

    const getMonthlyForYear = (key: string, year: number): number[] | undefined => {
        const v = series?.[`${key}__${year}`]?.values;
        return Array.isArray(v) && v.length === 12 ? v : undefined;
    };

    const category    = useIndicatoriUi((s) => s.category);
    const selected    = useIndicatoriUi((s) => s.selected);
    const period      = useIndicatoriUi((s) => s.period);
    const chartKind   = useIndicatoriUi((s) => s.chartKind);
    const setCategory  = useIndicatoriUi((s) => s.setCategory);
    const setSelected  = useIndicatoriUi((s) => s.setSelected);
    const setPeriod    = useIndicatoriUi((s) => s.setPeriod);
    const setChartKind = useIndicatoriUi((s) => s.setChartKind);

    const DEFAULT_H = 260;
    const [hLine,  setHLine]  = useState<number>(DEFAULT_H);
    const [hBar,   setHBar]   = useState<number>(DEFAULT_H);
    const [hRadar, setHRadar] = useState<number>(DEFAULT_H);
    useEffect(() => { setHLine(DEFAULT_H); setHBar(DEFAULT_H); setHRadar(DEFAULT_H); }, []);

    const categories  = useMemo(() => Array.from(new Set(KPIS_FILTERED.map(k => k.category))), [KPIS_FILTERED]);
    const visibleKpis = useMemo(() => KPIS_FILTERED.filter(k => k.category === category), [category, KPIS_FILTERED]);

    const labels = useMemo(() => {
        if (period === "lunar") return monthsLabels();
        if (period === "trimestrial") return quartersLabels();
        const yrs = allYears.filter(y => (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo));
        if (yrs.length) return yrs.map(String);
        return yearsLabels(2023, 3);
    }, [period, allYears, yearFrom, yearTo]);

    const getSeriesForKey = (key: string): number[] => {
        const def = KPIS_FILTERED.find(k => k.key === key);
        let base: number[] | undefined;
        if (def?.derived && computeDerived[key]) base = computeDerived[key](kk => getMonthlyRaw(kk));
        if (!base) base = getMonthlyRaw(key);
        if (!base) base = Array(12).fill(NaN);
        if (period === "lunar") return base;
        if (period === "trimestrial") return toQuarterly(base);
        const yrs = allYears.filter(y => (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo));
        if (yrs.length) return yrs.map(y => avg(getMonthlyForYear(key, y) ?? base!));
        return toYearly(base);
    };

    const datasets = useMemo(() =>
        selected.map((key, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            const data  = getSeriesForKey(key);
            const kpi   = KPIS_FILTERED.find(k => k.key === key);
            return {
                label: kpi?.label ?? key, data, tension: 0.35, borderWidth: 2,
                borderColor: color, pointBackgroundColor: "#fff", pointBorderColor: color,
                pointHoverBackgroundColor: color, pointHoverBorderColor: "#fff",
                backgroundColor: (ctx: any) => {
                    const chart = ctx.chart, area = chart?.chartArea as any, c2d = chart?.ctx as CanvasRenderingContext2D | undefined;
                    if (!area || !c2d) return withAlpha(color, chart.config.type === "bar" ? 0.6 : 0.18);
                    if (chart.config.type === "radar") return radialGradient(c2d, area, color);
                    if (chart.config.type === "bar")   return vGradientStrong(c2d, area, color);
                    return vGradient(c2d, area, color);
                },
                fill: chartKind === "area" ? "origin" : false,
            };
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selected, period, chartKind, series, yearFrom, yearTo, allYears, KPIS_FILTERED, activeYear]
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
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        elements: { line: { borderWidth: 2 } },
        scales: { r: { angleLines: { color: "rgba(0,0,0,0.08)" }, grid: { color: "rgba(0,0,0,0.08)" }, ticks: { showLabelBackdrop: false } } },
    }), []);

    useEffect(() => {
        const still = selected.filter(k => visibleKpis.some(v => v.key === k));
        if (still.length === 0 && visibleKpis[0]) setSelected([visibleKpis[0].key]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const currentValue = (key: string): number | undefined => {
        const arr = getSeriesForKey(key);
        if (!arr) return undefined;
        for (let i = arr.length - 1; i >= 0; i--)
            if (!Number.isNaN(arr[i]) && arr[i] !== 0) return arr[i];
        return undefined;
    };

    const yearOptions = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i);

    /* ---------- render ---------- */
    return (
        <div className="content" style={{ padding: 16 }}>
            <h1 className="h1" style={{ marginBottom: 12 }}>
                {orgType === 'spital'            ? 'Indicatori financiari și clinici'
                 : orgType === 'institutie_publica' ? 'Indicatori financiari și servicii publice'
                 : 'Indicatori financiari'}
            </h1>

            {/* Filtre */}
            <div className="card" style={{ padding: 12, marginBottom: 12, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label><b>Categorie:</b>&nbsp;
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label><b>Perioadă:</b>&nbsp;
                        <select value={period} onChange={e => setPeriod(e.target.value as Period)}>
                            <option value="lunar">Lunar</option>
                            <option value="trimestrial">Trimestrial</option>
                            <option value="anual">Anual</option>
                        </select>
                    </label>
                    <label><b>Tip grafic:</b>&nbsp;
                        <select value={chartKind} onChange={e => setChartKind(e.target.value as ChartKind)}>
                            <option value="line">Line</option>
                            <option value="area">Area (cu gradient)</option>
                            <option value="bar">Bar</option>
                            <option value="stacked">Stacked Bars</option>
                        </select>
                    </label>
                    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <b>An date:</b>
                        <select value={manualYear ?? uploadedYear ?? ""} onChange={e => setManualYear(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">(neatribuit)</option>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {uploadedYear && !manualYear && <span style={{ fontSize: 11, color: "#6b7280" }}>detectat din fișier</span>}
                    </div>
                    {period === "anual" && allYears.length > 1 && (
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                            <b>Interval:</b>
                            <select value={yearFrom ?? ""} onChange={e => setYearFrom(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">(toți)</option>
                                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span style={{ color: "#9CA3AF" }}>—</span>
                            <select value={yearTo ?? ""} onChange={e => setYearTo(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">(toți)</option>
                                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                    {visibleKpis.map(k => {
                        const val = currentValue(k.key), traffic = evalThreshold(k.key, val);
                        return (
                            <label key={k.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="checkbox" checked={selected.includes(k.key)}
                                    onChange={() => setSelected(selected.includes(k.key)
                                        ? selected.filter(kk => kk !== k.key)
                                        : [...selected, k.key])}
                                />
                                <span>{k.label}</span>
                                <span style={badgeStyle(traffic)}>
                                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: traffic === "green" ? "#16A34A" : traffic === "yellow" ? "#CA8A04" : traffic === "red" ? "#DC2626" : "#6B7280" }} />
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
                        {selected.map(key => {
                            const def = KPIS_FILTERED.find(k => k.key === key);
                            if (!def) return null;
                            const val = currentValue(key), t = evalThreshold(key, val);
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

            {/* Uploader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button onClick={downloadTemplate} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    ⬇ Descarcă template CSV
                </button>
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Acceptă: Balanță SAGA (.pdf/.xlsx), export FOREXEBUG, template CSV, Excel cu luni pe coloane sau sheet-uri per lună
                </span>
            </div>
            <KpiUploader kpis={[]} onParsed={handleParsed} />

            {/* Grafice */}
            <div className="card" onDoubleClick={() => setHLine(260)}
                style={{ padding: 12, height: hLine, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", marginTop: 12, marginBottom: 12, display: "flex", flexDirection: "column" }}
                title="Dublu-click pentru reset dimensiune">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Evoluție</div>
                <div style={{ flex: 1, width: "100%" }}><Line data={dataCombined as any} options={optionsLine} /></div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap", width: "100%" }}>
                <div className="card" onDoubleClick={() => setHBar(260)}
                    style={{ padding: 12, height: hBar, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", flex: "1 1 520px", minWidth: 420, display: "flex", flexDirection: "column" }}
                    title="Dublu-click pentru reset dimensiune">
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Comparativ (Bar)</div>
                    <div style={{ flex: 1, width: "100%" }}><Bar data={dataCombined as any} options={optionsBar} /></div>
                </div>

                <div className="card" onDoubleClick={() => setHRadar(260)}
                    style={{ padding: 12, height: hRadar, minHeight: 220, maxHeight: 600, resize: "vertical", overflow: "hidden", flex: "1 1 520px", minWidth: 420, display: "flex", flexDirection: "column" }}
                    title="Dublu-click pentru reset dimensiune">
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Profil (Radar)</div>
                    <div style={{ flex: 1, width: "100%" }}>
                        {period === "lunar"
                            ? <Radar data={dataCombined as any} options={optionsRadar} />
                            : <div style={{ color: "#6b7280", fontSize: 13, padding: 16 }}>Radar-ul arată cel mai bine pe 12 axe (luni). Selectează perioada <b>„lunar"</b>.</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}