// /lib/reports.ts
export type Role = "Admin" | "Manager" | "User";

export type Report = {
    id: string;
    title: string;
    description: string;
    createdAt: string;  // ISO
    author: string;
    role: Role;
    sizeMb: number;
    type: "PDF" | "DOCX";
    tags: string[];
    year: number;
    month: number;      // 1..12
};

const KEY = "reports";

export function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadReports(): Report[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Report[]) : [];
    } catch {
        return [];
    }
}

export function saveReports(list: Report[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function addReport(r: Report) {
    const list = loadReports();
    list.unshift(r);
    saveReports(list);
}
