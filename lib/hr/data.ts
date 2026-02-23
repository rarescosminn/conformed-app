// lib/hr/data.ts
// Punct unic pentru a agrega: REGES (upload lunar) + normative + chestionare
// Momentan: mock + TODO comentarii pentru integrare

export async function getHrDashboardData() {
    // TODO: 1) REGES -> FTE/rol/secție
    // TODO: 2) Normative MS -> idealLegal
    // TODO: 3) Ajustare volum/ocupare -> idealAjustat
    // TODO: 4) Respondenți chestionare -> acoperire

    const summary = {
        activFTE: 29,
        idealLegal: 45,
        idealAjustat: 38,
        deficit: 38 - 29,
        acoperireSondajPct: 82,
    };

    const rows = [
        {
            sectie: "UPU",
            rol: "Medici" as const,
            idealLegal: 30,
            idealAjustat: 22,
            activREGES_FTE: 5,
            respondenți: 5,
            acoperirePct: 100,
            deficit: 22 - 5,
        },
        {
            sectie: "UPU",
            rol: "Asistenți" as const,
            idealLegal: 24,
            idealAjustat: 20,
            activREGES_FTE: 12,
            respondenți: 8,
            acoperirePct: (8 / 12) * 100,
            deficit: 20 - 12,
        },
        {
            sectie: "Neonatologie",
            rol: "Medici" as const,
            idealLegal: 10,
            idealAjustat: 8,
            activREGES_FTE: 7,
            respondenți: 6,
            acoperirePct: (6 / 7) * 100,
            deficit: 8 - 7,
        },
    ];

    return {
        summary,
        rows,
        currentDomain: "UPU",
    };
}
