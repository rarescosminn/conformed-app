// app/legislatie/juridic-si-administrativ/data.ts
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

export const LEGI_JURIDIC_ADMIN: Lege[] = [
    {
        slug: "cod-civil-actualizat",
        number: "Codul civil",
        title: "Raporturi civile și obligații",
        summary:
            "Reguli generale privind contractele cu furnizorii, răspunderea civilă, prescripții și garanții.",
        status: "in_vigoare",
        content:
            "Aplicabil contractelor de achiziție servicii/produse, garanțiilor și răspunderii pentru neexecutare; corelat cu achiziții publice."
    },
    {
        slug: "cod-procedura-civila",
        number: "Codul de procedură civilă",
        title: "Proceduri și litigii civile",
        summary:
            "Competență, termene, probe, executare silită pentru raporturi civile/comerciale.",
        status: "in_vigoare",
        content:
            "Stabilește etapele procesuale, căile de atac și regulile probatorii în litigii comerciale și civile ce pot implica unitatea sanitară."
    },
    {
        slug: "legea-malpraxis",
        number: "Legea malpraxis (dispozitii relevante)",
        title: "Răspundere profesională medicală",
        summary:
            "Obligația de asigurare, procedura de constatare, despăgubiri și apărare juridică.",
        status: "in_vigoare",
        content:
            "Definirea abaterii profesionale, mecanisme de conciliere/mediere, rolul asigurătorului și evidențe interne privind incidentele."
    },
    {
        slug: "drepturi-autor-si-licente",
        number: "Legea drepturilor de autor (dispoziții relevante)",
        title: "Proprietate intelectuală și licențe",
        summary:
            "Respectarea licențelor software, drepturi asupra materialelor educaționale și cercetării.",
        status: "in_vigoare",
        content:
            "Inventarierea licențelor software, utilizări conforme, drepturi conexe pentru materiale interne și proiecte de cercetare."
    },
    {
        slug: "nediscriminare-si-egaliate",
        number: "Legislație anti-discriminare",
        title: "Nediscriminare și egalitate de șanse",
        summary:
            "Interdicția discriminării, adaptări rezonabile pentru pacienți și personal, accesibilitate.",
        status: "in_vigoare",
        content:
            "Proceduri interne de sesizare, instruiri periodice și integrarea în codul etic și politicile HR."
    }
];

export const gasesteLegeJuridicAdmin = (slug?: string) =>
    LEGI_JURIDIC_ADMIN.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());

// alias pentru import uniform
export { gasesteLegeJuridicAdmin as findLawJuridicAdmin };
