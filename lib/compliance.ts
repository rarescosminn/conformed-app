// /lib/compliance.ts
export type Badge = "Conform" | "Parțial" | "Neconform";

export type DomainKey =
    | "ISO9001" | "ISO14001" | "ISO45001" | "ISO50001" | "SCIM"
    | "MEDIU" | "SSM" | "PSI"
    | "CHESTIONARE" | "HR_BURNOUT" | "HR_TRAINING" | "IAAM"
    | "EV_ADVERSE" | "FIN" | "RISC" | "LEGISLATIE" | "APROBARI" | "DATA_QUALITY";

export type DomainScore = {
    key: DomainKey;
    title: string;
    description: string;
    score: number;          // 0..100
    trendPct?: number;      // +/- %
};

export type ComplianceSnapshot = {
    period: { year: number; month: number | "all" };
    overall: number;
    domains: DomainScore[];
};

export function badgeFor(score: number): Badge {
    if (score >= 80) return "Conform";
    if (score >= 65) return "Parțial";
    return "Neconform";
}

export function linearScore(
    value: number,
    target: number,        // țintă „bună”
    worst: number,         // prag „rău”
    direction: "desc" | "asc" // dacă mai mic e mai bun -> "desc"
): number {
    if (direction === "desc") {
        if (value <= target) return 100;
        if (value >= worst) return 0;
        return Math.max(0, Math.min(100, 100 * (1 - (value - target) / (worst - target))));
    } else {
        if (value >= target) return 100;
        if (value <= worst) return 0;
        return Math.max(0, Math.min(100, 100 * ((value - worst) / (target - worst))));
    }
}

/* ----------------- MOCK DATA LAYER (înlocuiești cu fetch) ----------------- */
export function getComplianceSnapshot(year: number, month: number | "all"): ComplianceSnapshot {
    // exemplu: câteva scoruri reale + extrase din KPI transformate
    const dmsDays = 6.8;                      // din KPI
    const icm = 0.85;                         // 0..1
    const burnout = 0.62;                     // 0..1 (1=grav)
    const iaamRate = 0.95;                    // țintă <= 1.0

    const iso9001 = 68;
    const iso14001 = 75;
    const iso45001 = 81;
    const iso50001 = 64;
    const scim = 70;
    const mediu = 72;
    const ssm = 66;
    const psi = 78;

    const fromKPI_Clinic = Math.round(
        (linearScore(dmsDays, 6, 9, "desc") * 0.6 + linearScore(icm, 0.9, 0.7, "asc") * 0.4)
    );

    const hrBurnout = Math.round(linearScore(1 - burnout, 0.55, 0.3, "asc")); // inversăm
    const hrTraining = 83;   // % validări training
    const iaam = Math.round(linearScore(iaamRate, 1.0, 1.5, "desc"));
    const evAdverse = 74;    // % rezolvate la termen
    const fin = 79;          // % plăți la termen + 3-way match
    const legislatie = 71;   // % acte interne aliniate
    const aprobari = 69;     // % proceduri/politici semnate
    const dq = 76;           // calitate date chestionare (completitudine/dovezi)
    const risc = Math.round(
        ((100 - iso50001) * 0.15 + (100 - iaam) * 0.25 + (100 - hrBurnout) * 0.25 + (100 - fromKPI_Clinic) * 0.35)
    );
    const riscConform = 100 - Math.min(100, risc); // transformare la „conformare”

    const domains: DomainScore[] = [
        { key: "ISO9001", title: "ISO 9001", description: "Sistemul de management al calității.", score: iso9001, trendPct: +2 },
        { key: "ISO14001", title: "ISO 14001", description: "Mediu – aspecte și obiective.", score: iso14001, trendPct: +1 },
        { key: "ISO45001", title: "ISO 45001", description: "SSM – sănătate și securitate.", score: iso45001, trendPct: +3 },
        { key: "ISO50001", title: "ISO 50001", description: "Energie – consum & ținte.", score: iso50001, trendPct: -1 },
        { key: "SCIM", title: "SCIM", description: "Standard clinic & indicatori.", score: scim },
        { key: "MEDIU", title: "Mediu", description: "Deșeuri, emisii, resurse.", score: mediu },
        { key: "SSM", title: "SSM", description: "Accidente, instruiri, riscuri.", score: ssm },
        { key: "PSI", title: "PSI", description: "Prevenire și stingere incendii.", score: psi },

        { key: "CHESTIONARE", title: "Chestionare", description: "Grad conformare + dovezi.", score: dq, trendPct: +5 },
        { key: "HR_BURNOUT", title: "Burnout (HR)", description: "Stare personal & risc.", score: hrBurnout, trendPct: -2 },
        { key: "HR_TRAINING", title: "Training HR", description: "Obligatorii & expirări.", score: hrTraining },
        { key: "IAAM", title: "IAAM", description: "Infecții asociate AM.", score: iaam },
        { key: "EV_ADVERSE", title: "Evenimente adverse", description: "Rezolvate la termen.", score: evAdverse },
        { key: "FIN", title: "Financiar", description: "Plăți la termen, achiziții.", score: fin },
        { key: "RISC", title: "Risc compozit", description: "NC majore, IAAM, energie, burnout.", score: riscConform, trendPct: -1 },
        { key: "LEGISLATIE", title: "Legislație", description: "Aliniere acte & update.", score: legislatie },
        { key: "APROBARI", title: "Aprobări", description: "Documente în așteptare.", score: aprobari },
        { key: "DATA_QUALITY", title: "Calitate date", description: "Completitudine & consistență.", score: dq },
    ];

    const overall = Math.round(
        domains.reduce((s, d) => s + d.score, 0) / domains.length
    );

    return { period: { year, month }, overall, domains };
}
