// lib/maintenance/priority.ts
import type { MaintenanceCard } from './cards';

/** 1..5 — 5 = oprește spitalul / siguranță / legal major */
export const IMPACT_SCORES: Record<string, number> = {
    // 5/5 – critic major
    MENT_GAS_STATION_PRESSURES_DAILY: 5,
    MENT_ACM_SENTINEL_TEMP_DAILY: 5,
    MENT_GEN_ATS_MONTHLY: 5,
    MENT_GEN_LEVEL_DAILY: 5,
    MENT_WATER_LAB_QUARTERLY: 5,
    MENT_GAS_PURITY_ANNUAL: 5,
    MENT_ISCIR_ANNUAL: 5,
    MENT_PRAM_RCD_ANNUAL: 5,

    // 4/5 – întreruperi majore
    MENT_UPS_ALARMS_DAILY: 4,
    MENT_UPS_MEAS_MONTHLY: 4,
    MENT_UPS_RUNTIME_SEMIANNUAL: 4,
    MENT_BOILERS_DAILY: 4,
    MENT_GEN_TEST_WEEKLY: 4,
    MENT_LIFT_PHONE_WEEKLY: 4,
    MENT_LIFT_OVERHAUL_ANNUAL: 4,
    MENT_HYDRANTS_REF_PSI_ANNUAL: 4,

    // 3/5 – impact operațional/departamental
    MENT_AHU_FILTER_DP_WEEKLY: 3,
    MENT_AHU_FILTERS_MONTHLY: 3,
    MENT_CHILLER_VRF_DAILY: 3,
    MENT_CHILLER_GLYCOL_MONTHLY: 3,
    MENT_HIDROFOR_PRESSURES_DAILY: 3,
    MENT_HIDROFOR_VESSEL_MONTHLY: 3,
    MENT_COMPRESSOR_VACUUM_DAILY: 3,
    MENT_COMPRESSOR_SERVICE_WEEKLY: 3,
    MENT_AIR_COMPRESSORS_MONTHLY: 3,
    MENT_VACUUM_PERF_MONTHLY: 3,
    MENT_EM_LIGHT_WEEKLY: 3,
    MENT_BOILERS_FLUE_MONTHLY: 3,
    MENT_THERMOGRAPHY_QUARTERLY: 3,
    MENT_HVAC_COILS_CLEAN_QUARTERLY: 3,
    MENT_ROOF_DRAINS_WEEKLY: 3,
    MENT_ROOF_ANCHORS_QUARTERLY: 3,
    MENT_LIFTS_SERVICE_VISIT_MONTHLY: 3,

    // 2/5 – rutină
    MENT_GRILLES_CLEAN_WEEKLY: 2,
    MENT_TRAPS_REFILL_WEEKLY: 2,
    MENT_SOFTENER_SALT_WEEKLY: 2,
    MENT_SENSORS_CALIB_QUARTERLY: 2,
    MENT_HYD_BALANCING_QUARTERLY: 2,
    MENT_BOILERS_DESCALING_SEMIANNUAL: 2,
    MENT_VENT_DUCTS_ANNUAL: 2,
};

const FALLBACK = 2;
const PLUS_FOR_CRITICAL = 1;

export function impactOf(card: MaintenanceCard): number {
    const base = IMPACT_SCORES[card.id] ?? FALLBACK;
    return base + (card.critical ? PLUS_FOR_CRITICAL : 0);
}

export function sortByImpactDesc(cards: MaintenanceCard[]) {
    return [...cards].sort((a, b) => impactOf(b) - impactOf(a));
}
