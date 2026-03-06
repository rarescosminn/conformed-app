// app/legislatie/it-si-cibernetic/data.ts
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

export const LEGI_IT_CIBERNETIC: Lege[] = [
    {
        slug: "legea-362-2018-nis",
        number: "Legea 362/2018",
        title: "Securitatea rețelelor și a sistemelor informatice (NIS)",
        summary:
            "Cerințe pentru operatori de servicii esențiale și furnizori de servicii digitale: măsuri de securitate, notificarea incidentelor.",
        published: "2018-12-12",
        status: "in_vigoare",
        content:
            "Instituie obligații de management al riscurilor, politici de securitate, controale tehnice/organizatorice și raportarea incidentelor semnificative. Spitalele pot fi încadrate ca operatori de servicii esențiale; necesare registre de active, plan de răspuns la incidente, audituri periodice."
    },
    {
        slug: "nis2-2022-directiva",
        number: "Directiva (UE) 2022/2555",
        title: "NIS2 – măsuri de consolidare a securității cibernetice",
        summary:
            "Extinde domeniul de aplicare și crește cerințele de guvernanță, managementul riscurilor și raportări.",
        published: "2022-12-27",
        status: "in_vigoare",
        content:
            "Prevede responsabilități sporite pentru conducere, evaluări de risc, supply chain security, gestionarea vulnerabilităților, notificări în etape. Se transpune național; spitalele vor trebui să ajusteze politicile și controalele."
    },
    {
        slug: "iso-27001-smsi",
        number: "ISO/IEC 27001",
        title: "Sistem de management al securității informației",
        summary:
            "Cerințe pentru stabilirea, implementarea și îmbunătățirea continuă a SMSI.",
        status: "in_vigoare",
        content:
            "Inventarierea activelor, clasificarea informațiilor, controale Annex A (acces, criptare, logare, continuitate), audit intern, revizuire management."
    },
    {
        slug: "des-cnas-telemedicina",
        number: "DES / Telemedicină",
        title: "Dosarul electronic de sănătate și servicii de telemedicină",
        summary:
            "Interoperabilitate cu platforma CNAS, confidențialitate, jurnalizare acces, consimțământ; cerințe pentru teleconsultații.",
        status: "in_vigoare",
        content:
            "Asigură protecția datelor medicale, jurnalizarea accesului, gestionarea consimțământului, canale securizate audio-video, autentificare adecvată și păstrarea înregistrărilor conform reglementărilor."
    },
    {
        slug: "arhivare-documente-medicale",
        number: "Reguli arhivare",
        title: "Arhivare și păstrare a documentelor medicale",
        summary:
            "Termene de păstrare, condiții de arhivare fizică și electronică, politici de backup și recuperare.",
        status: "in_vigoare",
        content:
            "Stabilește termene minime de retenție pentru documente medicale, cerințe de integritate și disponibilitate, politici de backup off-site și plan de continuitate."
    }
];

export const gasesteLegeITCibernetic = (slug?: string) =>
    LEGI_IT_CIBERNETIC.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());

// alias pentru import uniform
export { gasesteLegeITCibernetic as findLawITSI };

/* Dacă preferi alt nume pentru alias:
   export { gasesteLegeITCibernetic as findLawITSecuritate };
*/
