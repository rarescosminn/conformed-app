// /lib/mediu-bridge.ts
import type {
    SacEntry,
    DensitatePreset,
    DailyReport,
    DocItem,
    MonthlyLock,
} from './mediu-types';

/* ======================
 *  LocalStorage keys
 * ====================== */
export const LS = {
    saci: 'mediu::saci',
    densitati: 'mediu::densitati',
    daily: 'mediu::rapoarteZilnice',
    monthlyLock: 'mediu::monthlyLock',
    anual: 'mediu::raportAnual',
    contracte: 'mediu::contracte',
    coduri: 'mediu::coduriDeseu',
    sectii: 'mediu::sectii', // listă secții (autocomplete)
} as const;

/* ======================
 *  Notificare schimbare
 * ====================== */
export function notifyMediu(scope: keyof typeof LS) {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: LS[scope] }));
    } catch {
        // ignore
    }
}

/* ======================
 *  Helperi (o singură dată)
 * ====================== */
const LtoM3 = (l: number) => l / 1000;

function lsGet<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function densitateFor(cod: string, presets: DensitatePreset[]) {
    return presets.find(p => p.codDeseu === cod)?.kgM3 ?? 100;
}

/* ======================
 *  Agregări folosite de /app/mediu/page.tsx
 * ====================== */

function statsDeseuri(): { totalKgAzi: number; needValidate: number } {
    const azi = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const saci = lsGet<SacEntry[]>(LS.saci, []);
    const presets = lsGet<DensitatePreset[]>(LS.densitati, []);
    const rap = lsGet<DailyReport[]>(LS.daily, []);

    const totalKgAzi =
        Math.round(
            saci
                .filter(s => s.data === azi)
                .reduce((acc, s) => {
                    const dens = s.densitateKgM3 ?? densitateFor(s.codDeseu, presets);
                    return acc + LtoM3(s.marimeL) * (s.gradUmplere / 100) * s.nrBuc * dens;
                }, 0) * 10,
        ) / 10;

    const rec = rap.find(r => r.data === azi);
    const needValidate = rec ? (rec.validat ? 0 : 1) : (totalKgAzi > 0 ? 1 : 0);

    return { totalKgAzi, needValidate };
}

function statsContracte(): {
    total: number;
    exp60: number;
    expirate: number;
    faraScan: number;
} {
    const docs = lsGet<DocItem[]>(LS.contracte, []);
    const today = new Date();
    const in60 = new Date(today);
    in60.setDate(in60.getDate() + 60);

    let exp60 = 0, expirate = 0, faraScan = 0;

    for (const d of docs) {
        if (!d.scanUrl) faraScan++;
        if (d.nedeterminata || !d.endAt) continue;
        const end = new Date(d.endAt);
        if (end < today) expirate++;
        else if (end <= in60) exp60++;
    }

    return { total: docs.length, exp60, expirate, faraScan };
}

function statsLocked(): { locked: boolean } {
    const locks = lsGet<MonthlyLock[]>(LS.monthlyLock, []);
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    const prevYm = d.toISOString().slice(0, 7);
    return { locked: locks.some(l => l.luna === prevYm) };
}

/* ======================
 *  Obiect exportat – așa îl așteaptă page.tsx
 * ====================== */
export const mediuStats = {
    deseuri: statsDeseuri,
    contracte: statsContracte,
    locked: statsLocked,
};
