'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ensureDefaultProfile,
    softRestartOnboarding,
    hardResetHospital,
    setOnboardingFlag,
} from "@/lib/sections/storage";
import { getHospitalId } from "@/lib/context/tenant";

/* ——— stil card identic cu Administrație ——— */
const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.6)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    color: "inherit",
    textDecoration: "none",
};

export default function SettingsPage() {
    const HOSPITAL_ID = getHospitalId();
    const [loading, setLoading] = useState(true);
    const [onboardingDone, setOnboardingDone] = useState(false);

    useEffect(() => {
        const p = ensureDefaultProfile(HOSPITAL_ID);
        setOnboardingDone(!!p.onboardingCompleted);
        setLoading(false);
    }, [HOSPITAL_ID]);

    if (loading) return null;

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Setări</h1>
            <p style={{ margin: "6px 0 18px", opacity: 0.8 }}>
                Alege o categorie pentru a gestiona configurări și conturi.
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                }}
            >
                {/* ——— Card: Onboarding ——— */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <strong style={{ fontSize: 16 }}>Onboarding</strong>
                        <span
                            style={{
                                marginLeft: 6,
                                borderRadius: 999,
                                border: onboardingDone ? "1px solid #86efac" : "1px solid #facc15",
                                background: onboardingDone ? "#f0fdf4" : "#fffbeb",
                                color: onboardingDone ? "#166534" : "#92400e",
                                padding: "2px 8px",
                                fontSize: 12,
                            }}
                        >
                            {onboardingDone ? "Finalizat" : "Necompletat"}
                        </span>
                    </div>

                    <span style={{ fontSize: 13, opacity: 0.85 }}>
                        Tip spital, paturi, locații, secții și linii de gardă.
                    </span>

                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        {/* Actualizează (confirm + intră în onboarding) */}
                        <button
                            onClick={() => {
                                const ok = confirm(
                                    "Atenție: modificările aduse pot influența structura secțiilor și liniilor de gardă. Continui?"
                                );
                                if (!ok) return;
                                softRestartOnboarding(HOSPITAL_ID);
                                window.location.href = "/onboarding?ref=setari";
                            }}
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Actualizează
                        </button>

                        {/* Marchează finalizat (NU redirecționează) */}
                        <button
                            onClick={() => {
                                setOnboardingFlag(HOSPITAL_ID, true);
                                setOnboardingDone(true);
                                alert("Onboarding marcat ca finalizat.");
                            }}
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Marchează finalizat
                        </button>

                        {/* Reset complet */}
                        <button
                            onClick={() => {
                                const ok = confirm(
                                    "Ești sigur? Vor fi șterse tipul spitalului, paturile, locațiile, secțiile și liniile de gardă din acest browser."
                                );
                                if (!ok) return;
                                hardResetHospital(HOSPITAL_ID);
                                window.location.href = "/onboarding?ref=setari";
                            }}
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 10,
                                border: "1px solid #fca5a5",
                                background: "#fff",
                                color: "#b91c1c",
                                cursor: "pointer",
                            }}
                        >
                            Reset complet
                        </button>
                    </div>

                    {/* Deschide → către onboarding cu markerul ref=setari */}
                    <Link href="/onboarding?ref=setari" style={{ marginTop: "auto", fontSize: 13, opacity: 0.9 }}>
                        Deschide →
                    </Link>
                </div>

                {/* ——— Card: Conturi ——— */}
                <div style={cardStyle}>
                    <strong style={{ fontSize: 16 }}>Conturi</strong>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>
                        Utilizatori, roluri și drepturi de acces.
                    </span>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button
                            disabled
                            title="În curând"
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                background: "#fff",
                                opacity: 0.6,
                            }}
                        >
                            + Adaugă utilizator (curând)
                        </button>
                    </div>
                    <Link href="/setari/conturi" style={{ marginTop: "auto", fontSize: 13, opacity: 0.9 }}>
                        Deschide →
                    </Link>
                </div>

                {/* ——— Card: Notificări ——— */}
                <div style={cardStyle}>
                    <strong style={{ fontSize: 16 }}>Notificări</strong>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>
                        Alerte email, rapoarte programate, remindere periodice.
                    </span>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button
                            disabled
                            title="În curând"
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                background: "#fff",
                                opacity: 0.6,
                            }}
                        >
                            Configurează (curând)
                        </button>
                    </div>
                    <Link href="/setari/notificari" style={{ marginTop: "auto", fontSize: 13, opacity: 0.9 }}>
                        Deschide →
                    </Link>
                </div>
            </div>
        </div>
    );
}
