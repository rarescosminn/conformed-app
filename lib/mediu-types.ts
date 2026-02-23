// /lib/mediu-types.ts

/**
 * Tipuri folosite de modulul Mediu.
 * Am adăugat câmpul `sectie: string` în SacEntry pentru trasabilitate pe secții.
 */

export type CuloareSac = 'galben' | 'verde' | 'albastru' | 'negru' | 'transparent';
export type MarimeSacL = 30 | 60 | 120 | 240 | 500;

export interface SacEntry {
    id: string;
    data: string;                 // ISO "YYYY-MM-DD"
    sectie: string;               // ⬅️ NOU: trasabilitate pe secții (ex. Chirurgie, ATI)
    codDeseu: string;             // ex. "20 03 01" (poate conține '*')
    culoare: CuloareSac;
    marimeL: MarimeSacL;
    nrBuc: number;                // câte saci
    gradUmplere: number;          // 0..100 %
    densitateKgM3?: number;       // dacă lipsește, se ia din preset
    validatAsistentSef: boolean;  // starea raportului zilnic / semnătură
}

export interface DensitatePreset {
    codDeseu: string;
    kgM3: number;
    updatedAt: string;            // ISO
}

export interface DailyReport {
    id: string;
    data: string;                 // ISO "YYYY-MM-DD"
    totalKg: number;
    validat: boolean;
    validatDe?: string;           // opțional: cine a validat
    validatLa?: string;           // opțional: ISO timestamp
}

export interface MonthlyLock {
    luna: string;                 // ISO "YYYY-MM" (luna blocată)
    lockedAt: string;             // ISO timestamp
}

/** Autorizații / contracte */
export type DocTip = 'Contract' | 'Autorizatie';

export interface DocItem {
    id: string;
    tip: DocTip;
    numar: string;                // ex. "123/2025"
    denumire?: string;            // ex. "Servicii salubrizare"
    emitent?: string;             // ex. "ANPM"
    startAt?: string;             // ISO "YYYY-MM-DD"
    endAt?: string;               // ISO "YYYY-MM-DD" (dacă e nedeterminată, lipsește)
    nedeterminata?: boolean;
    createdAt: string;            // ISO
    scanUrl?: string;             // opțional: link către document scanat
}

/** Elemente șterse (coș de gunoi) */
export interface TrashItem {
    id: string;
    deletedAt: string;            // ISO
    payload: DocItem;
}
