"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ApprovalItem, ApprovalKind, HistoryEntry } from "../../../lib/approvals";

const ARCHIVE_KEY = "approvals_archive_v1";

function loadArchive(): ApprovalItem[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]") as ApprovalItem[]; } catch { return []; }
}

const ui = {
    page: { padding: 24, display: "grid", gap: 24, background: "#f7f8fb", minHeight: "100vh" } as React.CSSProperties,
    title: { fontSize: 30, fontWeight: 700 } as React.CSSProperties,
    filterBar: { display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
    input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", width: "300px" } as React.CSSProperties,
    select: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb" } as React.CSSProperties,
    grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" } as React.CSSProperties,
    card: { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 14px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" } as React.CSSProperties,
    body: { padding: 20, display: "grid", gap: 8 } as React.CSSProperties,
    titleSmall: { fontSize: 18, fontWeight: 700, margin: 0 } as React.CSSProperties,
    meta: { fontSize: 14, color: "#475569" } as React.CSSProperties,
    history: { padding: "0 20px 20px", borderTop: "1px dashed #e2e8f0", display: "grid", gap: 4 } as React.CSSProperties,
    histRow: { fontSize: 13, color: "#475569" } as React.CSSProperties,
    badge: (bg: string, fg: string, br: string): React.CSSProperties => ({ background: bg, color: fg, border: `1px solid ${br}`, padding: "2px 8px", borderRadius: 999, fontSize: 12 }),
    badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" } as React.CSSProperties,
    btnRow: { padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", gap: 10 } as React.CSSProperties,
    btn: { flex: 1, padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" } as React.CSSProperties,
};

const KIND_LABEL: Record<ApprovalKind, string> = {
    document: "Documente",
    report: "Rapoarte",
    revision: "Revizii",
    request: "Cereri",
};

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("ro-RO") : "-");

export default function ArchivePage() {
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [q, setQ] = useState("");
    const [kind, setKind] = useState<"toate" | ApprovalKind>("toate");

    useEffect(() => { setItems(loadArchive()); }, []);

    const filtered = useMemo(() => {
        return items
            .filter((i) => (kind === "toate" ? true : i.kind === kind))
            .filter((i) => {
                const s = q.trim().toLowerCase();
                if (!s) return true;
                return ((i.title + " " + i.category + " " + (i.submittedBy || "") + " " + (i.assignee || "")).toLowerCase().includes(s));
            })
            .sort((a, b) => (a.history[a.history.length - 1]?.at < b.history[b.history.length - 1]?.at ? 1 : -1));
    }, [items, q, kind]);

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "arhiva_aprobari.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={ui.page}>
            <h1 style={ui.title}>📁 Arhivă Documente Aprobări</h1>

            <div style={ui.filterBar}>
                <input style={ui.input} placeholder="Caută (titlu, categorie, autor)..." value={q} onChange={(e) => setQ(e.target.value)} />
                <select style={ui.select} value={kind} onChange={(e) => setKind(e.target.value as any)}>
                    <option value="toate">Toate tipurile</option>
                    <option value="document">Documente</option>
                    <option value="report">Rapoarte</option>
                    <option value="revision">Revizii</option>
                    <option value="request">Cereri</option>
                </select>
            </div>

            <div style={ui.grid}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 20, fontSize: 16, color: "#64748b" }}>Niciun document arhivat.</div>
                ) : (
                    filtered.map((item) => (
                        <article key={item.id} style={ui.card}>
                            <div style={ui.body}>
                                <h3 style={ui.titleSmall}>{item.title}</h3>
                                <div style={ui.badgeRow}>
                                    <span style={ui.badge("#eef2ff", "#3730a3", "#c7d2fe")}>{KIND_LABEL[item.kind]}</span>
                                    <span style={ui.badge("#f1f5f9", "#0f172a", "#e2e8f0")}>{item.category}</span>
                                    <span style={ui.badge("#fef3c7", "#92400e", "#fde68a")}>Arhivat</span>
                                </div>

                                <div style={ui.meta}>
                                    Ref: {item.refId || "-"} <br />
                                    Autor: {item.submittedBy} <br />
                                    Destinatar aprobare: {item.assignee}
                                </div>

                                <div style={ui.meta}>Trimis: {fmt(item.submittedAt)}</div>
                                <div style={ui.meta}>Arhivat: {fmt(item.history.find((h) => h.action === "archived")?.at)}</div>

                                <div style={{ display: "flex", gap: 8 }}>
                                    {item.previewUrl && <a href={item.previewUrl} target="_blank" rel="noreferrer" style={ui.btn}>👁️ Previzualizează</a>}
                                    {item.downloadUrl && <a href={item.downloadUrl} target="_blank" rel="noreferrer" style={ui.btn}>⬇️ Descarcă</a>}
                                </div>
                            </div>

                            <div style={ui.history}>
                                <b>📜 Istoric acțiuni:</b>
                                {item.history.map((h: HistoryEntry, idx: number) => (
                                    <div key={idx} style={ui.histRow}>
                                        <b>{fmt(h.at)}</b> — {h.by}: <i>{h.action}</i> {h.note && `— ${h.note}`}
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div style={ui.btnRow}>
                <button style={ui.btn} onClick={exportJSON}>📤 Exportă arhiva JSON</button>
            </div>
        </div>
    );
}
