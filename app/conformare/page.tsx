"use client";

import { useMemo, useState } from "react";
import { addReport, generateId, Report } from "../../lib/reports";

type Domeniu = {
    id: string;
    titlu: string;
    scor: number;
    descriere: string;
};

const ui = {
    page: { padding: 24, display: "grid", gap: 16, background: "#f7f8fb" } as const,
    header: { display: "flex", justifyContent: "space-between", alignItems: "center" } as const,
    h1: { margin: 0, fontSize: 28, fontWeight: 700 } as const,
    btnPrimary: {
        border: "none", background: "#2563eb", color: "#fff",
        padding: "10px 14px", borderRadius: 12, cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,.08)"
    } as const,
    banner: {
        border: "1px solid #fde68a", background: "#fffbeb",
        padding: "12px 14px", borderRadius: 14
    } as const,
    card: {
        border: "1px solid rgba(0,0,0,.06)", background: "#fff",
        borderRadius: 16, boxShadow: "0 8px 20px rgba(13,27,55,.04)", padding: 16
    } as const,
    cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" } as const,
    caption: { fontSize: 13, color: "#6b7280" } as const,
    badge: { padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 } as const,
    bOk: { background: "#d1fae5", color: "#065f46" } as const,
    bMid: { background: "#fef3c7", color: "#92400e" } as const,
    bBad: { background: "#fee2e2", color: "#991b1b" } as const,
    score: { fontSize: 24, fontWeight: 700 } as const,
    bar: { height: 8, width: "100%", background: "#eef2ff", borderRadius: 999, overflow: "hidden" } as const,
    barFill: (w: number) => ({ height: "100%", width: `${w}%`, background: "#2563eb" } as const),
    grid: {
        display: "grid", gap: 16,
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", alignItems: "stretch"
    } as const,
    open: { fontSize: 13, marginTop: 6, cursor: "pointer" } as const,
};

const domenii: Domeniu[] = [
    // ISO + operațional
    { id: "ISO9001", titlu: "ISO 9001", scor: 68, descriere: "Sistemul de management al calității." },
    { id: "ISO14001", titlu: "ISO 14001", scor: 75, descriere: "Mediu – aspecte & obiective." },
    { id: "ISO45001", titlu: "ISO 45001", scor: 81, descriere: "SSM – sănătate & securitate." },
    { id: "ISO50001", titlu: "ISO 50001", scor: 64, descriere: "Energie – consum & ținte." },
    { id: "SCIM", titlu: "SCIM", scor: 70, descriere: "Standard clinic & indicatori." },
    { id: "MEDIU", titlu: "Mediu", scor: 72, descriere: "Deșeuri, emisii, resurse." },
    { id: "SSM", titlu: "SSM", scor: 66, descriere: "Accidente, instruiri, riscuri." },
    { id: "PSI", titlu: "PSI", scor: 78, descriere: "Prevenire și stingere incendii." },

    // extra „bogăție” din alte module (hardcoded acum)
    { id: "CHEST", titlu: "Chestionare", scor: 76, descriere: "Grad conformare + dovezi." },
    { id: "BURN", titlu: "Burnout (HR)", scor: 71, descriere: "Stare personal & risc." },
    { id: "TRAIN", titlu: "Training HR", scor: 83, descriere: "Obligatorii & expirări." },
    { id: "IAAM", titlu: "IAAM", scor: 79, descriere: "Infecții asociate AM." },
    { id: "EVADV", titlu: "Evenimente adverse", scor: 74, descriere: "Rezolvate la termen." },
    { id: "FIN", titlu: "Financiar", scor: 79, descriere: "Plăți la termen, achiziții." },
    { id: "LEG", titlu: "Legislație", scor: 71, descriere: "Aliniere & update." },
    { id: "APR", titlu: "Aprobări", scor: 69, descriere: "Documente în așteptare." },
];

function badgeFor(s: number) {
    if (s >= 80) return { txt: "Conform", style: ui.bOk };
    if (s >= 65) return { txt: "Parțial", style: ui.bMid };
    return { txt: "Neconform", style: ui.bBad };
}

export default function ConformarePage() {
    const overall = useMemo(
        () => Math.round(domenii.reduce((a, b) => a + b.scor, 0) / domenii.length),
        []
    );

    const genRaport = () => {
        const now = new Date();
        const r: Report = {
            id: generateId(),
            title: `Raport conformare ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            description: "Include: Conformare generală + domenii (ISO, HR, SSM, PSI, Mediu, Financiar).",
            createdAt: now.toISOString(),
            author: "Utilizator curent",
            role: "Manager",
            sizeMb: Number((1 + Math.random() * 1.5).toFixed(1)),
            type: "PDF",
            tags: ["Conformare", "ISO", "HR", "SSM", "PSI", "Mediu", "Financiar"],
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        };
        addReport(r);
        alert("Raport creat. Îl găsești în Rapoarte.");
    };

    return (
        <div style={ui.page as React.CSSProperties}>
            <div style={ui.header}>
                <h1 style={ui.h1}>Conformare – Evaluare generală</h1>
                <button style={ui.btnPrimary} onClick={genRaport}>📄 Generează raport</button>
            </div>

            <div style={ui.banner}>
                <strong>⚠ Raport generat automat</strong>
                <div>Acest raport necesită validare umană înainte de utilizare.</div>
            </div>

            {/* scor general */}
            <div style={ui.card}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Scor general conformare</div>
                <div style={{ display: "grid", gap: 8, placeItems: "center" }}>
                    <div style={{ fontSize: 44, fontWeight: 800 }}>{overall}%</div>
                    <div style={ui.bar}><div style={ui.barFill(overall)} /></div>
                    <div style={{ color: "#64748b" }}>+4% față de luna anterioară</div>
                </div>
            </div>

            {/* carduri identice */}
            <div style={ui.grid}>
                {domenii.map((d) => {
                    const b = badgeFor(d.scor);
                    return (
                        <article key={d.id} style={ui.card}>
                            <div style={ui.cardTopRow}>
                                <div style={ui.caption}>{d.titlu}</div>
                                <span style={{ ...ui.badge, ...b.style }}>{b.txt}</span>
                            </div>

                            <div style={ui.score}>{d.scor}%</div>
                            <div style={ui.bar}><div style={ui.barFill(d.scor)} /></div>

                            <div style={{ marginTop: 8 }}>{d.descriere}</div>
                            <div style={ui.open} onClick={() => alert(`Deschide detaliu: ${d.titlu}`)}>Deschide →</div>
                        </article>
                    );
                })}
            </div>

            <div style={{ color: "#6b7280", fontSize: 12 }}>
                Ultimul update: 20.09.2025, 11:32 · Date sursă: KPIs.xlsx, PG-04.pdf
            </div>
        </div>
    );
}
