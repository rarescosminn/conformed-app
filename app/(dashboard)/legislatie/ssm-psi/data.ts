// app/legislatie/ssm-psi/data.ts
export type LegeStatus = "in_vigoare" | "modificat" | "abrogat";

export type Lege = {
    slug: string;        // ex: "legea-319-2006-ssm"
    number: string;      // ex: "Legea 319/2006"
    title: string;       // ex: "Securitatea și sănătatea în muncă"
    summary?: string;
    published?: string;  // YYYY-MM-DD
    status?: LegeStatus;
    content?: string;
    source?: string;
};

export const LEGI_SSM_PSI: Lege[] = [
    {
        slug: "legea-319-2006-ssm",
        number: "Legea 319/2006",
        title: "Securitatea și sănătatea în muncă",
        summary:
            "Cadrul general SSM: obligații angajator, evaluarea riscurilor, instruiri, EIP, accidente și registre.",
        published: "2006-07-26",
        status: "in_vigoare",
        content:
            "Cerințe minime SSM: organizare, evaluarea riscurilor, instruirea lucrătorilor, EIP, supraveghere medicală, investigarea accidentelor. În spitale: riscuri biologice, chimice, ergonomice, psihosociale."
    },
    {
        slug: "hg-1425-2006-norme-ssm",
        number: "HG 1425/2006",
        title: "Norme metodologice pentru Legea 319/2006",
        summary:
            "Tipuri de instruire, documente și evidențe SSM, responsabilități și periodicitate.",
        published: "2006-10-11",
        status: "in_vigoare",
        content:
            "Definește instruirea introductiv-generală, la locul de muncă și periodică; comitet SSM; registre accidente/incidente; tematici adaptate riscurilor specifice medicale."
    },
    {
        slug: "legea-307-2006-psi",
        number: "Legea 307/2006",
        title: "Apărarea împotriva incendiilor",
        summary:
            "Organizarea PSI: dotări, verificări, planuri, instruiri, exerciții și sancțiuni.",
        published: "2006-07-12",
        status: "in_vigoare",
        content:
            "Responsabilități PSI, mijloace tehnice, planuri de evacuare și intervenție, instruiri/exerciții, raportări ISU. În unități sanitare: căi de evacuare, compartimentări, detecție și alarmare."
    },
    {
        slug: "p118-2025-normativ-securitate-incendiu",
        number: "P118/2025",
        title: "Normativ de securitate la incendiu pentru construcții",
        summary:
            "Cerințe tehnice actualizate pentru proiectare, dotări, evacuare și performanțe la incendiu.",
        published: "2025-02-15",
        status: "in_vigoare",
        content:
            "Încadrare pe categorii, niveluri de performanță, compartimentare, evacuare, instalații (hidranti, sprinklere, detecție), semnalizare, întreținere și verificări — inclusiv cerințe pentru spitale."
    },
    {
        slug: "verificari-periodice-instalatii-siguranta",
        number: "Reglementări ISC/ISU",
        title: "Verificări periodice ale instalațiilor de siguranță",
        summary:
            "PRAM, paratrăsnet, gaze, ventilație, lifturi, instalații PSI — termene, rapoarte, evidențe.",
        status: "in_vigoare",
        content:
            "Verificări efectuate de persoane/entități autorizate, cu rapoarte și registru de conformare. Include hidranți, stingătoare, sisteme de detecție/alarmare PSI."
    }
];

// funcția principală
export const gasesteLegeSSMPSI = (slug?: string) =>
    LEGI_SSM_PSI.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());

// alias (dacă preferi denumire engleză uniformă în importuri)
export { gasesteLegeSSMPSI as findLawSSMPSI };
