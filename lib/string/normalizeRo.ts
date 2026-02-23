// /lib/string/normalizeRo.ts
export const normalizeRo = (s: string) =>
    (s ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Ă|Â|ă|â/g, "a")
        .replace(/Î|î/g, "i")
        .replace(/Ș|Ş|ș|ş/g, "s")
        .replace(/Ț|Ţ|ț|ţ/g, "t")
        .replace(/–|—/g, "-")
        .toLowerCase()
        .trim();
