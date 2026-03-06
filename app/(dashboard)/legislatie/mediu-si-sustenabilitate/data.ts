// app/legislatie/mediu-si-sustenabilitate/data.ts
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

export const LEGI_MEDIU_SUSTENABILITATE: Lege[] = [
    {
        slug: "legea-211-2011-deseuri",
        number: "Legea 211/2011",
        title: "Regimul deșeurilor",
        summary:
            "Ierarhia deșeurilor, responsabilități, evidență, colectare separată, sancțiuni.",
        published: "2011-11-25",
        status: "in_vigoare",
        content:
            "Stabilește prevenirea, reutilizarea, reciclarea și eliminarea; pentru spitale include cerințe de gestionare a deșeurilor periculoase și evidențe la zi."
    },
    {
        slug: "hg-856-2002-coduri-deseuri",
        number: "HG 856/2002",
        title: "Evidența gestiunii deșeurilor și lista codurilor",
        summary:
            "Lista codurilor deșeurilor (inclusiv capitolul 18 – deșeuri medicale), raportări anuale.",
        published: "2002-07-16",
        status: "in_vigoare",
        content:
            "Include codurile specifice pentru deșeuri infecțioase, tăioase-înțepătoare, chimice, farmaceutice; impune evidențe și raportare anuală."
    },
    {
        slug: "oug-195-2005-mediu",
        number: "OUG 195/2005",
        title: "Protecția mediului",
        summary:
            "Cadrul general: autorizare, monitorizare, obligații pentru operatori și sancțiuni.",
        published: "2005-12-22",
        status: "in_vigoare",
        content:
            "Necesitatea autorizației/autorizației integrate de mediu, monitorizări și raportări periodice; responsabilități pentru prevenirea poluării."
    },
    {
        slug: "legea-249-2015-ambalaje",
        number: "Legea 249/2015",
        title: "Gestionarea ambalajelor și a deșeurilor de ambalaje",
        summary:
            "Obligații privind colectarea separată, ținte de valorificare, raportări către AFM.",
        published: "2015-10-05",
        status: "in_vigoare",
        content:
            "Stabilește responsabilități ale generatorilor, contracte cu OIREP, evidențe cantitative și declarații lunare către AFM."
    },
    {
        slug: "ntpa-001-002-ape-uzate",
        number: "NTPA 001/002",
        title: "Normative pentru evacuarea apelor uzate",
        summary:
            "Condiții de descărcare la emisar/canalizare, monitorizare și raportare.",
        status: "in_vigoare",
        content:
            "Prevede limite pentru poluanți, puncte de prelevare, periodicitatea analizelor; aplicabil laboratoarelor, spălătoriilor și bucătăriilor spitalelor."
    },
    {
        slug: "legea-121-2014-eficienta-energetica",
        number: "Legea 121/2014",
        title: "Eficiența energetică",
        summary:
            "Audit energetic periodic, programe de eficiență, responsabilități pentru consumatori mari.",
        published: "2014-06-18",
        status: "in_vigoare",
        content:
            "Pentru clădiri publice mari: audituri, monitorizarea consumurilor, planuri de reducere și raportări conform cerințelor ANRE."
    }
];

// funcția principală (căutare după slug)
export const gasesteLegeMediuSustenabilitate = (slug?: string) =>
    LEGI_MEDIU_SUSTENABILITATE.find(
        (l) => (slug ?? "").toLowerCase() === l.slug.toLowerCase()
    );

// alias ca să poți importa exact cum ai în page.tsx
export { gasesteLegeMediuSustenabilitate as findLawMediuSustenabilitate };
