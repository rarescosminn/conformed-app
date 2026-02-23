// app/legislatie/guvernanta-si-etica/data.ts
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

export const LEGI_GUVERNANTA_ETICA: Lege[] = [
    {
        slug: "osgg-600-2018-scim",
        number: "OSGG 600/2018",
        title: "Control intern managerial (SCIM) la entitățile publice",
        summary:
            "Cadrul pentru sistemul de control intern managerial: standarde, autoevaluare, plan anual, registru riscuri și audit intern.",
        published: "2018-06-21",
        status: "in_vigoare",
        content:
            "Definește standardele de control intern managerial, componența comisiei SCIM, metodologia de autoevaluare, Planul de dezvoltare a sistemului și registrul riscurilor. În spitale: corelare cu managementul calității și raportarea către ordonator."
    },
    {
        slug: "legea-361-2022-avertizori-integritate",
        number: "Legea 361/2022",
        title: "Protecția avertizorilor în interes public",
        summary:
            "Canale interne și externe de raportare, confidențialitate, termene, obligații pentru entitățile publice și private.",
        published: "2022-12-22",
        status: "in_vigoare",
        content:
            "Instituie proceduri interne de raportare, registre ale sesizărilor, termene de răspuns și protecția persoanelor care raportează încălcări ale legii. Spitalele publice trebuie să desemneze responsabil și să asigure formarea personalului."
    },
    {
        slug: "legi-ani-declaratii-conflict-interese",
        number: "Reglementări ANI",
        title: "Declarații de avere și interese. Conflict de interese și incompatibilități",
        summary:
            "Obligații de declarare, termene, publicare și regimul incompatibilităților pentru personalul din instituții publice.",
        status: "in_vigoare",
        content:
            "Include obligația depunerii declarațiilor la termenele stabilite, publicarea pe site, prevenirea și gestionarea conflictelor de interese, precum și regimul incompatibilităților pentru funcții de conducere și execuție."
    },
    {
        slug: "cod-etic-si-conduita",
        number: "Cod etic",
        title: "Cod etic și de conduită în unități sanitare",
        summary:
            "Principii de etică, conduită profesională, tratament nediscriminatoriu, relația cu pacientul și integritatea.",
        status: "in_vigoare",
        content:
            "Stabilește valori, norme de comportament și mecanisme de raportare a abaterilor. Integrare cu SCIM, protecția avertizorilor și comisia de etică spitalicească."
    }
];

export const gasesteLegeGuvernantaEtica = (slug?: string) =>
    LEGI_GUVERNANTA_ETICA.find(l => (slug ?? "").toLowerCase() === l.slug.toLowerCase());

// alias pentru import “findLawGuvernantaEtica”
export { gasesteLegeGuvernantaEtica as findLawGuvernantaEtica };
