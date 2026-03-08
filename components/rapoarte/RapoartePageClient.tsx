"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/app/(dashboard)/rapoarte/page.module.css";
import { loadReports, Report, Role } from "@/lib/reports";
import { useOrg } from '@/lib/context/OrgContext';

type Props = { rapoarteDB: Report[] };

export default function RapoartePageClient({ rapoarteDB }: Props) {
    const { orgType } = useOrg();
    const currentUser: { role: Role } = { role: "Manager" };

    const [reports, setReports] = useState<Report[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number | "all">("all");
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftTitle, setDraftTitle] = useState("");

    useEffect(() => {
        const stored = loadReports();
        const map = new Map<string, Report>();
        [...rapoarteDB, ...stored].forEach((r) => map.set(r.id, r));
        const list = Array.from(map.values()).sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : -1
        );
        setReports(list);
    }, [rapoarteDB]);

    useEffect(() => setMonth("all"), [year]);

    const monthCounts = useMemo(() => {
        const arr = Array(12).fill(0);
        reports.filter((r) => r.year === year).forEach((r) => (arr[r.month - 1] += 1));
        return arr;
    }, [reports, year]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return reports.filter((r) => {
            const okY = r.year === year;
            const okM = month === "all" ? true : r.month === month;
            const okQ = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.author.toLowerCase().includes(q);
            return okY && okM && okQ;
        });
    }, [reports, year, month, query]);

    const startRename = (r: Report) => { setEditingId(r.id); setDraftTitle(r.title); };
    const saveRename = () => {
        if (!editingId) return;
        setReports((prev) => prev.map((r) => (r.id === editingId ? { ...r, title: draftTitle } : r)));
        setEditingId(null);
    };

    const deleteReport = (r: Report) => {
        if (currentUser.role !== "Admin") {
            alert("Nu esti autorizat sa stergi rapoarte.");
            return;
        }
        if (confirm(`Stergi raportul "${r.title}"?`)) {
            setReports((prev) => prev.filter((x) => x.id !== r.id));
        }
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>
                {orgType === 'spital' ? 'Rapoarte' : 'Rapoarte & Analiza'}
            </h1>

            <div className={styles.filters}>
                <div className={styles.filterItem}>
                    <label>An</label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 6 }, (_, i) => 2022 + i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterItem}>
                    <label>Luna</label>
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
                        placeholder="Cauta raport (titlu, descriere, autor)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className={styles.count}>{filtered.length} rapoarte gasite</div>
            </div>

            <div className={styles.grid}>
                {filtered.length === 0 && (
                    <div className={styles.empty}>Nu exista rapoarte pentru criteriile selectate.</div>
                )}
                {filtered.map((r) => {
                    const dateText = new Date(r.createdAt).toLocaleString("ro-RO", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                    });
                    const isEditing = editingId === r.id;
                    return (
                        <article key={r.id} className={styles.card}>
                            <div className={styles.cardBody}>
                                <div className={styles.cardHead}>
                                    {!isEditing ? (
                                        <h3 className={styles.cardTitle}>{r.title}</h3>
                                    ) : (
                                        <input className={styles.renameInput} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                                    )}
                                    {!isEditing ? (
                                        <button className={styles.iconBtn} title="Redenumeste" onClick={() => startRename(r)}>✏</button>
                                    ) : (
                                        <div className={styles.renameBtns}>
                                            <button className={styles.saveBtn} onClick={saveRename}>Salveaza</button>
                                            <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Anuleaza</button>
                                        </div>
                                    )}
                                </div>
                                <p className={styles.desc}>{r.description}</p>
                                <div className={styles.meta}>
                                    <div>Generat la: {dateText}</div>
                                    <div>Generat de: {r.author} ({r.role})</div>
                                    <div>Marime: {r.sizeMb} MB · Tip: {r.type}</div>
                                </div>
                                <div className={styles.tags}>
                                    {r.tags.map((t) => (
                                        <span key={t} className={styles.tag}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <div className={styles.leftActions}>
                                    <button className={styles.outlineBtn} onClick={() => alert("Descarca")}>Descarca</button>
                                    <button className={styles.outlineBtn} onClick={() => alert("Previzualizeaza")}>Previzualizeaza</button>
                                </div>
                                <button className={styles.deleteBtn} onClick={() => deleteReport(r)}>Sterge</button>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className={styles.note}>
                * Stergerea este permisa doar administratorilor.
            </div>
        </div>
    );
}