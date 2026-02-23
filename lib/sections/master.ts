// /lib/sections/master.ts
export type Section = {
    id: string;
    name: string;
    code: string;
};

export const SECTIONS_MASTER: Section[] = [
    { id: "upu", name: "UPU", code: "UPU" },
    { id: "ati", name: "ATI", code: "ATI" },
    { id: "bloc-operator", name: "Bloc operator", code: "BLOP" },
    { id: "boli-infectioase", name: "Boli infecțioase", code: "INF" },
    { id: "chirurgie-generala", name: "Chirurgie generală", code: "CHG" },
    { id: "neonatologie", name: "Neonatologie", code: "NEO" },
    { id: "oncologie", name: "Oncologie", code: "ONC" },
    { id: "pediatrie", name: "Pediatrie", code: "PED" },
    { id: "ortopedie", name: "Ortopedie", code: "ORT" },
    { id: "diabet", name: "Diabet, nutriție și boli metabolice", code: "DNBM" },
    { id: "endocrinologie", name: "Endocrinologie", code: "END" },
    { id: "cardiologie", name: "Cardiologie", code: "CAR" },
    { id: "neurologie", name: "Neurologie", code: "NEU" },
    { id: "gastroenterologie", name: "Gastroenterologie", code: "GAS" },
    { id: "nefrologie", name: "Nefrologie", code: "NEF" },
    { id: "pneumologie", name: "Pneumologie", code: "PNE" },
    { id: "hematologie", name: "Hematologie", code: "HEM" },
    { id: "dermatologie", name: "Dermatologie", code: "DER" },
    { id: "reumatologie", name: "Reumatologie", code: "REU" },
    { id: "og", name: "Obstetrică–Ginecologie", code: "OG" },
    { id: "orl", name: "ORL", code: "ORL" },
    { id: "oftalmologie", name: "Oftalmologie", code: "OFT" },
    { id: "recuperare", name: "Recuperare medicală", code: "REC" },
    { id: "psihiatrie", name: "Psihiatrie", code: "PSI" },
    { id: "radiologie", name: "Radiologie–Imagistică", code: "RAD" },
    { id: "laborator", name: "Laborator", code: "LAB" },
    { id: "farmacie", name: "Farmacie", code: "FAR" },
    { id: "sterilizare", name: "Sterilizare (CSSD/CPIVD)", code: "CSSD" },
];
