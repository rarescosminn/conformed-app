/* ============================
   Carduri Mentenanță (MVP) – frecvențe în română
   ============================ */

export type Frecventa =
    | "zilnic"
    | "saptamanal"
    | "lunar"
    | "trimestrial"
    | "semestrial"
    | "anual";

export type FieldType = "number" | "text" | "boolean" | "photo" | "file" | "select";

export type Field = {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    options?: { value: string; label: string }[];
};

export type MaintenanceCard = {
    id: string;
    title: string;
    description?: string;
    frequency: Frecventa;
    critical?: boolean;
    tags?: string[];
    slaHours?: number;
    fields: Field[];
};

const OBS: Field = { key: "obs", label: "Observații", type: "text", placeholder: "Note, constatări…" };
const PHOTO: Field = { key: "photo", label: "Foto evidență", type: "photo" };
const PHOTO_REQ: Field = { ...PHOTO, required: true };
const PDF_REQ: Field = { key: "doc", label: "Atașament (PDF)", type: "file", required: true };
const PDF_OPT: Field = { ...PDF_REQ, required: false };

/* ===== ZILNIC (1–10) ===== */
export const DAILY_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_GEN_LEVEL_DAILY",
        title: "Generator – nivel combustibil și scurgeri",
        frequency: "zilnic",
        critical: true,
        tags: ["generator", "diesel"],
        fields: [
            { key: "fuel_level", label: "Nivel combustibil", type: "number", unit: "%", min: 0, max: 100, step: 1, required: true },
            { key: "leaks", label: "Scurgeri vizibile", type: "boolean" },
            PHOTO_REQ,
            OBS,
        ],
    },
    {
        id: "MENT_UPS_ALARMS_DAILY",
        title: "UPS-uri – alarme active și stare",
        frequency: "zilnic",
        fields: [
            { key: "alarms", label: "Există alarme?", type: "boolean", required: true },
            { key: "note", label: "Detalii alarme (dacă da)", type: "text" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_GAS_STATION_PRESSURES_DAILY",
        title: "Stație gaze medicale – presiuni O₂/Aer/Vacuum",
        frequency: "zilnic",
        critical: true,
        tags: ["gaze medicale", "o2", "vacuum", "aer"],
        fields: [
            { key: "o2_bar", label: "O₂", type: "number", unit: "bar", step: 0.1, required: true },
            { key: "air_bar", label: "Aer medical", type: "number", unit: "bar", step: 0.1, required: true },
            { key: "vacuum_bar", label: "Vacuum (relativ)", type: "number", unit: "bar", step: 0.01, placeholder: "-0.6 … -0.8", required: true },
            PHOTO_REQ,
            OBS,
        ],
    },
    {
        id: "MENT_COMPRESSOR_VACUUM_DAILY",
        title: "Compresor aer și pompă vacuum – stare/condens",
        frequency: "zilnic",
        fields: [
            { key: "compressor_ok", label: "Compresor OK", type: "boolean" },
            { key: "vacuum_ok", label: "Pompă vacuum OK", type: "boolean" },
            { key: "condens_drain", label: "Drenaj condens realizat", type: "boolean" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_HIDROFOR_PRESSURES_DAILY",
        title: "Hidrofor – presiune pornire/oprire",
        frequency: "zilnic",
        fields: [
            { key: "p_start", label: "Presiune pornire", type: "number", unit: "bar", step: 0.1, required: true },
            { key: "p_stop", label: "Presiune oprire", type: "number", unit: "bar", step: 0.1, required: true },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_BOILERS_DAILY",
        title: "Centrale/boilere – presiune și temperatură",
        frequency: "zilnic",
        fields: [
            { key: "pressure", label: "Presiune instalație", type: "number", unit: "bar", step: 0.1, required: true },
            { key: "temp", label: "Temperatură tur/ACM", type: "number", unit: "°C", step: 0.5, required: true },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_CHILLER_VRF_DAILY",
        title: "Chiller/VRF – stare și alarme",
        frequency: "zilnic",
        fields: [
            { key: "supply_temp", label: "Temp. agent pe tur", type: "number", unit: "°C", step: 0.5 },
            { key: "alarms", label: "Există alarme?", type: "boolean" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_LIFTS_DAILY",
        title: "Lifturi – funcționare și alarmă cabină",
        frequency: "zilnic",
        fields: [
            { key: "lift_ok", label: "Funcționare normală", type: "boolean" },
            { key: "alarm_ok", label: "Buton alarmă funcțional", type: "boolean" },
            OBS,
        ],
    },
    {
        id: "MENT_CONDENS_PUMPS_DAILY",
        title: "Pompe condens/HVAC – funcționare și purge",
        frequency: "zilnic",
        fields: [
            { key: "running", label: "Funcționează", type: "boolean" },
            { key: "purge_done", label: "Purge efectuat", type: "boolean" },
            OBS,
        ],
    },
    {
        id: "MENT_ACM_SENTINEL_TEMP_DAILY",
        title: "Punct sentinel ACM – temperatură ieșire",
        frequency: "zilnic",
        critical: true,
        fields: [
            { key: "temp_out", label: "Temperatură ACM", type: "number", unit: "°C", step: 0.5, required: true },
            PHOTO_REQ,
            OBS,
        ],
    },
];

/* ===== SĂPTĂMÂNAL (11–20) ===== */
export const WEEKLY_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_GEN_TEST_WEEKLY",
        title: "Generator – test 15 min fără sarcină",
        frequency: "saptamanal",
        critical: true,
        fields: [
            { key: "run_minutes", label: "Durată test", type: "number", unit: "min", min: 10, max: 30, step: 1, required: true },
            PHOTO_REQ,
            OBS,
        ],
    },
    {
        id: "MENT_EM_LIGHT_WEEKLY",
        title: "Iluminat de siguranță – test funcțional",
        frequency: "saptamanal",
        fields: [
            { key: "ok_percent", label: "Corpuri OK (estimativ)", type: "number", unit: "%", min: 0, max: 100, step: 1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_AHU_FILTER_DP_WEEKLY",
        title: "UTA/AHU – inspecție filtre și ΔP",
        frequency: "saptamanal",
        fields: [
            { key: "dp", label: "ΔP filtru", type: "number", unit: "Pa", step: 1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_GRILLES_CLEAN_WEEKLY",
        title: "Grătare/prize aer – curățare",
        frequency: "saptamanal",
        fields: [{ key: "done", label: "Efectuat", type: "boolean" }, OBS],
    },
    {
        id: "MENT_TRAPS_REFILL_WEEKLY",
        title: "Sifoane/coloane – reumplere capcane",
        frequency: "saptamanal",
        fields: [{ key: "refilled", label: "Efectuat", type: "boolean" }, OBS],
    },
    {
        id: "MENT_COMPRESSOR_SERVICE_WEEKLY",
        title: "Compresoare și vacuum – drenaj condens, nivel ulei",
        frequency: "saptamanal",
        fields: [
            { key: "condens_drain", label: "Drenaj condens", type: "boolean" },
            { key: "oil_ok", label: "Nivel ulei OK", type: "boolean" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_SOFTENER_SALT_WEEKLY",
        title: "Stație dedurizare – nivel sare",
        frequency: "saptamanal",
        fields: [
            { key: "salt_level", label: "Nivel sare", type: "number", unit: "%", min: 0, max: 100, step: 1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_DOORS_BARRIERS_WEEKLY",
        title: "Uși automate și bariere – testare",
        frequency: "saptamanal",
        fields: [{ key: "ok", label: "Funcționale", type: "boolean" }, OBS],
    },
    {
        id: "MENT_ROOF_DRAINS_WEEKLY",
        title: "Rigole/acoperiș – verificare scurgere",
        frequency: "saptamanal",
        fields: [{ key: "ok", label: "Curgere asigurată", type: "boolean" }, PHOTO, OBS],
    },
    {
        id: "MENT_LIFT_PHONE_WEEKLY",
        title: "Lift – test telefon/alarmă",
        frequency: "saptamanal",
        fields: [{ key: "ok", label: "Apel funcțional", type: "boolean" }, OBS],
    },
];

/* ===== LUNAR (21–30) ===== */
export const MONTHLY_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_GEN_ATS_MONTHLY",
        title: "Generator – test cu transfer sarcină (ATS)",
        frequency: "lunar",
        critical: true,
        fields: [{ key: "duration", label: "Durată test", type: "number", unit: "min", step: 1 }, PHOTO_REQ, OBS],
    },
    {
        id: "MENT_UPS_MEAS_MONTHLY",
        title: "UPS – verificare tensiuni/curenți, alarme",
        frequency: "lunar",
        fields: [
            { key: "alarms", label: "Există alarme?", type: "boolean" },
            { key: "v_dc", label: "Tensiune DC string", type: "number", unit: "V", step: 0.1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_AHU_FILTERS_MONTHLY",
        title: "AHU – schimbare filtre / curățare baterii",
        frequency: "lunar",
        fields: [
            { key: "changed", label: "Filtre schimbate", type: "boolean" },
            { key: "dp_before", label: "ΔP înainte", type: "number", unit: "Pa", step: 1 },
            { key: "dp_after", label: "ΔP după", type: "number", unit: "Pa", step: 1 },
            { key: "photo_before", label: "Foto înainte", type: "photo" },
            { key: "photo_after", label: "Foto după", type: "photo" },
            OBS,
        ],
    },
    {
        id: "MENT_BOILERS_FLUE_MONTHLY",
        title: "Centrale – gaze arse și tiraj",
        frequency: "lunar",
        fields: [
            { key: "co_ppm", label: "CO", type: "number", unit: "ppm" },
            { key: "o2_pct", label: "O₂", type: "number", unit: "%" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_ACM_LEGIONELLA_FLUSH_MONTHLY",
        title: "ACM – spălare termică anti-Legionella (programată)",
        frequency: "lunar",
        fields: [
            { key: "done", label: "Ciclu efectuat", type: "boolean", required: true },
            { key: "min_temp", label: "Temp. minimă atinsă", type: "number", unit: "°C", step: 0.5 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_LIFTS_SERVICE_VISIT_MONTHLY",
        title: "Lifturi – vizită service (contract)",
        frequency: "lunar",
        fields: [
            { key: "provider", label: "Prestator", type: "text" },
            PDF_OPT,
            OBS,
        ],
    },
    {
        id: "MENT_AIR_COMPRESSORS_MONTHLY",
        title: "Compresoare aer – filtre și scăpări",
        frequency: "lunar",
        fields: [
            { key: "filters_ok", label: "Filtre OK", type: "boolean" },
            { key: "leaks", label: "Scăpări detectate", type: "boolean" },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_VACUUM_PERF_MONTHLY",
        title: "Vacuum – test randament",
        frequency: "lunar",
        fields: [
            { key: "value_kpa", label: "Valoare măsurată", type: "number", unit: "kPa", step: 0.1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_HIDROFOR_VESSEL_MONTHLY",
        title: "Hidrofor – vas presurizat/membrană",
        frequency: "lunar",
        fields: [
            { key: "pressure", label: "Presiune vas", type: "number", unit: "bar", step: 0.1 },
            PHOTO,
            OBS,
        ],
    },
    {
        id: "MENT_CHILLER_GLYCOL_MONTHLY",
        title: "Chiller – glicol/agent și schimbătoare",
        frequency: "lunar",
        fields: [
            { key: "glycol_pct", label: "Concentrație glicol", type: "number", unit: "%", step: 1 },
            PHOTO,
            OBS,
        ],
    },
];

/* ===== TRIMESTRIAL (31–38) ===== */
export const QUARTERLY_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_WATER_LAB_QUARTERLY",
        title: "Apă potabilă – buletine micro + Legionella",
        frequency: "trimestrial",
        critical: true,
        fields: [PDF_REQ, OBS],
    },
    {
        id: "MENT_THERMOGRAPHY_QUARTERLY",
        title: "Termografie tablouri electrice",
        frequency: "trimestrial",
        fields: [PDF_REQ, OBS],
    },
    {
        id: "MENT_HVAC_COILS_CLEAN_QUARTERLY",
        title: "HVAC – curățare baterii/condensatoare",
        frequency: "trimestrial",
        fields: [{ key: "done", label: "Efectuat", type: "boolean" }, PHOTO, OBS],
    },
    {
        id: "MENT_COMPRESSOR_VACUUM_PV_QUARTERLY",
        title: "Compresoare/Vacuum – revizie trimestrială",
        frequency: "trimestrial",
        fields: [PDF_OPT, PHOTO, OBS],
    },
    {
        id: "MENT_SENSORS_CALIB_QUARTERLY",
        title: "Senzori T/CO₂ – calibrare puncte",
        frequency: "trimestrial",
        fields: [PDF_OPT, PHOTO, OBS],
    },
    {
        id: "MENT_ROOF_ANCHORS_QUARTERLY",
        title: "Ancorare echipamente acoperiș – inspecție",
        frequency: "trimestrial",
        fields: [PHOTO_REQ, OBS],
    },
    {
        id: "MENT_FIRE_PUMPS_REF_PSI_QUARTERLY",
        title: "Stații incendiu – verificare (referință PSI)",
        frequency: "trimestrial",
        fields: [{ key: "checked_by_psi", label: "Verificat de PSI", type: "boolean" }, PDF_OPT, OBS],
    },
    {
        id: "MENT_HYD_BALANCING_QUARTERLY",
        title: "Balansare hidraulică – lucrări punctuale",
        frequency: "trimestrial",
        fields: [PDF_OPT, OBS],
    },
];

/* ===== SEMESTRIAL (39–41) ===== */
export const SEMIANNUAL_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_UPS_RUNTIME_SEMIANNUAL",
        title: "UPS – test autonomie",
        frequency: "semestrial",
        fields: [
            { key: "duration", label: "Durată test", type: "number", unit: "min", step: 1 },
            { key: "photo_start", label: "Foto început", type: "photo" },
            { key: "photo_end", label: "Foto sfârșit", type: "photo" },
            OBS,
        ],
    },
    {
        id: "MENT_BOILERS_DESCALING_SEMIANNUAL",
        title: "Rezervoare/boilere ACM – curățare depuneri",
        frequency: "semestrial",
        fields: [PHOTO, PDF_OPT, OBS],
    },
    {
        id: "MENT_SAFETY_VALVES_SEMIANNUAL",
        title: "Supape de siguranță – verificare funcțională",
        frequency: "semestrial",
        fields: [
            { key: "replaced", label: "Număr înlocuite", type: "number", step: 1 },
            PDF_OPT,
            PHOTO,
            OBS,
        ],
    },
];

/* ===== ANUAL (42–50) ===== */
export const ANNUAL_CARDS: MaintenanceCard[] = [
    {
        id: "MENT_ISCIR_ANNUAL",
        title: "ISCIR – cazane/recipient sub presiune/compresoare/lifturi",
        frequency: "anual",
        critical: true,
        fields: [
            PDF_REQ,
            { key: "next_due", label: "Scadență următoare", type: "text", placeholder: "ex: 2026-08-31" },
            OBS,
        ],
    },
    {
        id: "MENT_PRAM_RCD_ANNUAL",
        title: "PRAM + RCD – buletine",
        frequency: "anual",
        fields: [PDF_REQ, OBS],
    },
    {
        id: "MENT_LIGHTNING_ANNUAL",
        title: "Paratrăsnet – verificare și buletin",
        frequency: "anual",
        fields: [PDF_REQ, OBS],
    },
    {
        id: "MENT_GAS_PURITY_ANNUAL",
        title: "Gaze medicale – etanșeitate și puritate",
        frequency: "anual",
        critical: true,
        fields: [PDF_REQ, OBS],
    },
    {
        id: "MENT_CHILLER_SERVICE_ANNUAL",
        title: "Chiller/VRF – service anual complet",
        frequency: "anual",
        fields: [PDF_OPT, PHOTO, OBS],
    },
    {
        id: "MENT_METROLOGY_ANNUAL",
        title: "Metrologie – manometre/termometre/debimetre",
        frequency: "anual",
        fields: [
            { key: "count", label: "Număr aparate verificate", type: "number", step: 1 },
            PDF_OPT,
            OBS,
        ],
    },
    {
        id: "MENT_VENT_DUCTS_ANNUAL",
        title: "Ventilație – curățare canale principale",
        frequency: "anual",
        fields: [PHOTO, PDF_OPT, OBS],
    },
    {
        id: "MENT_HYDRANTS_REF_PSI_ANNUAL",
        title: "Hidranți int./ext. – referință raport PSI",
        frequency: "anual",
        fields: [PDF_OPT, OBS],
    },
    {
        id: "MENT_LIFT_OVERHAUL_ANNUAL",
        title: "Ascensoare – revizie generală",
        frequency: "anual",
        fields: [PDF_OPT, OBS],
    },
];

/* ===== Export agregat ===== */
export const MAINTENANCE_CARDS: MaintenanceCard[] = [
    ...DAILY_CARDS,
    ...WEEKLY_CARDS,
    ...MONTHLY_CARDS,
    ...QUARTERLY_CARDS,
    ...SEMIANNUAL_CARDS,
    ...ANNUAL_CARDS,
];

export const getByFrequency = (f: Frecventa) =>
    MAINTENANCE_CARDS.filter((c) => c.frequency === f);
export const getById = (id: string) =>
    MAINTENANCE_CARDS.find((c) => c.id === id);
