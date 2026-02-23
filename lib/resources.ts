// lib/resources.ts
import type { ApprovalItem } from "./approvals";

export type ResourceItem = {
    id: string;
    title: string;
    description: string;
    subCategory: string;
    docKind: "Standard" | "Manual" | "Procedură" | "Instrucțiune" | "Formular" | "Raport" | "NC";
    type: "PDF" | "DOCX" | "XLSX" | "PPTX";
    sizeMb: number;
    updatedAt: string;
    tags: string[];
    url: string;
    code?: string;
    version?: string;
    status?: "Draft" | "Aprobat" | "Arhivat";
    owner?: string;
    reviewDueAt?: string;
};

const LS_KEY = (catKey: string) => `res_cat_${catKey}`;

export function loadCategory(catKey: string): ResourceItem[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(LS_KEY(catKey)) || "[]"); } catch { return []; }
}
export function saveCategory(catKey: string, items: ResourceItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEY(catKey), JSON.stringify(items));
}

export function mapCategoryToResurseKey(category: string): string {
    const c = (category || "").toLowerCase().trim();
    if (c.startsWith("iso")) return "iso";
    if (c === "ssm") return "ssm";
    if (c === "psi") return "psi";
    if (c === "mediu") return "mediu";
    if (c === "hr") return "hr";
    if (c.includes("medical")) return "medical";
    if (c.includes("it")) return "it";
    return "proceduri";
}

function guessType(url?: string): ResourceItem["type"] {
    const ext = (url || "").split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "doc" || ext === "docx") return "DOCX";
    if (ext === "xls" || ext === "xlsx") return "XLSX";
    if (ext === "ppt" || ext === "pptx") return "PPTX";
    return "PDF";
}

export function resourceFromApproval(it: ApprovalItem, note?: string): ResourceItem {
    return {
        id: `${it.id}-${Date.now()}`,
        title: it.title,
        description: note ? `Aprobat: ${note}` : "Aprobat și publicat în Resurse.",
        subCategory: it.category,
        docKind: it.kind === "revision" ? "Procedură" : "Procedură",
        type: guessType(it.downloadUrl || it.previewUrl),
        sizeMb: 0.0,
        updatedAt: new Date().toISOString(),
        tags: [it.category, it.refId || ""].filter(Boolean),
        url: it.downloadUrl || it.previewUrl || "#",
        version: it.proposedVersion || undefined,
        status: "Aprobat",
        owner: it.submittedBy,
    };
}

export function moveApprovalIntoResources(it: ApprovalItem, note?: string) {
    const catKey = mapCategoryToResurseKey(it.category);
    const list = loadCategory(catKey);
    const res = resourceFromApproval(it, note);
    saveCategory(catKey, [res, ...list]);
}
