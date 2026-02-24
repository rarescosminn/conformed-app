"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getHospitalId } from "@/lib/context/tenant";
import { normalizeRo } from "@/lib/string/normalizeRo";
import { SECTIONS_MASTER } from "@/lib/sections/master";
import {
    ensureDefaultProfile,
    setHospitalBasics,
    setOnboardingCompleted,
    setTypeNote as persistTypeNote,
    setSiteBasics as persistSiteBasics,
    toggleSection,
    bulkSetSections,
    setGuardType,
    type HospitalType,
    type Site,
    type SiteBasics,
    type GuardType,
} from "@/lib/sections/storage";
import { audit } from "@/lib/audit";

/* ====================== Helpers vizuale ====================== */
function Toast({ text, onClose }: { text: string; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 2200);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="fixed bottom-4 right-4 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-lg">
            <div className="text-sm">{text}</div>
        </div>
    );
}
function StepDot({ active, label }: { active: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={active ? "h-3 w-3 rounded-full bg-black" : "h-3 w-3 rounded-full bg-gray-300"} />
            <div className={active ? "text-sm font-medium" : "text-sm text-gray-500"}>{label}</div>
        </div>
    );
}

/* ====================== Preseturi pe tip spital ====================== */
/* Ajustează ID-urile secțiilor să corespundă cu SECTIONS_MASTER */
type Preset = { id: string; guard: GuardType };
const PRESET_SECTIONS: Record<HospitalType, Preset[]> = {
    universitar: [
        { id: "ATI", guard: "inhouse" },
        { id: "UPU", guard: "inhouse" },
        { id: "BlocOperator", guard: "inhouse" },
        { id: "ChirurgieGenerala", guard: "inhouse" },
        { id: "OG", guard: "inhouse" },
        { id: "Pediatrie", guard: "inhouse" },
        { id: "Ortopedie", guard: "inhouse" },
        { id: "Nefrologie", guard: "oncall" },
    ],
    judetean: [
        { id: "ATI", guard: "inhouse" },
        { id: "UPU", guard: "inhouse" },
        { id: "BlocOperator", guard: "inhouse" },
        { id: "ChirurgieGenerala", guard: "inhouse" },
        { id: "OG", guard: "inhouse" },
        { id: "Pediatrie", guard: "inhouse" },
    ],
    municipal: [
        { id: "ATI", guard: "inhouse" },
        { id: "ChirurgieGenerala", guard: "inhouse" },
        { id: "OG", guard: "oncall" },
    ],
    clinic: [
        { id: "BlocOperator", guard: "inhouse" },
        { id: "ATI", guard: "oncall" },
    ],
    "monoprofil-ortopedie": [
        { id: "Ortopedie", guard: "inhouse" },
        { id: "ATI", guard: "inhouse" },
        { id: "BlocOperator", guard: "inhouse" },
    ],
    "monoprofil-og": [
        { id: "OG", guard: "inhouse" },
        { id: "Neonatologie", guard: "inhouse" },
        { id: "ATI", guard: "inhouse" },
        { id: "BlocOperator", guard: "inhouse" },
    ],
    pediatrie: [
        { id: "Pediatrie", guard: "inhouse" },
        { id: "ATI", guard: "oncall" },
    ],
    "general-garda": [
        { id: "ChirurgieGenerala", guard: "inhouse" },
        { id: "ATI", guard: "inhouse" },
        { id: "BlocOperator", guard: "inhouse" },
        { id: "OG", guard: "oncall" },
    ],
    "ambulator-sdz": [],
};
const MASTER_IDS = new Set(SECTIONS_MASTER.map((s) => s.id));
const presetExists = (p: Preset) => MASTER_IDS.has(p.id);

/* ====================== PASUL 2 – Secții ====================== */
function Pasul2(props: {
    multi: boolean;
    sites: Site[];
    activeSite: string;
    setActiveSite: (v: string) => void;
    search: string;
    setSearch: (v: string) => void;
    showOnlySelected: boolean;
    setShowOnlySelected: (v: boolean) => void;
    sectionsBySite: Record<string, Record<string, boolean>>;
    onToggle: (sectionId: string, enabled: boolean, siteCode: string) => void;
    onSelectAll: (val: boolean) => void;
}) {
    const {
        multi,
        sites,
        activeSite,
        setActiveSite,
        search,
        setSearch,
        showOnlySelected,
        setShowOnlySelected,
        sectionsBySite,
        onToggle,
        onSelectAll,
    } = props;

    const totalSections = SECTIONS_MASTER.length;

    const filtered = useMemo(() => {
        const q = normalizeRo(search);
        const list = SECTIONS_MASTER
            .filter((s) => (q ? normalizeRo(s.name).includes(q) || normalizeRo(s.code).includes(q) : true))
            .sort((a, b) => a.name.localeCompare(b.name, "ro"));
        if (!showOnlySelected) return list;
        const selectedMap = sectionsBySite[activeSite] || {};
        return list.filter((s) => !!selectedMap[s.id]);
    }, [search, showOnlySelected, activeSite, sectionsBySite]);

    const selectedCount = Object.values(sectionsBySite[activeSite] || {}).filter(Boolean).length;

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <input
                    className="rounded-xl border px-3 py-2"
                    placeholder="Caută secția…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={showOnlySelected}
                        onChange={(e) => setShowOnlySelected(e.target.checked)}
                    />
                    Afișează doar selectatele
                </label>

                {multi && (
                    <>
                        <span className="mx-2 text-sm text-gray-500">Locație activă:</span>
                        <select
                            className="rounded-xl border px-3 py-2"
                            value={activeSite}
                            onChange={(e) => setActiveSite(e.target.value)}
                        >
                            {sites.map((s) => (
                                <option key={s.code} value={s.code}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {selectedCount} / {totalSections}
                    </span>
                    <button type="button" onClick={() => onSelectAll(true)} className="rounded-xl border px-3 py-2">
                        Selectează tot
                    </button>
                    <button type="button" onClick={() => onSelectAll(false)} className="rounded-xl border px-3 py-2">
                        Deselectează tot
                    </button>
                </div>
            </div>

            {/* listă simplă checkboxuri (nu tabel) */}
            <div className="grid gap-2 rounded-2xl border p-3 bg-white">
                {filtered.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        {showOnlySelected ? "Nu ai nicio secție selectată." : "Nicio secție găsită."}
                    </div>
                ) : (
                    filtered.map((sec) => (
                        <label
                            key={sec.id}
                            className={`guard-row cursor-pointer ${activeSite ? "" : ""}`}
                            title={sec.code}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={!!(sectionsBySite[activeSite] || {})[sec.id]}
                                    onChange={(e) => onToggle(sec.id, e.target.checked, activeSite)}
                                />
                                <div className="font-medium">{sec.name}</div>
                            </div>
                        </label>
                    ))
                )}
            </div>
        </>
    );
}

/* ====================== PASUL 3 – Linii de gardă (fără tabel) ====================== */
function Pasul3Garda(props: {
    multi: boolean;
    sites: Site[];
    activeSite: string;
    setActiveSite: (v: string) => void;
    sectionsBySite: Record<string, Record<string, boolean>>;
    guardBySite: Record<string, Record<string, GuardType>>;
    onSetGuard: (siteCode: string, sectionId: string, g: GuardType) => void;
}) {
    const { multi, sites, activeSite, setActiveSite, sectionsBySite, guardBySite, onSetGuard } = props;

    const activeSections = useMemo(() => {
        const map = sectionsBySite[activeSite] || {};
        return SECTIONS_MASTER.filter((s) => map[s.id]).sort((a, b) => a.name.localeCompare(b.name, "ro"));
    }, [activeSite, sectionsBySite]);

    const options: [GuardType, string, string][] = [
        ["none", "Nu are gardă", "chip--none"],
        ["inhouse", "Gardă cu medic în spital (24/7)", "chip--inhouse"],
        ["oncall", "Gardă fără medic (on-call)", "chip--oncall"],
        ["shared", "Gardă partajată", "chip--shared"],
    ];

    return (
        <div className="grid gap-3">
            {multi && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Locație:</span>
                    <select
                        className="rounded-xl border px-3 py-2"
                        value={activeSite}
                        onChange={(e) => setActiveSite(e.target.value)}
                    >
                        {sites.map((s) => (
                            <option key={s.code} value={s.code}>
                                {s.name} ({s.code})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {activeSections.length === 0 && (
                <div className="text-sm text-gray-600">Nu există secții active pentru această locație.</div>
            )}

            {activeSections.map((sec) => {
                const cur = guardBySite[activeSite]?.[sec.id] || "none";
                return (
                    <div key={sec.id} className="guard-row">
                        <div className="guard-left">{sec.name}</div>
                        <div className="guard-right">
                            {options.map(([val, label, cls]) => {
                                const active = cur === val;
                                return (
                                    <label key={val} className={`chip ${active ? cls : "chip--neutral"} cursor-pointer`} title={label}>
                                        <input
                                            type="radio"
                                            name={`guard_${activeSite}_${sec.id}`}
                                            checked={cur === val}
                                            onChange={() => onSetGuard(activeSite, sec.id, val)}
                                            style={{ marginRight: 8 }}
                                        />
                                        {label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ====================== Pagina principală ====================== */
type Step = 1 | 2 | 3;

const TYPES: { key: HospitalType; title: string; subtitle: string }[] = [
    { key: "universitar", title: "Spital Universitar", subtitle: "Centre regionale, institute clinice" },
    { key: "judetean", title: "Spital Județean", subtitle: "Nivel II, majoritatea specialităților" },
    { key: "municipal", title: "Spital Municipal", subtitle: "Nivel III, specialități principale" },
    { key: "clinic", title: "Clinic (privat)", subtitle: "Bloc operator, investigații, fără UPU/ATI uzual" },
    { key: "monoprofil-ortopedie", title: "Monoprofil – Ortopedie", subtitle: "Dedicat ortopediei" },
    { key: "monoprofil-og", title: "Monoprofil – Obstetrică–Ginecologie", subtitle: "Materno-infantil" },
    { key: "pediatrie", title: "Pediatrie", subtitle: "Spital pentru copii" },
    { key: "general-garda", title: "General cu linii de gardă", subtitle: "Nucleu chirurgical + materno-infantil" },
    { key: "ambulator-sdz", title: "Ambulator + SDZ", subtitle: "Unități de zi, fără gardă" },
];

export default function OnboardingPage() {
    const HOSPITAL_ID = getHospitalId();
    const router = useRouter();
    const search = useSearchParams();
    const fromSettings = search.get("ref") === "setari";

    const [step, setStep] = useState<Step>(1);
    const [completedFlag, setCompletedFlag] = useState(false);
    const [toast, setToast] = useState("");

    // globale
    const [type, setType] = useState<HospitalType | null>(null);
    const [beds, setBeds] = useState<string>("");
    const [typeNote, setTypeNote] = useState<string>("");
    const [multi, setMulti] = useState(false);
    const [sites, setSites] = useState<Site[]>([{ code: "MAIN", name: "Sediu principal" }]);

    // basics per site
    const [siteBasics, setSiteBasicsState] = useState<Record<string, SiteBasics>>({ MAIN: { type: null, beds: null } });

    // pas 2
    const [activeSite, setActiveSite] = useState<string>("MAIN");
    const [searchText, setSearchText] = useState("");
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    const [sectionsBySite, setSectionsBySite] = useState<Record<string, Record<string, boolean>>>({ MAIN: {} });

    // gărzi
    const [guardBySite, setGuardBySite] = useState<Record<string, Record<string, GuardType>>>({});

    // altele
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [storageOk, setStorageOk] = useState(true);
    const [allowNoSectionsOverride, setAllowNoSectionsOverride] = useState(false);

    /* INIT */
    useEffect(() => {
        try {
            localStorage.setItem("__probe", "1");
            localStorage.removeItem("__probe");
            setStorageOk(true);
        } catch {
            setStorageOk(false);
        }
        const p = ensureDefaultProfile(HOSPITAL_ID);
        setCompletedFlag(!!p.onboardingCompleted);
        setType(p.type);
        setBeds(p.beds ? String(p.beds) : "");
        setTypeNote(p.typeNote ?? "");
        setMulti(p.multiSite);
        const initSites = p.multiSite ? (p.sites.length ? p.sites : []) : [{ code: "MAIN", name: "Sediu principal" }];
        setSites(initSites);
        setSiteBasicsState(p.siteBasics || { MAIN: { type: p.type ?? null, beds: p.beds ?? null } });
        setSectionsBySite(p.sectionsBySite || { MAIN: {} });
        setGuardBySite(p.guardBySite || {});
        setActiveSite(p.multiSite ? (p.sites[0]?.code ?? "MAIN") : "MAIN");
        setProfileLoaded(true);
    }, [HOSPITAL_ID]);

    /* Validări pas 1 */
    const siteCodes = new Set(sites.map((s) => s.code));
    const uniqueCodes = siteCodes.size === sites.length;
    const validSiteCodes = sites.every((s) => /^[A-Z0-9_-]+$/.test(s.code));
    const perSiteValid = !multi
        ? true
        : sites.every((s) => {
            const b = siteBasics[s.code];
            return b && b.type && (b.beds ?? 0) > 0;
        });
    const canNextFromStep1 =
        Boolean(type) && Number(beds) > 0 && (!multi || (sites.length >= 2 && uniqueCodes && validSiteCodes && perSiteValid));

    /* număr selectate pe site */
    const selectedCountBySite = useMemo(() => {
        const map: Record<string, number> = {};
        for (const s of sites) map[s.code] = Object.values(sectionsBySite[s.code] || {}).filter(Boolean).length;
        return map;
    }, [sites, sectionsBySite]);
    const canProceedStrict =
        (!multi && (selectedCountBySite["MAIN"] ?? 0) > 0) ||
        (multi && sites.every((s) => (selectedCountBySite[s.code] ?? 0) > 0));

    /* OPS – site-uri */
    function addSiteRow() {
        let idx = sites.length + 1;
        let code = `EXT${idx}`;
        while (sites.some((s) => s.code === code)) {
            idx++;
            code = `EXT${idx}`;
        }
        const next = [...sites, { code, name: `Locație ${idx}` }];
        setSites(next);
        setSectionsBySite((prev) => ({ ...prev, [code]: prev[code] || {} }));
        setSiteBasicsState((prev) => ({ ...prev, [code]: { type: null, beds: null } }));
        setGuardBySite((prev) => ({ ...prev, [code]: prev[code] || {} }));
    }
    function updateSite(i: number, field: "code" | "name" | "address", value: string) {
        const prevCode = sites[i].code;
        const next = [...sites];
        if (field === "code") (next[i] as any)[field] = value.toUpperCase().replace(/\s+/g, "");
        else (next[i] as any)[field] = value;
        setSites(next);
        if (field === "code" && prevCode !== next[i].code) {
            setSectionsBySite((prev) => {
                const cp = { ...prev };
                cp[next[i].code] = cp[prevCode] || {};
                delete cp[prevCode];
                return cp;
            });
            setSiteBasicsState((prev) => {
                const cp = { ...prev };
                cp[next[i].code] = cp[prevCode] || { type: null, beds: null };
                delete cp[prevCode];
                return cp;
            });
            setGuardBySite((prev) => {
                const cp = { ...prev };
                cp[next[i].code] = cp[prevCode] || {};
                delete cp[prevCode];
                return cp;
            });
            if (activeSite === prevCode) setActiveSite(next[i].code);
        }
    }
    function removeSite(i: number) {
        if (multi && sites.length <= 2) return;
        const sc = sites[i].code;
        const next = sites.filter((_, k) => k !== i);
        setSites(next);
        setSectionsBySite((prev) => {
            const cp = { ...prev };
            delete cp[sc];
            return cp;
        });
        setSiteBasicsState((prev) => {
            const cp = { ...prev };
            delete cp[sc];
            return cp;
        });
        setGuardBySite((prev) => {
            const cp = { ...prev };
            delete cp[sc];
            return cp;
        });
        if (activeSite === sc) setActiveSite(next[0]?.code ?? "MAIN");
    }

    /* Persist pas 1 */
    function persistStep1() {
        setHospitalBasics(
            HOSPITAL_ID,
            type!,
            Number(beds),
            multi,
            multi ? sites : [{ code: "MAIN", name: "Sediu principal" }],
            { typeNote }
        );
        if (multi) {
            for (const s of sites) {
                const b = siteBasics[s.code] || { type: null, beds: null };
                persistSiteBasics(HOSPITAL_ID, s.code, b);
            }
        } else {
            persistSiteBasics(HOSPITAL_ID, "MAIN", { type, beds: Number(beds) });
        }
        persistTypeNote(HOSPITAL_ID, typeNote);
        audit({ scope: "hospital", hospitalId: HOSPITAL_ID, action: "onboarding_step1_saved", details: { type, beds, multi } });
        setToast("Datele de bază au fost salvate.");
    }

    /* Secții */
    function handleToggleSection(sectionId: string, enabled: boolean, siteCode: string) {
        toggleSection(HOSPITAL_ID, siteCode, sectionId, enabled);
        setSectionsBySite((prev) => ({
            ...prev,
            [siteCode]: { ...(prev[siteCode] || {}), [sectionId]: enabled },
        }));
        if (!enabled) {
            setGuardBySite((prev) => {
                const cp = { ...prev };
                if (cp[siteCode]) delete cp[siteCode][sectionId];
                return cp;
            });
        }
    }
    function selectAllForActiveSite(val: boolean) {
        const updates: Record<string, boolean> = {};
        for (const s of SECTIONS_MASTER) updates[s.id] = val;
        bulkSetSections(HOSPITAL_ID, activeSite, updates);
        setSectionsBySite((prev) => ({
            ...prev,
            [activeSite]: { ...(prev[activeSite] || {}), ...updates },
        }));
        if (!val) setGuardBySite((prev) => ({ ...prev, [activeSite]: {} }));
    }

    /* Gărzi */
    function handleSetGuard(siteCode: string, sectionId: string, g: GuardType) {
        setGuardType(HOSPITAL_ID, siteCode, sectionId, g); // persist
        setGuardBySite((prev) => ({
            ...prev,
            [siteCode]: { ...(prev[siteCode] || {}), [sectionId]: g }, // UI live
        }));
    }

    /* Preseturi */
    function applyPresetsForSite(siteCode: string, hType: HospitalType | null) {
        if (!hType) return;
        const preset = (PRESET_SECTIONS[hType] || []).filter(presetExists);
        if (preset.length === 0) return;
        const updates: Record<string, boolean> = {};
        for (const p of preset) updates[p.id] = true;
        bulkSetSections(HOSPITAL_ID, siteCode, updates);
        setSectionsBySite((prev) => ({
            ...prev,
            [siteCode]: { ...(prev[siteCode] || {}), ...updates },
        }));
        setGuardBySite((prev) => {
            const cp = { ...prev, [siteCode]: { ...(prev[siteCode] || {}) } };
            for (const p of preset) cp[siteCode][p.id] = p.guard;
            return cp;
        });
    }
    function applyPresets() {
        if (!multi) applyPresetsForSite("MAIN", type);
        else for (const s of sites) applyPresetsForSite(s.code, siteBasics[s.code]?.type ?? null);
        setToast("Preseturile au fost aplicate.");
    }

    /* Navigare */
    function goNextFromStep1() {
        persistStep1();
        setStep(2);
    }
    function goNextFromStep2() {
        if (!(canProceedStrict || allowNoSectionsOverride)) return;
        for (const site of sites) {
            const map = sectionsBySite[site.code] || {};
            for (const secId of Object.keys(map)) {
                if (map[secId] && !guardBySite[site.code]?.[secId]) handleSetGuard(site.code, secId, "none");
            }
        }
        setStep(3);
        audit({ scope: "hospital", hospitalId: HOSPITAL_ID, action: "onboarding_step2_saved" });
    }
    function finish() {
        setOnboardingCompleted(HOSPITAL_ID, true);
        setCompletedFlag(true);
        document.cookie = `features_sectionsPersonalizate=1; path=/; SameSite=Lax`;
        document.cookie = `onboardingCompleted=1; path=/; SameSite=Lax`;
        audit({ scope: "hospital", hospitalId: HOSPITAL_ID, action: "onboarding_completed" });
        try {
            window.location.assign("/dashboard");
        } catch {
            window.location.href = "/";
        }
    }

    /* Rezumat + export */
    const summary = useMemo(() => {
        const perSite = sites.map((s) => {
            const b = siteBasics[s.code];
            const secMap = sectionsBySite[s.code] || {};
            const activeIds = Object.keys(secMap).filter((k) => secMap[k]);
            return {
                site: s,
                basics: b,
                sectionsActive: activeIds.map((id) => {
                    const meta = SECTIONS_MASTER.find((m) => m.id === id);
                    const guardType = (guardBySite[s.code] && guardBySite[s.code][id]) || "none";
                    return { id, name: meta?.name || id, guardType };
                }),
            };
        });
        return { type, beds: Number(beds) || null, multi, sites: perSite };
    }, [type, beds, multi, sites, siteBasics, sectionsBySite, guardBySite]);

    function exportJSON() {
        const data = {
            hospitalId: HOSPITAL_ID,
            type,
            beds: Number(beds) || null,
            typeNote,
            multi,
            sites,
            siteBasics,
            sectionsBySite,
            guardBySite,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `onboarding_${HOSPITAL_ID}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setToast("Config exportat ca JSON.");
    }

    if (!profileLoaded) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {toast && <Toast text={toast} onClose={() => setToast("")} />}

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Configurare inițială spital</h1>
                        <p className="text-gray-600">Finalizează pașii pentru a activa profilul spitalului.</p>
                    </div>
                    <span
                        className={`rounded-full border px-3 py-1 text-sm ${completedFlag
                                ? "border-green-300 bg-green-50 text-green-700"
                                : "border-amber-300 bg-amber-50 text-amber-800"
                            }`}
                    >
                        {completedFlag ? "Finalizat" : "Necompletat"}
                    </span>
                </div>

                {!storageOk && (
                    <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                        Atenție: stocarea locală e dezactivată. Modificările pot să nu se salveze persistent.
                    </div>
                )}

                {fromSettings && (
                    <div className="mb-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                        <div className="text-sm text-gray-700">
                            Editezi configurația existentă (ai ajuns din Setări). Poți anula oricând.
                        </div>
                        <button type="button" className="rounded-xl border px-3 py-1" onClick={() => router.push("/setari")}>
                            Anulează și revino la Setări
                        </button>
                    </div>
                )}

                <div className="flex gap-2 mb-8">
                    <StepDot active={step === 1} label="Tip spital" />
                    <StepDot active={step === 2} label="Secții" />
                    <StepDot active={step === 3} label="Linii de gardă & Rezumat" />
                </div>

                {/* PAS 1 */}
                {step === 1 && (
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm mb-1">Alege tipul spitalului (obligatoriu)</label>
                            <select
                                value={type ?? ""}
                                onChange={(e) => setType((e.target.value || null) as HospitalType | null)}
                                className="w-full rounded-xl border px-3 py-2"
                            >
                                <option value="">— Selectează —</option>
                                {TYPES.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.title} — {t.subtitle}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-1 text-xs text-gray-600">
                                Tip selectat: <strong>{type ?? "—"}</strong>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border p-3">
                                <div className="font-medium mb-2">…sau selectează din lista detaliată:</div>
                                <div role="radiogroup" className="grid grid-cols-1 gap-2">
                                    {TYPES.map((t) => (
                                        <label key={t.key} className="flex items-start gap-2 rounded-xl border p-2 cursor-pointer">
                                            <input type="radio" name="hospitalType" checked={type === t.key} onChange={() => setType(t.key)} />
                                            <div>
                                                <div className="text-sm text-gray-500">{t.subtitle}</div>
                                                <div className="font-medium">{t.title}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
                                <div className="font-medium mb-2">Descriere (opțional)</div>
                                <textarea
                                    value={typeNote}
                                    onChange={(e) => setTypeNote(e.target.value)}
                                    className="min-h-[260px] w-full rounded-xl border px-3 py-2"
                                    placeholder="Note interne despre rol didactic, linii obligatorii, particularități..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm mb-1">Număr paturi (obligatoriu)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={beds}
                                    onChange={(e) => setBeds(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2"
                                    placeholder="ex. 350"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3">
                                <input id="multi" type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
                                <label htmlFor="multi" className="text-sm">Multi-locație</label>
                            </div>
                        </div>

                        {multi && (
                            <div className="rounded-2xl border p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium">Locații</div>
                                    <button type="button" onClick={addSiteRow} className="rounded-xl border px-3 py-1">
                                        Adaugă locație
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-4">
                                    {sites.map((s, i) => (
                                        <div key={s.code + i} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                value={s.code}
                                                onChange={(e) => updateSite(i, "code", e.target.value)}
                                                className="col-span-2 rounded-xl border px-3 py-2"
                                                placeholder="COD"
                                            />
                                            <input
                                                value={s.name}
                                                onChange={(e) => updateSite(i, "name", e.target.value)}
                                                className="col-span-6 rounded-xl border px-3 py-2"
                                                placeholder="Nume locație"
                                            />
                                            <input
                                                value={s.address ?? ""}
                                                onChange={(e) => updateSite(i, "address", e.target.value)}
                                                className="col-span-3 rounded-xl border px-3 py-2"
                                                placeholder="Adresă (opțional)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSite(i)}
                                                disabled={sites.length <= 2}
                                                className="col-span-1 rounded-xl border px-3 py-2 disabled:opacity-50"
                                                title={sites.length <= 2 ? "Minim 2 locații" : "Șterge"}
                                            >
                                                Șterge
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="text-left p-3 w-[22%]">Locație</th>
                                                <th className="text-left p-3 w-[46%]">Tip (per locație)</th>
                                                <th className="text-left p-3 w-[16%]">Paturi</th>
                                                <th className="text-left p-3 w-[16%]">Valid</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sites.map((s) => {
                                                const b = siteBasics[s.code] || { type: null, beds: null };
                                                const ok = Boolean(b.type) && Number(b.beds ?? 0) > 0;
                                                return (
                                                    <tr key={s.code} className="border-t">
                                                        <td className="p-3">
                                                            {s.name} ({s.code})
                                                        </td>
                                                        <td className="p-3">
                                                            <select
                                                                value={b.type ?? ""}
                                                                onChange={(e) => {
                                                                    const v = (e.target.value || null) as HospitalType | null;
                                                                    setSiteBasicsState((prev) => ({ ...prev, [s.code]: { ...prev[s.code], type: v } }));
                                                                    persistSiteBasics(HOSPITAL_ID, s.code, { type: v, beds: b.beds ?? null });
                                                                }}
                                                                className="w-full rounded-xl border px-2 py-1"
                                                            >
                                                                <option value="">— Selectează —</option>
                                                                {TYPES.map((t) => (
                                                                    <option key={t.key} value={t.key}>
                                                                        {t.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={b.beds ?? ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === "" ? null : Number(e.target.value);
                                                                    setSiteBasicsState((prev) => ({ ...prev, [s.code]: { ...prev[s.code], beds: val } }));
                                                                    persistSiteBasics(HOSPITAL_ID, s.code, { type: b.type ?? null, beds: val });
                                                                }}
                                                                className="w-full rounded-xl border px-2 py-1"
                                                                placeholder="ex. 120"
                                                            />
                                                        </td>
                                                        <td className="p-3">{ok ? "✔" : "—"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <button type="button" onClick={exportJSON} className="rounded-2xl border px-4 py-2">
                                Exportă configurarea (JSON)
                            </button>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        persistStep1();
                                        applyPresets();
                                    }}
                                    disabled={!canNextFromStep1}
                                    className={canNextFromStep1 ? "rounded-2xl px-4 py-2 border" : "rounded-2xl px-4 py-2 border opacity-50"}
                                >
                                    Aplică preseturi
                                </button>

                                <button
                                    type="button"
                                    onClick={goNextFromStep1}
                                    disabled={!canNextFromStep1}
                                    className={
                                        canNextFromStep1 ? "rounded-2xl px-4 py-2 bg-black text-white" : "rounded-2xl px-4 py-2 bg-gray-200 text-gray-500"
                                    }
                                >
                                    Continuă
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PAS 2 */}
                {step === 2 && (
                    <div className="grid gap-6">
                        <Pasul2
                            multi={multi}
                            sites={sites}
                            activeSite={activeSite}
                            setActiveSite={setActiveSite}
                            search={searchText}
                            setSearch={setSearchText}
                            showOnlySelected={showOnlySelected}
                            setShowOnlySelected={setShowOnlySelected}
                            sectionsBySite={sectionsBySite}
                            onToggle={handleToggleSection}
                            onSelectAll={selectAllForActiveSite}
                        />

                        {multi && (
                            <div className="text-sm text-gray-600">
                                {sites.map((s) => {
                                    const n = selectedCountBySite[s.code] ?? 0;
                                    return (
                                        <div key={s.code}>
                                            {s.name} ({s.code}): <b>{n}</b> secții active
                                            {n === 0 && <span className="text-red-600"> — niciuna selectată</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={allowNoSectionsOverride}
                                    onChange={(e) => setAllowNoSectionsOverride(e.target.checked)}
                                />
                                Permite finalizarea fără secții selectate acum (setez ulterior).
                            </label>

                            <div className="flex gap-3">
                                <button type="button" onClick={applyPresets} className="rounded-2xl border px-4 py-2">
                                    Aplică preseturi
                                </button>

                                <button type="button" onClick={() => setStep(1)} className="rounded-2xl border px-4 py-2">
                                    Înapoi
                                </button>
                                <button
                                    type="button"
                                    onClick={goNextFromStep2}
                                    disabled={!(canProceedStrict || allowNoSectionsOverride)}
                                    className={
                                        canProceedStrict || allowNoSectionsOverride
                                            ? "rounded-2xl px-4 py-2 bg-black text-white"
                                            : "rounded-2xl px-4 py-2 bg-gray-200 text-gray-500"
                                    }
                                >
                                    Continuă
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PAS 3 */}
                {step === 3 && (
                    <div className="grid gap-6">
                        <div className="rounded-2xl border p-6 bg-white">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-lg font-medium">Linii de gardă</div>
                                <button type="button" className="rounded-xl border px-3 py-1" onClick={exportJSON}>
                                    Exportă configurarea (JSON)
                                </button>
                            </div>

                            <Pasul3Garda
                                multi={multi}
                                sites={sites}
                                activeSite={activeSite}
                                setActiveSite={setActiveSite}
                                sectionsBySite={sectionsBySite}
                                guardBySite={guardBySite}
                                onSetGuard={handleSetGuard}
                            />
                        </div>

                        {/* REZUMAT */}
                        <div className="rounded-2xl border p-6 bg-white">
                            <div className="text-lg font-medium mb-3">Rezumat</div>
                            <div className="text-sm text-gray-700 mb-2">
                                Tip: <b>{type ?? "—"}</b> • Paturi: <b>{beds || "—"}</b> • Multi-locație: <b>{multi ? "Da" : "Nu"}</b>
                            </div>

                            <div className="grid gap-3">
                                {summary.sites.map((s) => (
                                    <div key={s.site.code} className="rounded-xl border p-4 space-y-2 bg-white">
                                        <div className="font-medium">
                                            {s.site.name} ({s.site.code})
                                        </div>
                                        <div className="text-[13px] text-gray-600">
                                            Tip: {s.basics?.type ?? "—"} • Paturi: {s.basics?.beds ?? "—"} • Secții active: {s.sectionsActive.length}
                                        </div>

                                        {s.sectionsActive.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {s.sectionsActive.map((sec) => (
                                                    <span
                                                        key={sec.id}
                                                        className={`chip ${sec.guardType === "inhouse"
                                                                ? "chip--inhouse"
                                                                : sec.guardType === "oncall"
                                                                    ? "chip--oncall"
                                                                    : sec.guardType === "shared"
                                                                        ? "chip--shared"
                                                                        : "chip--none"
                                                            }`}
                                                        title={
                                                            sec.guardType === "none"
                                                                ? "Nu are gardă"
                                                                : sec.guardType === "inhouse"
                                                                    ? "Gardă cu medic în spital (24/7)"
                                                                    : sec.guardType === "oncall"
                                                                        ? "Gardă fără medic (on-call)"
                                                                        : "Gardă partajată"
                                                        }
                                                    >
                                                        {sec.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">Nicio secție activă.</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setStep(2)} className="rounded-2xl border px-4 py-2">
                                Înapoi
                            </button>
                            <button type="button" onClick={finish} className="rounded-2xl bg-black text-white px-4 py-2">
                                Confirmă și intră în aplicație
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
