// /lib/mediu-kpi.ts
import { LS } from '@/lib/mediu-bridge';
import type { SacEntry, DensitatePreset, DocItem } from '@/lib/mediu-types';

const LtoM3 = (l: number) => l / 1000;

function ls<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
    catch { return fallback; }
}

function isSameMonth(iso: string, ym: string) {
    return (iso || '').slice(0, 7) === ym;
}

function densitateFor(cod: string, presets: DensitatePreset[]) {
    return presets.find(p => p.codDeseu === cod)?.kgM3 ?? 100;
}

export interface MediuKPI {
    totalKgMonth: number;
    top3Sectii: Array<{ sectie: string; kg: number }>;
    contractsExpiringIn30: number;
}

/** Agregă KPI pentru Dashboard din localStorage (client-side). */
export function getMediuKpi(todayISO = new Date().toISOString().slice(0, 10)): MediuKPI {
    const ym = todayISO.slice(0, 7);

    const saci = ls<SacEntry[]>(LS.saci, []);
    const pres = ls<DensitatePreset[]>(LS.densitati, []);
    const docs = ls<DocItem[]>(LS.contracte, []);

    // total + top3 secții (luna curentă)
    const bySect = new Map<string, number>();
    let total = 0;

    for (const s of saci) {
        if (!isSameMonth(s.data, ym)) continue;
        const d = s.densitateKgM3 ?? densitateFor(s.codDeseu, pres);
        const kg = LtoM3(s.marimeL) * (s.gradUmplere / 100) * s.nrBuc * d;
        total += kg;
        const key = (s.sectie || '—').trim() || '—';
        bySect.set(key, (bySect.get(key) || 0) + kg);
    }

    const top3 = Array.from(bySect.entries())
        .map(([sectie, kg]) => ({ sectie, kg: Math.round(kg * 10) / 10 }))
        .sort((a, b) => b.kg - a.kg)
        .slice(0, 3);

    // expirări ≤30 zile
    const now = new Date(todayISO);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const contractsExpiringIn30 = docs.filter(d => {
        if (!d.endAt || d.nedeterminata) return false;
        const end = new Date(d.endAt);
        return end >= now && end <= in30;
    }).length;

    return {
        totalKgMonth: Math.round(total * 10) / 10,
        top3Sectii: top3,
        contractsExpiringIn30: contractsExpiringIn30,
    };
}
