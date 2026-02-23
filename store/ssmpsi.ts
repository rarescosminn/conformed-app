// /store/ssmpsi.ts
"use client";

import { create } from "zustand";
import { scopedLSKey } from "@/utils/scope";

/** Tipuri de date */
export type EIPItem = {
    id: string;
    angajat: string;
    tip: string;
    marime?: string;
    dataExpirare?: string; // ISO
    confirmarePrimire?: boolean;
};

export type ExercitiuEvacuare = {
    id: string;
    dataPlanificata: string; // ISO
    procesVerbalUrl?: string;
    mediaUrl?: string[];
    frecventa: "trimestrial" | "anual";
};

export type AvizAutorizatie = {
    id: string;
    tip: "ISU" | "ITM" | "Mediu" | "Altul";
    numar: string;
    dataExpirare: string; // ISO
    fisierUrl?: string;
};

export type PermisLucru = {
    id: string;
    categorie: "foc" | "spatiu-inchis" | "inaltime" | "electric";
    dataStart: string; // ISO
    dataStop?: string; // ISO
    activ: boolean;
    aprobatDe?: string;
    jurnal?: string[];
};

export type RiscMasura = {
    id: string;
    descriere: string;
    nivel: "scazut" | "mediu" | "ridicat";
    responsabil?: string;
    termen?: string; // ISO
    status: "deschis" | "in-derulare" | "inchis";
};

export type AuditControl = {
    id: string;
    data: string; // ISO
    tip: "intern" | "extern" | "inspectie";
    checklistUrl?: string;
    neconformitatiDeschise?: number;
};

export type DocBiblioteca = {
    id: string;
    titlu: string;
    categorie: "procedura" | "instructiune" | "formular" | "alta";
    versiune: string;
    url?: string;
    dataUpload: string; // ISO
};

export type RapoarteKPI = {
    id: string;
    titlu: string;
    perioada: string; // ex. "Ian 2025"
    dataGenerare: string; // ISO
    url?: string;
};

/** State + helpers */
type DataState = {
    eip: EIPItem[];
    evacuari: ExercitiuEvacuare[];
    avize: AvizAutorizatie[];
    permise: PermisLucru[];
    riscuri: RiscMasura[];
    audit: AuditControl[];
    biblioteca: DocBiblioteca[];
    kpi: RapoarteKPI[];

    load: () => void;
    save: () => void;

    // opțional: adăugiri rapide (folosite de carduri)
    addTodoEIP?: (item: EIPItem) => void;
};

const baseKey = "ssmpsi-data";

export const useSsmPsiStore = create<DataState>((set, get) => ({
    eip: [],
    evacuari: [],
    avize: [],
    permise: [],
    riscuri: [],
    audit: [],
    biblioteca: [],
    kpi: [],

    load: () => {
        try {
            const raw = localStorage.getItem(scopedLSKey(baseKey));
            if (!raw) return;
            const parsed = JSON.parse(raw);
            set({
                eip: parsed.eip ?? [],
                evacuari: parsed.evacuari ?? [],
                avize: parsed.avize ?? [],
                permise: parsed.permise ?? [],
                riscuri: parsed.riscuri ?? [],
                audit: parsed.audit ?? [],
                biblioteca: parsed.biblioteca ?? [],
                kpi: parsed.kpi ?? [],
            });
        } catch {
            // ignoră
        }
    },

    save: () => {
        const { eip, evacuari, avize, permise, riscuri, audit, biblioteca, kpi } = get();
        const payload = { eip, evacuari, avize, permise, riscuri, audit, biblioteca, kpi };
        localStorage.setItem(scopedLSKey(baseKey), JSON.stringify(payload));
    },
}));
