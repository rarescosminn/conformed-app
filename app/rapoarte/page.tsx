"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { loadReports, Report, Role } from "../../lib/reports"; // ✅ importăm Role

// Seed demo (poți șterge când ai date reale)
const SEED: Report[] = [
    {
        id: "seed-1",
        title: "Raport conformare Q1 2025",
        description: "Include: ISO 9001, ISO 14001, HR, Financiar",
        createdAt: "2025-09-20T10:42:00",
        author: "Maria Ionescu",
        role: "Manager",
        sizeMb: 1.8,
        type: "PDF",
        tags: ["Conformare", "Implementare", "Interpretare", "KPI HR"],
        year: 2025,
        month: 9,
    },
    {
        id: "seed-2",
        title: "Raport risc Septembrie 2025",
        description: "NC majore + Burnout ATI",
        createdAt: "2025-09-15T09:10:00",
        author: "Ion Popescu",
        role: "Admin",
        sizeMb: 2.1,
        type: "PDF",
        tags: ["Risc", "HR", "SSM"],
        year: 2025,
        month: 9,
    },
];

export default function RapoartePage() {
    // ✅ tip corect pentru rol (rezolvă TS2367)
    const currentUser: { role: Role } = { role: "Manager" };

    const [reports, setReports] = useState<Report[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number | "all">("all");
    const [query, setQuery] = useState("");

    // încarcă seed + localStorage (evită dublurile; sortează desc după createdAt)
    useEffect(() => {
        const stored = loadReports();
        const map = new Map<string, Report>();
        [...SEED, ...stored].forEach((r) => map.set(r.id, r));
        const list = Array.from(map.values()).sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : -1
        );
        setReports(list);
    }, []);

    // număr rapoarte pe lună pentru anul selectat
    const monthCounts = useMemo(() => {
        const arr = Array(12).fill(0);
        reports.filter((r) => r.year === year).forEach((r) => (arr[r.month - 1] += 1));
        return arr;
    }, [reports, year]);

    // când se schimbă anul, resetăm luna la „Toate”
    useEffect(() => setMonth("all"), [year]);

    // filtrare
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return reports.filter((r) => {
            const okY = r.year === year;
            const okM = month === "all" ? true : r.month === month;
            const okQ =
                !q ||
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.author.toLowerCase().includes(q);
            return okY && okM && okQ;
        });
    }, [reports, year, month, query]);

    // rename
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftTitle, setDraftTitle] = useState("");

    const startRename = (r: Report) => {
        setEditingId(r.id);
        setDraftTitle(r.title);
    };

    const saveRename = () => {
        if (!editingId) return;
        setReports((prev) => prev.map((r) => (r.id === editingId ? { ...r, title: draftTitle } : r)));
        setEditingId(null);
    };

    // delete (protejată de rol)
    const deleteReport = (r: Report) => {
        if (currentUser.role !== "Admin") {
            alert("❌ Nu ești autorizat să ștergi rapoarte. Funcția este disponibilă doar pentru administratori.");
            return;
        }
        if (confirm(`Ștergi raportul „${r.title}”?`)) {
            setReports((prev) => prev.filter((x) => x.id !== r.id));
        }
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Rapoarte</h1>

            {/* Filtre */}
            <div className={styles.filters}>
                <div className={styles.filterItem}>
                    <label>An</label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 6 }, (_, i) => 2022 + i).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterItem}>
                    <label>Lună</label>
                    <select
                        value={month === "all" ? "all" : String(month)}
                        onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                    >
                        <option value="all">Toate</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                            const label = new Date(2025, m - 1, 1).toLocaleString("ro-RO", { month: "long" });
                            const has = monthCounts[m - 1] > 0;
                            return (
                                <option key={m} value={m} disabled={!has}>
                                    {label} {!has ? "(0)" : ""}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>🔎</span>
                    <input
                        className={styles.searchInput}
                        placeholder="Caută raport (titlu, descriere, autor)…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className={styles.count}>{filtered.length} rapoarte găsite</div>
            </div>

            {/* Carduri */}
            <div className={styles.grid}>
                {filtered.length === 0 && (
                    <div className={styles.empty}>Nu există rapoarte pentru criteriile selectate.</div>
                )}

                {filtered.map((r) => {
                    const dateText = new Date(r.createdAt).toLocaleString("ro-RO", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    const isEditing = editingId === r.id;

                    return (
                        <article key={r.id} className={styles.card}>
                            <div className={styles.cardBody}>
                                <div className={styles.cardHead}>
                                    {!isEditing ? (
                                        <h3 className={styles.cardTitle}>{r.title}</h3>
                                    ) : (
                                        <input
                                            className={styles.renameInput}
                                            value={draftTitle}
                                            onChange={(e) => setDraftTitle(e.target.value)}
                                        />
                                    )}

                                    {!isEditing ? (
                                        <button
                                            className={styles.iconBtn}
                                            title="Redenumește"
                                            onClick={() => startRename(r)}
                                        >
                                            ✏
                                        </button>
                                    ) : (
                                        <div className={styles.renameBtns}>
                                            <button className={styles.saveBtn} onClick={saveRename}>
                                                Salvează
                                            </button>
                                            <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                                                Anulează
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className={styles.desc}>{r.description}</p>

                                <div className={styles.meta}>
                                    <div>Generat la: {dateText}</div>
                                    <div>
                                        Generat de: {r.author} ({r.role})
                                    </div>
                                    <div>
                                        Mărime: {r.sizeMb} MB · Tip: {r.type}
                                    </div>
                                </div>

                                <div className={styles.tags}>
                                    {r.tags.map((t) => (
                                        <span key={t} className={styles.tag}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.leftActions}>
                                    <button className={styles.outlineBtn} onClick={() => alert("Descarcă")}>
                                        ⬇ Descarcă
                                    </button>
                                    <button className={styles.outlineBtn} onClick={() => alert("Previzualizează")}>
                                        👁 Previzualizează
                                    </button>
                                </div>

                                <button className={styles.deleteBtn} onClick={() => deleteReport(r)}>
                                    🗑 Șterge
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className={styles.note}>
                * Ștergerea este permisă doar administratorilor; altfel apare mesaj „neautorizat”.
            </div>
        </div>
    );
}
