// app/legislatie/medicale/data.ts
export type LegeStatus = "in_vigoare" | "modificat" | "abrogat";

export type Lege = {
    slug: string;
    number: string;
    title: string;
    summary?: string;
    published?: string;   // YYYY-MM-DD
    status?: LegeStatus;
    content?: string;
    source?: string;
};

export const LEGI_MEDICALE: Lege[] = [
    {
        slug: "ordin-ms-1101-2016-infectii-nosocomiale",
        number: "Ordin MS 1101/2016",
        title: "Supravegherea și controlul infecțiilor asociate asistenței medicale",
        summary:
            "Organizarea comitetelor, plan de prevenire, raportări către INSP și indicatori specifici.",
        published: "2016-09-29",
        status: "in_vigoare",
        content:
            "Stabilește structuri, responsabilități, raportări periodice, protocoale de igienă și măsuri de prevenire, inclusiv supravegherea consumului de antibiotice."
    },
    {
        slug: "legea-282-2005-transfuzie",
        number: "Legea 282/2005",
        title: "Siguranța în activitatea de transfuzie sanguină",
        summary:
            "Trasabilitate, testare, autorizare, standarde pentru laboratoare și bănci de sânge.",
        published: "2005-10-05",
        status: "in_vigoare",
        content:
            "Reglementează colectarea, testarea, depozitarea și distribuția sângelui și componentelor; cerințe de calitate și siguranță."
    },
    {
        slug: "mda-2017-745-dispozitive-medicale",
        number: "Reg. (UE) 2017/745",
        title: "Regulamentul privind dispozitivele medicale (MDR)",
        summary:
            "Cerințe pentru performanță, evaluare clinică, UDI, supraveghere post-piață și responsabilități operatori economici.",
        published: "2017-05-05",
        status: "in_vigoare",
        content:
            "Aplicabil dispozitivelor utilizate în spital; evidență UDI, mentenanță și trasabilitate; relația cu organismele notificate."
    },
    {
        slug: "anmdm-farmacovigilenta",
        number: "Reglementări ANMDM",
        title: "Farmacovigilență și medicamente",
        summary:
            "Raportarea reacțiilor adverse, responsabilul de farmacovigilență și obligațiile unității.",
        status: "in_vigoare",
        content:
            "Proceduri interne de raportare, termene, instruiri personal; integrare cu sistemul național al ANMDM."
    },
    {
        slug: "ordin-sterilizare-cpivd",
        number: "Ordin MS – sterilizare",
        title: "Sterilizare și decontaminare (CPIVD/CSSD)",
        summary:
            "Trasabilitatea instrumentarului, validarea ciclurilor, întreținere, documentație.",
        status: "in_vigoare",
        content:
            "Definește fluxuri curate/murdare, testele de performanță (Bowie-Dick, indicatori biologici/chimici), registre și responsabilități."
    },
    {
        slug: "ordin-dsvsa-haccp-bucatarii",
        number: "Reglementări DSVSA",
        title: "Siguranța alimentelor și HACCP în bloc alimentar",
        summary:
            "Plan HACCP, igienă, trasabilitate și monitorizări pentru alimentația pacienților.",
        status: "in_vigoare",
        content:
            "Analiza riscurilor, puncte critice de control, monitorizări temperaturi, probe de autocontrol și igiena personalului."
    }
];

export const gasesteLegeMedicale = (slug?: string) =>
    LEGI_MEDICALE.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());

// alias dacă preferi importul „findLawMedicale”
export { gasesteLegeMedicale as findLawMedicale };
