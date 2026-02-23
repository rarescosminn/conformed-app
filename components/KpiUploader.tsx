// components/KpiUploader.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

type ParsedRow = { label: string; value: number };
type ParsedSheet = { name: string; rows: ParsedRow[] };
type ParsedWorkbook = { fileName: string; sheets: ParsedSheet[] };

type Props = {
    onParsed?: (workbooks: ParsedWorkbook[]) => void;
    maxFiles?: number;
    kpis?: { key: string; label: string }[]; // opțional, compat
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
]);
const ALLOWED_EXT = [".xlsx", ".xls"];

type FileState =
    | { name: string; size: number; status: "ready" | "parsing"; error?: string }
    | { name: string; size: number; status: "done"; parsed: ParsedWorkbook }
    | { name: string; size: number; status: "error"; error: string };

export default function KpiUploader({ onParsed, maxFiles = 20 }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [filesState, setFilesState] = useState<FileState[]>([]);
    const [parsedWorkbooks, setParsedWorkbooks] = useState<ParsedWorkbook[]>([]);
    const [isNarrow, setIsNarrow] = useState(false);

    // fade scroll hints (dreapta)
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 960px)");
        const onChange = () => setIsNarrow(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);

    const updateFades = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const atTop = scrollTop <= 1;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
        setShowTopFade(!atTop);
        setShowBottomFade(!atBottom && scrollHeight > clientHeight + 1);
    }, []);

    useEffect(() => {
        updateFades();
    }, [filesState.length, parsedWorkbooks.length, updateFades]);

    const onScrollList = () => updateFades();

    const openFileDialog = () => inputRef.current?.click();

    const validateFile = (file: File): string | null => {
        const name = file.name.toLowerCase();
        const byExt = ALLOWED_EXT.some((ext) => name.endsWith(ext));
        const byMime = file.type ? ALLOWED_MIME.has(file.type) : true;
        if (!byExt || !byMime) return "Format invalid. Acceptat: .xlsx, .xls";
        if (file.size > MAX_FILE_SIZE_BYTES) return "Fișier prea mare (max 5 MB).";
        return null;
    };

    // ——— XLS(X) parsing ———
    const parseSheet = (ws: XLSX.WorkSheet, sheetName: string): ParsedSheet => {
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        const parsed: ParsedRow[] = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 2) continue;
            const labelRaw = String(r[0] ?? "").trim();
            const valueRaw = r[1];
            if (!labelRaw) continue;
            const valueNum =
                typeof valueRaw === "number"
                    ? valueRaw
                    : valueRaw === null || valueRaw === undefined || valueRaw === ""
                        ? NaN
                        : Number(String(valueRaw).replace(/\s/g, "").replace(",", "."));
            if (!Number.isFinite(valueNum)) continue;
            parsed.push({ label: labelRaw, value: valueNum });
        }
        return { name: sheetName, rows: parsed };
    };

    const parseExcelFile = async (file: File): Promise<ParsedWorkbook> => {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const sheets: ParsedSheet[] = [];
        wb.SheetNames.forEach((sn) => {
            const ws = wb.Sheets[sn];
            if (!ws) return;
            const ps = parseSheet(ws, sn);
            if (ps.rows.length > 0) sheets.push(ps);
        });
        return { fileName: file.name, sheets };
    };

    const upsertFileState = (name: string, next: Partial<FileState>) => {
        setFilesState((prev) =>
            prev.map((f) => (f.name === name ? ({ ...f, ...next } as FileState) : f))
        );
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const incoming = Array.from(fileList).slice(0, maxFiles);
        const initial: FileState[] = [];

        for (const f of incoming) {
            const err = validateFile(f);
            if (err) {
                initial.push({ name: f.name, size: f.size, status: "error", error: err });
            } else {
                initial.push({ name: f.name, size: f.size, status: "parsing" });
            }
        }

        setFilesState((prev) => {
            const dedup = new Map(prev.map((x) => [x.name + ":" + x.size, x]));
            initial.forEach((x) => dedup.set(x.name + ":" + x.size, x));
            return Array.from(dedup.values());
        });

        const newlyParsed: ParsedWorkbook[] = [];
        for (const f of incoming) {
            const err = validateFile(f);
            if (err) {
                upsertFileState(f.name, { status: "error", error: err });
                continue;
            }
            try {
                const parsed = await parseExcelFile(f);
                newlyParsed.push(parsed);
                upsertFileState(f.name, { status: "done", parsed });
            } catch {
                upsertFileState(f.name, {
                    status: "error",
                    error: "Eroare la citirea fișierului. Verifică structura.",
                });
            }
        }

        if (newlyParsed.length) {
            setParsedWorkbooks((prev) => {
                const next = [...prev, ...newlyParsed];
                onParsed?.(next);
                return next;
            });
            setTimeout(updateFades, 0);
        }
    };

    // D&D
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (inputRef.current) inputRef.current.value = "";
    };

    const removeParsed = useCallback(
        (fileName: string) => {
            setParsedWorkbooks((prev) => {
                const next = prev.filter((w) => w.fileName !== fileName);
                onParsed?.(next);
                return next;
            });
            setFilesState((prev) => prev.filter((f) => f.name !== fileName));
            setTimeout(updateFades, 0);
        },
        [onParsed, updateFades]
    );

    const clearAll = () => {
        setParsedWorkbooks([]);
        setFilesState([]);
        onParsed?.([]);
        setTimeout(updateFades, 0);
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.header}>
                <div style={styles.title}>Import KPI din Excel</div>
                {(parsedWorkbooks.length > 0 || filesState.length > 0) && (
                    <button onClick={clearAll} style={styles.clearBtn}>Reset</button>
                )}
            </div>

            <div style={{ ...styles.layout, ...(isNarrow ? styles.layoutColumn : styles.layoutRow) }}>
                {/* STÂNGA: uploader */}
                <div style={styles.leftCol}>
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        style={{ ...styles.dropzone, ...(dragActive ? styles.dropzoneActive : {}) }}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept={ALLOWED_EXT.join(",")}
                            multiple
                            onChange={onInputChange}
                            style={{ display: "none" }}
                        />
                        <div style={styles.dropInner}>
                            <div style={styles.iconCircle}>⬆️</div>
                            <div style={{ fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
                                Trage aici fișierele .xlsx/.xls sau
                            </div>
                            <button type="button" onClick={openFileDialog} style={styles.ctaBtn}>Încarcă fișiere</button>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textAlign: "center" }}>
                                Acceptă .xlsx / .xls • max 5 MB/fișier • poți încărca mai multe
                            </div>
                        </div>
                    </div>
                </div>

                {/* DREAPTA: listă + fade + rezumat */}
                <div style={styles.rightCol}>
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <div style={{ fontWeight: 700 }}>
                                Fișiere încărcate
                                {parsedWorkbooks.length > 0 && <span style={styles.countBadge}>{parsedWorkbooks.length}</span>}
                            </div>
                        </div>

                        <div style={styles.scrollWrap}>
                            <div style={{ ...styles.fadeTop, opacity: showTopFade ? 1 : 0 }} />
                            <div ref={scrollRef} onScroll={onScrollList} style={styles.scrollList}>
                                {filesState.length === 0 && (
                                    <div style={styles.emptyState}>
                                        <div style={{ fontSize: 12.5, opacity: 0.7, textAlign: "center" }}>
                                            Niciun fișier încărcat încă. Adaugă fișiere din panoul din stânga.
                                        </div>
                                    </div>
                                )}

                                {filesState.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {filesState.map((f) => (
                                            <div key={f.name + ":" + f.size} style={styles.fileItemCompact}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                                    <div style={styles.fileBadgeSmall}>
                                                        {f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls") ? "XLSX" : "FILE"}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }} title={f.name}>
                                                            {f.name}
                                                        </div>
                                                        <div style={{ fontSize: 11, opacity: 0.7 }}>{(f.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                    {f.status === "parsing" && <span style={{ fontSize: 11.5, opacity: 0.8 }}>Se procesează…</span>}
                                                    {f.status === "error" && <span style={{ fontSize: 11.5, color: "#d33" }}>{(f as any).error}</span>}
                                                    {f.status === "done" && (
                                                        <>
                                                            <span style={{ fontSize: 11.5, color: "#1b8f4b" }}>OK</span>
                                                            <button onClick={() => removeParsed(f.name)} style={styles.smallGhostBtn} title="Elimină din listă">Elimină</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ ...styles.fadeBottom, opacity: showBottomFade ? 1 : 0 }} />
                        </div>

                        {parsedWorkbooks.length > 0 && (
                            <div style={styles.summary}>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>Rezumat</div>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    {parsedWorkbooks.map((wb) => (
                                        <li key={wb.fileName} style={{ marginBottom: 2 }}>
                                            <strong>{wb.fileName}</strong>{" "}
                                            <span style={{ opacity: 0.7 }}>
                                                — {wb.sheets.length} foi {wb.sheets.length ? `(${wb.sheets.map((s) => s.name).join(", ")})` : ""}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ——— styles ———
const styles: Record<string, React.CSSProperties> = {
    wrapper: { border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, background: "linear-gradient(180deg, #ffffff, #fafafa)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    title: { fontWeight: 800, fontSize: 16 },
    clearBtn: { border: "1px solid rgba(0,0,0,0.12)", background: "#fff", padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

    layout: { gap: 16 },
    layoutRow: { display: "grid", gridTemplateColumns: "35% 65%" },
    layoutColumn: { display: "grid", gridTemplateColumns: "1fr" },

    leftCol: { minWidth: 0 },
    rightCol: { minWidth: 0 },

    dropzone: { position: "relative", border: "1.5px dashed rgba(0,0,0,0.25)", borderRadius: 14, background: "linear-gradient(180deg, #f8fafc, #f6f7fb)", padding: 24, transition: "all 0.15s ease", minHeight: 140 },
    dropzoneActive: { borderColor: "#2d7df6", boxShadow: "0 0 0 4px rgba(45,125,246,0.08) inset" },
    dropInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
    iconCircle: { width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(45,125,246,0.12), rgba(41,196,173,0.12))", fontSize: 20 },
    ctaBtn: { border: "none", cursor: "pointer", padding: "10px 16px", borderRadius: 12, fontWeight: 700, color: "white", background: "linear-gradient(135deg, #2d7df6, #29c4ad)", boxShadow: "0 6px 18px rgba(45,125,246,0.25)" },

    panel: { border: "1px solid rgba(0,0,0,0.08)", background: "#fff", borderRadius: 14, padding: 12, minHeight: 180, display: "flex", flexDirection: "column" },
    panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    countBadge: { marginLeft: 8, fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(45,125,246,0.25)", background: "linear-gradient(135deg, #e8f0ff, #e8f9f6)" },

    scrollWrap: { position: "relative", marginBottom: 10 },
    scrollList: { overflowY: "auto", maxHeight: 240, paddingRight: 6, borderBottom: "1px dashed rgba(0,0,0,0.1)" },
    fadeTop: { position: "absolute", left: 0, right: 0, top: 0, height: 14, pointerEvents: "none", background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,0))", transition: "opacity 120ms ease" },
    fadeBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 14, pointerEvents: "none", background: "linear-gradient(0deg, rgba(255,255,255,1), rgba(255,255,255,0))", transition: "opacity 120ms ease" },

    emptyState: { display: "grid", placeItems: "center", minHeight: 90, border: "1px dashed rgba(0,0,0,0.08)", borderRadius: 12, background: "linear-gradient(180deg, #fafafa, #fefefe)", marginBottom: 10 },

    fileItemCompact: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.06)" },
    fileBadgeSmall: { fontSize: 10.5, fontWeight: 800, border: "1px solid rgba(45,125,246,0.25)", background: "linear-gradient(135deg, #e8f0ff, #e8f9f6)", borderRadius: 8, padding: "1px 6px", flexShrink: 0 },
    smallGhostBtn: { border: "1px solid rgba(0,0,0,0.12)", background: "#fff", padding: "5px 8px", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 11.5 },

    summary: { paddingTop: 10 },
};
