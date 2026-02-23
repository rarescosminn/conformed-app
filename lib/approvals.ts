// lib/approvals.ts
export type Role = "Admin" | "Manager" | "User";

export type ApprovalKind = "document" | "report" | "revision" | "request";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes";

export type HistoryEntry = {
    at: string;           // ISO
    by: string;           // display name
    action: ApprovalStatus | "created" | "archived";
    note?: string;
};

export type ApprovalItem = {
    id: string;
    kind: ApprovalKind;
    title: string;
    category: string;
    refId?: string;
    submittedBy: string;
    authors?: string[];      // autori multipli (pt. notificări)
    assignee: string;
    status: ApprovalStatus;
    submittedAt: string;
    dueAt?: string;

    previewUrl?: string;
    downloadUrl?: string;

    // REVIZII
    baseVersion?: string;
    proposedVersion?: string;
    changeSummary?: string;

    // CERERI
    requestType?: string;
    justification?: string;

    // Retenție respins
    rejectedAt?: string;
    archiveAt?: string;

    history: HistoryEntry[];
};

const STORE_KEY = "approvals_store_v1";
const ARCHIVE_KEY = "approvals_archive_v1";

export const REJECT_RETENTION_DAYS = 30;

/* ---- seed demo ---- */
const seed: ApprovalItem[] = [
    {
        id: "doc-9001-manual",
        kind: "document",
        title: "Manualul Calității – ISO 9001 (publicare)",
        category: "ISO 9001",
        refId: "ISO9001-Manual",
        submittedBy: "Maria Ionescu (Manager Calitate)",
        authors: ["Maria Ionescu"],
        assignee: "Director General",
        status: "pending",
        submittedAt: "2025-09-10T09:10:00",
        previewUrl: "/files/ISO9001-Manual.pdf",
        downloadUrl: "/files/ISO9001-Manual.pdf",
        history: [{ at: "2025-09-10T09:10:00", by: "Maria Ionescu", action: "created", note: "Publicare versiune finală." }],
    },
    {
        id: "rep-conformare-q1",
        kind: "report",
        title: "Raport conformare Q1 2025",
        category: "Management",
        refId: "RPT-2025-Q1-CONF",
        submittedBy: "Sistem (automat)",
        authors: ["Sistem"],
        assignee: "Director Operațional",
        status: "pending",
        submittedAt: "2025-09-20T10:35:00",
        previewUrl: "#",
        downloadUrl: "#",
        history: [{ at: "2025-09-20T10:35:00", by: "Sistem", action: "created", note: "Generat automat. Necesită validare." }],
    },
    {
        id: "rev-proc-doc",
        kind: "revision",
        title: "Revizie – Procedură Controlul Documentelor",
        category: "ISO 9001",
        refId: "PROC-CTRL-DOC",
        submittedBy: "Andrei Pop (Coord. calitate)",
        authors: ["Andrei Pop"],
        assignee: "Director Calitate",
        status: "pending",
        submittedAt: "2025-09-18T13:25:00",
        baseVersion: "v2.1",
        proposedVersion: "v2.2",
        changeSummary: "Clarificată secțiunea 'Retragere documente' + actualizare flux aprobare.",
        previewUrl: "#",
        downloadUrl: "#",
        history: [{ at: "2025-09-18T13:25:00", by: "Andrei Pop", action: "created", note: "Propunere revizie v2.2" }],
    },
    {
        id: "req-buget-ssm",
        kind: "request",
        title: "Cerere aprobare buget SSM – trimestrul IV",
        category: "SSM",
        requestType: "Buget SSM",
        justification: "Echipamente EPI + instruiri obligatorii.",
        submittedBy: "Responsabil SSM",
        authors: ["Responsabil SSM"],
        assignee: "Director Financiar",
        status: "pending",
        submittedAt: "2025-09-12T08:00:00",
        previewUrl: "#",
        downloadUrl: "#",
        history: [{ at: "2025-09-12T08:00:00", by: "Responsabil SSM", action: "created" }],
    },
];

/* ---- utils ---- */
function addDays(iso: string, days: number) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

/* ---- persistence ---- */
function load(): ApprovalItem[] {
    if (typeof window === "undefined") return seed;
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) {
            localStorage.setItem(STORE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw) as ApprovalItem[];
    } catch { return seed; }
}
function save(items: ApprovalItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
}
function loadArchive(): ApprovalItem[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); } catch { return []; }
}
function saveArchive(items: ApprovalItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
}

/* ---- API ---- */
export const Approvals = {
    all(): ApprovalItem[] { return load(); },
    get(id: string): ApprovalItem | undefined { return load().find(i => i.id === id); },
    byKind(kind: ApprovalKind): ApprovalItem[] { return load().filter(i => i.kind === kind); },

    updateStatus(id: string, status: ApprovalStatus, by: string, note?: string): ApprovalItem[] {
        const items = load();
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return items;

        items[idx].status = status;
        items[idx].history = [...items[idx].history, { at: new Date().toISOString(), by, action: status, note }];

        if (status === "rejected") {
            const now = new Date().toISOString();
            items[idx].rejectedAt = now;
            items[idx].archiveAt = addDays(now, REJECT_RETENTION_DAYS);
        }

        save(items);
        return items;
    },

    addHistory(id: string, by: string, action: "changes", note: string): ApprovalItem[] {
        const items = load();
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return items;
        items[idx].status = "changes";
        items[idx].history = [...items[idx].history, { at: new Date().toISOString(), by, action, note }];
        save(items);
        return items;
    },
};

/* ---- Arhivare ---- */
export function sweepToArchive(): ApprovalItem[] {
    const now = Date.now();
    const live = load();
    const toArchive: ApprovalItem[] = [];
    const keep: ApprovalItem[] = [];

    for (const it of live) {
        if (it.status === "rejected" && it.archiveAt && Date.parse(it.archiveAt) <= now) {
            toArchive.push({ ...it, history: [...it.history, { at: new Date().toISOString(), by: "Sistem", action: "archived", note: "Arhivare automată după 30 zile" }] });
        } else {
            keep.push(it);
        }
    }

    if (toArchive.length) {
        const arch = loadArchive();
        saveArchive([...toArchive, ...arch]);
        save(keep);
    }
    return keep;
}

export function archiveNow(id: string, by: string, note?: string): ApprovalItem[] {
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return items;
    const it = items[idx];
    const archived: ApprovalItem = {
        ...it,
        history: [...it.history, { at: new Date().toISOString(), by, action: "archived", note: note || "Arhivat manual" }],
    };
    const arch = loadArchive();
    saveArchive([archived, ...arch]);
    const keep = items.filter(x => x.id !== id);
    save(keep);
    return keep;
}

export function resubmit(id: string, by: string, note?: string): ApprovalItem[] {
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return items;
    items[idx].status = "pending";
    items[idx].rejectedAt = undefined;
    items[idx].archiveAt = undefined;
    items[idx].history = [...items[idx].history, { at: new Date().toISOString(), by, action: "pending", note: note || "Retrimis pentru aprobare" }];
    save(items);
    return items;
}
