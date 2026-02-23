// app/legislatie/generale/data.ts
export type LegeStatus = "in_vigoare" | "modificat" | "abrogat";

export type Lege = {
    slug: string;        // ex: "legea-95-2006"
    number: string;      // ex: "Legea 95/2006"
    title: string;
    summary?: string;
    published?: string;  // YYYY-MM-DD
    status?: LegeStatus;
    content?: string;
    source?: string;
};

// — Lista „Generale”
export const LEGI_GENERALE: Lege[] = [
    {
        slug: "legea-95-2006",
        number: "Legea 95/2006",
        title: "Reforma în domeniul sănătății",
        summary: "Cadru general pentru organizarea și funcționarea sistemului de sănătate.",
        published: "2006-04-20",
        status: "in_vigoare",
        content:
            "Titlul VI reglementează organizarea spitalelor: conducere, managementul calității și siguranței pacientului, raportări și acreditare."
    },
    {
        slug: "legea-46-2003",
        number: "Legea 46/2003",
        title: "Drepturile pacientului",
        summary: "Informare, consimțământ informat, confidențialitate, acces la date.",
        published: "2003-01-21",
        status: "in_vigoare",
        content:
            "Dreptul la informare și consimțământ, confidențialitatea datelor medicale și accesul la dosarul medical."
    },
    {
        slug: "legea-190-2018",
        number: "Legea 190/2018",
        title: "Măsuri de punere în aplicare a GDPR",
        summary: "Particularități naționale pentru GDPR: prelucrări speciale, DPO.",
        published: "2018-07-18",
        status: "in_vigoare",
        content:
            "Măsuri pentru aplicarea GDPR în România, inclusiv rolul DPO și temeiuri specifice."
    },
    {
        slug: "legea-98-2016",
        number: "Legea 98/2016",
        title: "Achiziții publice",
        summary: "Proceduri, praguri, documentații și contestații în SEAP/SICAP.",
        published: "2016-05-19",
        status: "in_vigoare",
        content:
            "Proceduri de atribuire, praguri, criterii și transparență pentru spitale publice."
    },
    {
        slug: "legea-82-1991",
        number: "Legea 82/1991",
        title: "Legea contabilității",
        summary: "Organizarea contabilității și situații financiare.",
        published: "1991-12-24",
        status: "in_vigoare",
        content:
            "Principii și cerințe pentru contabilitatea unităților sanitare; raportări și răspunderi."
    }
];

// căutare simplă după slug (case-insensitive)
export const gasesteLegeGenerale = (slug?: string) =>
    LEGI_GENERALE.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());
