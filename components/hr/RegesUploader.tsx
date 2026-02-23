// components/hr/RegesUploader.tsx
"use client";

import { useRef, useState } from "react";

type RegesRow = {
    sectie: string;
    rol: "Medici" | "Asistenți" | "Infirmieri" | "Șef secție" | string;
    norma: number;        // 1, 0.5 etc. -> FTE
    status: "activ" | "suspendat" | "încetat" | string;
};

type Summary = {
    totalRanduri: number;
    totalActivFTE: number;
    peSectieRol: Record<string, { activFTE: number; activPersoane: number }>;
};

export default function RegesUploader({
    onParsed,
}: {
    onParsed?: (rows: RegesRow[], summary: Summary) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>("");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState<string>("");

    const handlePick = () => inputRef.current?.click();

    const parseCsv = async (file: File) => {
        setError("");
        setFileName(file.name);
        const text = await file.text();

        // Acceptă separator , ; sau \t
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
            setError("Fișierul pare gol sau fără antet.");
            return;
        }

        const header = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
        const idxSectie = header.findIndex((h) => ["sectie", "secție"].includes(h));
        const idxRol = header.findIndex((h) => h === "rol");
        const idxNorma = header.findIndex((h) => h === "norma");
        const idxStatus = header.findIndex((h) => h === "status");

        if (idxSectie < 0 || idxRol < 0 || idxNorma < 0 || idxStatus < 0) {
            setError(
                "Antet invalid. Aștept coloane: sectie, rol, norma, status (separator: , ; sau TAB)."
            );
            return;
        }

        const rows: RegesRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(/[,;\t]/).map((c) => c.trim());
            if (cols.length < header.length) continue;

            const sectie = cols[idxSectie] || "";
            const rol = cols[idxRol] || "";
            const norma = Number((cols[idxNorma] || "0").replace(",", "."));
            const status = (cols[idxStatus] || "").toLowerCase();

            if (!sectie || !rol) continue;
            if (Number.isNaN(norma)) continue;

            rows.push({
                sectie,
                rol: rol as RegesRow["rol"],
                norma,
                status: status as RegesRow["status"],
            });
        }

        const sum = aggregate(rows);
        setSummary(sum);
        onParsed?.(rows, sum);
    };

    const aggregate = (rows: RegesRow[]): Summary => {
        const peSectieRol: Summary["peSectieRol"] = {};
        let totalActivFTE = 0;

        rows.forEach((r) => {
            const key = `${r.sectie}::${r.rol}`;
            const isActiv = r.status === "activ";
            if (!peSectieRol[key]) peSectieRol[key] = { activFTE: 0, activPersoane: 0 };
            if (isActiv) {
                peSectieRol[key].activFTE += r.norma;
                peSectieRol[key].activPersoane += 1;
                totalActivFTE += r.norma;
            }
        });

        // rotunjiri prietenoase
        Object.values(peSectieRol).forEach((v) => (v.activFTE = Number(v.activFTE.toFixed(2))));

        return {
            totalRanduri: rows.length,
            totalActivFTE: Number(totalActivFTE.toFixed(2)),
            peSectieRol,
        };
    };

    return (
        <div
            style={{
                marginTop: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 12,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={handlePick}
                    style={{
                        background: "#0f62fe",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Încarcă REGES (CSV)
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) parseCsv(f);
                    }}
                />
                {fileName && <span style={{ opacity: 0.7, fontSize: 12 }}>Fișier: {fileName}</span>}
            </div>

            {error && (
                <div style={{ marginTop: 10, color: "#dc2626", fontSize: 13 }}>
                    {error}
                </div>
            )}

            {summary && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Badge label="Total rânduri" value={summary.totalRanduri} />
                        <Badge label="Activ FTE" value={summary.totalActivFTE} />
                    </div>

                    <div
                        style={{
                            marginTop: 12,
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                            paddingTop: 10,
                            overflowX: "auto",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead style={{ background: "#f8fafc", color: "#475569" }}>
                                <tr>
                                    <Th>Secție</Th>
                                    <Th>Rol</Th>
                                    <Th align="right">Activ FTE</Th>
                                    <Th align="right">Persoane active</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(summary.peSectieRol).map(([key, val]) => {
                                    const [sectie, rol] = key.split("::");
                                    return (
                                        <tr key={key} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                                            <Td>{sectie}</Td>
                                            <Td>{rol}</Td>
                                            <Td align="right">{val.activFTE}</Td>
                                            <Td align="right">{val.activPersoane}</Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Badge({ label, value }: { label: string; value: number | string }) {
    return (
        <div
            style={{
                background: "#f8fafc",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 8,
                padding: "8px 10px",
            }}
        >
            <div style={{ fontSize: 11, opacity: 0.65 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function Th({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right" | "center";
}) {
    return (
        <th
            style={{
                textAlign: align,
                padding: "10px 12px",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.2,
            }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right" | "center";
}) {
    return <td style={{ textAlign: align, padding: "10px 12px" }}>{children}</td>;
}
