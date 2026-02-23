// /lib/sections/selector.ts
import { features } from "@/lib/features";
import { SECTIONS_MASTER } from "./master";
import { loadHospitalProfile } from "./storage";

export type VisibleSection = {
    id: string;
    name: string;
    code: string;
    // locații în care e activă (pentru hover)
    sites?: string[];
};

export function getVisibleSections(hospitalId: string, siteCode?: string): VisibleSection[] {
    const fallback = SECTIONS_MASTER.map(s => ({ id: s.id, name: s.name, code: s.code }));

    if (!features.sectionsPersonalizate) return fallback;

    const profile = loadHospitalProfile(hospitalId);
    if (!profile || !profile.onboardingCompleted) return fallback;

    const byId = new Map(SECTIONS_MASTER.map(s => [s.id, s]));
    if (!profile.multiSite) {
        const enabledIds = Object.entries(profile.sectionsBySite["MAIN"] || {})
            .filter(([, v]) => v)
            .map(([k]) => k);
        return enabledIds
            .map(id => byId.get(id))
            .filter(Boolean)
            .map(s => ({ id: s!.id, name: s!.name, code: s!.code }));
    }

    // multi-site
    if (siteCode) {
        const enabledIds = Object.entries(profile.sectionsBySite[siteCode] || {})
            .filter(([, v]) => v)
            .map(([k]) => k);
        return enabledIds
            .map(id => byId.get(id))
            .filter(Boolean)
            .map(s => ({ id: s!.id, name: s!.name, code: s!.code }));
    }

    // agregat pe spital: secție apare dacă e activă în cel puțin o locație; păstrăm lista de locații
    const siteCodes = Object.keys(profile.sectionsBySite);
    const enabledAggregate: Record<string, string[]> = {};
    for (const sc of siteCodes) {
        const map = profile.sectionsBySite[sc] || {};
        for (const [secId, enabled] of Object.entries(map)) {
            if (!enabled) continue;
            if (!enabledAggregate[secId]) enabledAggregate[secId] = [];
            enabledAggregate[secId].push(sc);
        }
    }
    return Object.keys(enabledAggregate)
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(s => ({
            id: s!.id,
            name: s!.name,
            code: s!.code,
            sites: enabledAggregate[s!.id],
        }));
}
