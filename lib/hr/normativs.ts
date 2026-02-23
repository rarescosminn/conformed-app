// lib/hr/normative.ts
export const normativeByDomain: Record<
    string,
    { medici: string[]; asistenti: string[]; infirmieri: string[] }
> = {
    UPU: {
        medici: ["1 medic / 20 prezentări / tură (art. — Ordin MS 1224/2010)"],
        asistenti: ["1 asistent / 20 prezentări / tură"],
        infirmieri: ["1 infirmier / 30 prezentări / tură"],
    },
    ATI: {
        medici: ["1 medic la max. 2 paturi"],
        asistenti: ["1 asistent / 1 pat (24/7)"],
        infirmieri: ["1 infirmier / 5–6 pacienți"],
    },
    Neonatologie: {
        medici: ["1 medic / 10–12 paturi"],
        asistenti: ["1 asistent / 2 paturi"],
        infirmieri: ["1 infirmier / 5–6 pacienți"],
    },
    "Chirurgie generală": {
        medici: ["1 medic / 15–20 paturi"],
        asistenti: ["1 asistent / 4–5 paturi"],
        infirmieri: ["1 infirmier / 15–20 pacienți"],
    },
    GENERIC: {
        medici: ["1 medic / 15–20 paturi"],
        asistenti: ["1 asistent / 4–6 paturi"],
        infirmieri: ["1 infirmier / 15–20 pacienți"],
    },
};
