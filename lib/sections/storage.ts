// /lib/sections/storage.ts
export type Site = { code: string; name: string; address?: string };

export type HospitalType =
    | "universitar" | "judetean" | "municipal" | "clinic"
    | "monoprofil-ortopedie" | "monoprofil-og" | "pediatrie"
    | "general-garda" | "ambulator-sdz";

export type SiteBasics = {
    type: HospitalType | null;
    beds: number | null;
};

export type GuardType = "none" | "inhouse" | "oncall" | "shared";

export type HospitalProfile = {
    hospitalId: string;
    onboardingCompleted: boolean;
    type: HospitalType | null;
    beds: number | null;
    typeNote?: string;
    multiSite: boolean;
    sites: Site[];
    siteBasics: Record<string, SiteBasics>;
    sectionsBySite: Record<string, Record<string, boolean>>;
    guardBySite: Record<string, Record<string, GuardType>>;
};

const KEY = (hospitalId: string) => `hp_profile_${hospitalId}`;

export function loadHospitalProfile(hospitalId: string): HospitalProfile | null {
    try {
        const raw = localStorage.getItem(KEY(hospitalId));
        return raw ? (JSON.parse(raw) as HospitalProfile) : null;
    } catch {
        return null;
    }
}

export function saveHospitalProfile(profile: HospitalProfile) {
    localStorage.setItem(KEY(profile.hospitalId), JSON.stringify(profile));
}

export function ensureDefaultProfile(hospitalId: string): HospitalProfile {
    const existing = loadHospitalProfile(hospitalId);
    if (existing) {
        if (!existing.siteBasics) {
            existing.siteBasics = { MAIN: { type: existing.type ?? null, beds: existing.beds ?? null } };
        }
        if (!existing.sites || existing.sites.length === 0) {
            existing.sites = [{ code: "MAIN", name: "Sediu principal" }];
        }
        if (!existing.sectionsBySite) existing.sectionsBySite = { MAIN: {} };
        if (!existing.guardBySite) existing.guardBySite = {};
        for (const s of existing.sites) {
            if (!existing.siteBasics[s.code]) existing.siteBasics[s.code] = { type: null, beds: null };
            if (!existing.sectionsBySite[s.code]) existing.sectionsBySite[s.code] = {};
            if (!existing.guardBySite[s.code]) existing.guardBySite[s.code] = {};
            const secMap = existing.sectionsBySite[s.code];
            const guardMap = existing.guardBySite[s.code];
            for (const secId of Object.keys(secMap)) {
                if (secMap[secId] && !guardMap[secId]) guardMap[secId] = "none";
            }
        }
        saveHospitalProfile(existing);
        return existing;
    }
    const profile: HospitalProfile = {
        hospitalId,
        onboardingCompleted: false,
        type: null,
        beds: null,
        typeNote: "",
        multiSite: false,
        sites: [{ code: "MAIN", name: "Sediu principal" }],
        siteBasics: { MAIN: { type: null, beds: null } },
        sectionsBySite: { MAIN: {} },
        guardBySite: { MAIN: {} },
    };
    saveHospitalProfile(profile);
    return profile;
}

export function setOnboardingCompleted(hospitalId: string, val: boolean) {
    const p = ensureDefaultProfile(hospitalId);
    p.onboardingCompleted = val;
    saveHospitalProfile(p);
}

export function setOnboardingFlag(hospitalId: string, val: boolean) {
    setOnboardingCompleted(hospitalId, val);
}

export function setHospitalBasics(
    hospitalId: string,
    type: HospitalType,
    beds: number,
    multiSite: boolean,
    sites: Site[],
    opts?: { typeNote?: string }
) {
    const p = ensureDefaultProfile(hospitalId);
    p.type = type;
    p.beds = beds;
    p.multiSite = multiSite;
    p.typeNote = opts?.typeNote ?? p.typeNote ?? "";
    p.sites = multiSite ? sites : [{ code: "MAIN", name: "Sediu principal" }];
    for (const s of p.sites) {
        if (!p.siteBasics[s.code]) p.siteBasics[s.code] = { type: null, beds: null };
        if (!p.sectionsBySite[s.code]) p.sectionsBySite[s.code] = {};
        if (!p.guardBySite[s.code]) p.guardBySite[s.code] = {};
    }
    if (!multiSite) {
        p.siteBasics = { MAIN: { type, beds } };
        p.sectionsBySite = { MAIN: p.sectionsBySite["MAIN"] ?? {} };
        p.guardBySite = { MAIN: p.guardBySite["MAIN"] ?? {} };
    }
    saveHospitalProfile(p);
}

export function setTypeNote(hospitalId: string, note: string) {
    const p = ensureDefaultProfile(hospitalId);
    p.typeNote = note;
    saveHospitalProfile(p);
}

export function setSiteBasics(hospitalId: string, siteCode: string, basics: SiteBasics) {
    const p = ensureDefaultProfile(hospitalId);
    p.siteBasics[siteCode] = basics;
    saveHospitalProfile(p);
}

export function toggleSection(hospitalId: string, siteCode: string, sectionId: string, enabled: boolean) {
    const p = ensureDefaultProfile(hospitalId);
    if (!p.sectionsBySite[siteCode]) p.sectionsBySite[siteCode] = {};
    p.sectionsBySite[siteCode][sectionId] = enabled;
    if (!p.guardBySite[siteCode]) p.guardBySite[siteCode] = {};
    if (enabled) {
        if (!p.guardBySite[siteCode][sectionId]) p.guardBySite[siteCode][sectionId] = "none";
    } else {
        delete p.guardBySite[siteCode][sectionId];
    }
    saveHospitalProfile(p);
}

export function bulkSetSections(hospitalId: string, siteCode: string, updates: Record<string, boolean>) {
    const p = ensureDefaultProfile(hospitalId);
    if (!p.sectionsBySite[siteCode]) p.sectionsBySite[siteCode] = {};
    if (!p.guardBySite[siteCode]) p.guardBySite[siteCode] = {};
    for (const [secId, val] of Object.entries(updates)) {
        p.sectionsBySite[siteCode][secId] = val;
        if (val) p.guardBySite[siteCode][secId] = p.guardBySite[siteCode][secId] ?? "none";
        else delete p.guardBySite[siteCode][secId];
    }
    saveHospitalProfile(p);
}

export function setGuardType(hospitalId: string, siteCode: string, sectionId: string, guard: GuardType) {
    const p = ensureDefaultProfile(hospitalId);
    if (!p.guardBySite[siteCode]) p.guardBySite[siteCode] = {};
    p.guardBySite[siteCode][sectionId] = guard;
    saveHospitalProfile(p);
}

export function softRestartOnboarding(hospitalId: string) {
    const p = ensureDefaultProfile(hospitalId);
    p.onboardingCompleted = false;
    saveHospitalProfile(p);
}

export function hardResetHospital(hospitalId: string) {
    try {
        localStorage.removeItem(KEY(hospitalId));
    } catch { }
    ensureDefaultProfile(hospitalId);
}

// util pentru export
export function getProfileSnapshot(hospitalId: string) {
    const p = ensureDefaultProfile(hospitalId);
    return {
        meta: { exportedAt: new Date().toISOString(), hospitalId: p.hospitalId },
        profile: p,
    };
}
