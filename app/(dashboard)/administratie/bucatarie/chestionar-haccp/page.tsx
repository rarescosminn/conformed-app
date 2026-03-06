"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Reading = { value?: string; photo?: File | null };
type ShiftKey = "morning" | "noon" | "evening";
type Mode = "random" | "strict";

const SHIFTS: ShiftKey[] = ["morning", "noon", "evening"];
const SHIFT_LABEL: Record<ShiftKey, string> = {
    morning: "Dimineață",
    noon: "Prânz",
    evening: "Seara",
};

// ——— Helpers plan lunar 80/20 ———
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();
function generatePhotoPlan(totalDays: number, ratio = 0.2): number[] {
    const k = Math.max(1, Math.round(totalDays * ratio));
    const pool = Array.from({ length: totalDays }, (_, i) => i + 1);
    const chosen: number[] = [];
    while (chosen.length < k && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
    }
    return chosen.sort((a, b) => a - b);
}
function loadPlan(): number[] | null {
    try {
        const k = `haccpPhotoPlan-${monthKey()}`;
        const raw = localStorage.getItem(k);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) return parsed as number[];
    } catch { }
    return null;
}
function savePlan(days: number[]) {
    const k = `haccpPhotoPlan-${monthKey()}`;
    localStorage.setItem(k, JSON.stringify(days));
}

export default function HaccpFormPage() {
    // ——— Formular ———
    const [fridge, setFridge] = useState<Record<ShiftKey, Reading>>({ morning: {}, noon: {}, evening: {} });
    const [freezer, setFreezer] = useState<Record<ShiftKey, Reading>>({ morning: {}, noon: {}, evening: {} });

    const [receivingTemp, setReceivingTemp] = useState<string>("");

    // Critic (în plan)
    const [foodSamplesPhoto, setFoodSamplesPhoto] = useState<File | null>(null);

    // Non-critic
    const [sanitationDone, setSanitationDone] = useState<boolean>(false);
    const [sanitationPhoto, setSanitationPhoto] = useState<File | null>(null);
    const [allergensDisplayed, setAllergensDisplayed] = useState<boolean>(false);

    // Mod validare: 80/20 vs Strict
    const [mode, setMode] = useState<Mode>("random");

    // Plan lunar
    const now = new Date();
    const totalMonthDays = daysInMonth(now.getFullYear(), now.getMonth());
    const today = now.getDate();

    const [photoDays, setPhotoDays] = useState<number[]>([]);
    useEffect(() => {
        const existing = loadPlan();
        if (existing?.length) setPhotoDays(existing);
        else {
            const total = Math.min(30, totalMonthDays);
            const plan = generatePhotoPlan(total, 0.2);
            setPhotoDays(plan);
            savePlan(plan);
        }
    }, [totalMonthDays]);

    const toggleTodayRequirement = () => {
        setPhotoDays((prev) => {
            const has = prev.includes(today);
            const next = has ? prev.filter((d) => d !== today) : [...prev, today].sort((a, b) => a - b);
            savePlan(next);
            return next;
        });
    };

    const photoRequiredToday = useMemo(() => (mode === "strict" ? true : photoDays.includes(today)), [mode, photoDays, today]);

    // Escaladare: lipsă 2 citiri consecutive
    const escalation = useMemo(() => {
        const seqMissing = (obj: Record<ShiftKey, Reading>) => {
            let streak = 0;
            for (const k of SHIFTS) {
                const miss = !obj[k].value;
                streak = miss ? streak + 1 : 0;
                if (streak >= 2) return true;
            }
            return false;
        };
        return { fridge: seqMissing(fridge), freezer: seqMissing(freezer) };
    }, [fridge, freezer]);

    // Validare
    const [errors, setErrors] = useState<string[]>([]);
    const validate = (): boolean => {
        const errs: string[] = [];
        const needPhoto = (r: Reading) => photoRequiredToday && !!r.value;

        SHIFTS.forEach((k) => {
            if (needPhoto(fridge[k]) && !fridge[k].photo) errs.push(`Frigider – ${SHIFT_LABEL[k]}: lipsește dovada foto (critic).`);
            if (needPhoto(freezer[k]) && !freezer[k].photo) errs.push(`Congelator – ${SHIFT_LABEL[k]}: lipsește dovada foto (critic).`);
        });

        if (photoRequiredToday && !foodSamplesPhoto) errs.push("Probe aliment: dovadă foto obligatorie azi (critic).");

        setErrors(errs);
        return errs.length === 0;
    };

    // Scor
    const score = useMemo(() => {
        let s = 0;
        const okPart = (obj: Record<ShiftKey, Reading>) =>
            SHIFTS.filter((k) => (!photoRequiredToday ? !!obj[k].value : !!obj[k].value && !!obj[k].photo)).length / SHIFTS.length;

        s += 30 * okPart(fridge);
        s += 30 * okPart(freezer);
        s += (photoRequiredToday ? (foodSamplesPhoto ? 10 : 0) : foodSamplesPhoto ? 10 : 0);
        s += sanitationDone ? 15 : 0;
        s += allergensDisplayed ? 15 : 0;
        return Math.round(s);
    }, [fridge, freezer, foodSamplesPhoto, sanitationDone, allergensDisplayed, photoRequiredToday]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        alert(`Chestionar închis cu scor ${score}%.`);
    };

    const inputBox = {
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        width: "100%",
    } as const;

    const Section: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({ title, desc, children }) => (
        <section
            style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                background: "rgba(255,255,255,0.65)",
                padding: 16,
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                marginBottom: 12,
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
            {desc && <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>{desc}</div>}
            {children}
        </section>
    );

    const CalendarDots = () => {
        const total = Math.min(30, totalMonthDays);
        const set = new Set(photoDays);
        return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
                {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
                    const req = set.has(d);
                    return (
                        <div
                            key={d}
                            title={req ? `Ziua ${d}: foto obligatorie` : `Ziua ${d}: foto opțională`}
                            style={{
                                height: 24,
                                borderRadius: 999,
                                border: "1px solid rgba(0,0,0,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                background: req ? "rgba(255,0,0,0.08)" : "transparent",
                            }}
                        >
                            {d}
                        </div>
                    );
                })}
            </div>
        );
    };

    const fileBorder = (need: boolean, has?: File | null) =>
        need && !has ? "1px solid rgba(255,0,0,0.55)" : "1px solid rgba(0,0,0,0.12)";

    return (
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
            {/* Stânga: formular */}
            <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>HACCP — Monitorizare temperaturi & probe (Bucătărie)</h1>
                    <span
                        style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: photoRequiredToday ? "rgba(255,0,0,0.06)" : "rgba(0,128,0,0.06)",
                        }}
                        title="Obligativitatea dovezii foto pentru ziua curentă"
                    >
                        Status azi: <strong>{photoRequiredToday ? "FOTO obligatorie" : "FOTO opțională"}</strong> ({mode === "strict" ? "Strict" : "Random 80/20"})
                    </span>
                    <button
                        type="button"
                        onClick={toggleTodayRequirement}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "white",
                            cursor: "pointer",
                            fontSize: 12,
                        }}
                        title="Comută cerința de foto pentru azi"
                    >
                        Comută azi
                    </button>
                </div>

                <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                    Completezi temperaturile manual (3 citiri/zi). Dovada foto e marcată mai jos în funcție de planul lunar 80/20 sau modul Strict.
                </p>

                {/* Eroare */}
                {errors.length > 0 && (
                    <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.25)" }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Corectează:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {errors.map((e, i) => (
                                <li key={i} style={{ fontSize: 13 }}>
                                    {e}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recepție marfă */}
                <Section title="Temperaturi recepție (opțional)">
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, alignItems: "center" }}>
                        <label>Temperatură (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="ex: 4.0"
                            value={receivingTemp}
                            onChange={(e) => setReceivingTemp(e.target.value)}
                            style={inputBox}
                        />
                    </div>
                </Section>

                {/* Frigider */}
                <Section
                    title="Frigider — 3 citiri/zi (critic)"
                    desc={photoRequiredToday ? "Azi: valoare + fotografie obligatoriu." : "Azi: fotografia este opțională."}
                >
                    {SHIFTS.map((k) => {
                        const need = photoRequiredToday && !!fridge[k].value;
                        return (
                            <div key={k} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: 10, alignItems: "center", marginBottom: 8 }}>
                                <label style={{ textTransform: "capitalize" }}>{SHIFT_LABEL[k]}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="°C"
                                    value={fridge[k].value || ""}
                                    onChange={(e) => setFridge((p) => ({ ...p, [k]: { ...p[k], value: e.target.value } }))}
                                    style={inputBox}
                                />
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFridge((p) => ({ ...p, [k]: { ...p[k], photo: e.target.files?.[0] || null } }))}
                                        style={{ ...inputBox, padding: 6, border: fileBorder(need, fridge[k].photo) }}
                                    />
                                    <div style={{ fontSize: 11, marginTop: 4, color: need && !fridge[k].photo ? "#B00020" : "rgba(0,0,0,0.55)" }}>
                                        {need ? (fridge[k].photo ? "foto atașată" : "foto obligatorie") : "foto opțională"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {escalation.fridge && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "rgba(255,165,0,0.12)", border: "1px dashed rgba(255,165,0,0.6)", fontSize: 13 }}>
                            Escaladare: lipsesc două citiri consecutive la <strong>Frigider</strong>.
                        </div>
                    )}
                </Section>

                {/* Congelator */}
                <Section
                    title="Congelator — 3 citiri/zi (critic)"
                    desc={photoRequiredToday ? "Azi: valoare + fotografie obligatoriu." : "Azi: fotografia este opțională."}
                >
                    {SHIFTS.map((k) => {
                        const need = photoRequiredToday && !!freezer[k].value;
                        return (
                            <div key={k} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: 10, alignItems: "center", marginBottom: 8 }}>
                                <label style={{ textTransform: "capitalize" }}>{SHIFT_LABEL[k]}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="°C"
                                    value={freezer[k].value || ""}
                                    onChange={(e) => setFreezer((p) => ({ ...p, [k]: { ...p[k], value: e.target.value } }))}
                                    style={inputBox}
                                />
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFreezer((p) => ({ ...p, [k]: { ...p[k], photo: e.target.files?.[0] || null } }))}
                                        style={{ ...inputBox, padding: 6, border: fileBorder(need, freezer[k].photo) }}
                                    />
                                    <div style={{ fontSize: 11, marginTop: 4, color: need && !freezer[k].photo ? "#B00020" : "rgba(0,0,0,0.55)" }}>
                                        {need ? (freezer[k].photo ? "foto atașată" : "foto obligatorie") : "foto opțională"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {escalation.freezer && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "rgba(255,165,0,0.12)", border: "1px dashed rgba(255,165,0,0.6)", fontSize: 13 }}>
                            Escaladare: lipsesc două citiri consecutive la <strong>Congelator</strong>.
                        </div>
                    )}
                </Section>

                {/* Probe aliment (critic după plan) */}
                <Section title="Probe aliment (critic — conform plan)">
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, alignItems: "center" }}>
                        <label>Fotografie probe</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFoodSamplesPhoto(e.target.files?.[0] || null)}
                            style={{ ...inputBox, padding: 6, border: fileBorder(photoRequiredToday, foodSamplesPhoto) }}
                        />
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                        Azi: <strong>{photoRequiredToday ? "Obligatoriu" : "Opțional"}</strong>
                    </div>
                </Section>

                {/* Igienizare & Alergeni (non-critice) */}
                <Section title="Igienizare (non-critic)">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                            <input type="checkbox" checked={sanitationDone} onChange={(e) => setSanitationDone(e.target.checked)} />
                            Efectuată
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSanitationPhoto(e.target.files?.[0] || null)}
                            style={{ ...inputBox, padding: 6 }}
                        />
                    </div>
                </Section>

                <Section title="Alergeni (non-critic)">
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                        <input type="checkbox" checked={allergensDisplayed} onChange={(e) => setAllergensDisplayed(e.target.checked)} />
                        Afișaj alergeni actualizat
                    </label>
                </Section>

                {/* Footer formular */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                    <div style={{ fontSize: 14 }}>Scor curent: <strong>{score}%</strong></div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link href="/administratie/bucatarie" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", textDecoration: "none", fontSize: 14 }}>
                            Anulează
                        </Link>
                        <button type="submit" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, cursor: "pointer" }}>
                            Închide chestionar
                        </button>
                    </div>
                </div>
            </form>

            {/* Dreapta: plan & reguli */}
            <aside
                style={{
                    position: "sticky",
                    top: 16,
                    alignSelf: "start",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    height: "fit-content",
                }}
            >
                {/* Plan dovezi */}
                <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, background: "rgba(255,255,255,0.65)", padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Plan dovezi (luna curentă)</div>
                    <CalendarDots />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            Mod foto:
                            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ ...inputBox, width: 160, padding: "6px 10px" }}>
                                <option value="random">Random 80/20</option>
                                <option value="strict">Strict (zilnic)</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                const total = Math.min(30, totalMonthDays);
                                const plan = generatePhotoPlan(total, 0.2);
                                setPhotoDays(plan);
                                savePlan(plan);
                            }}
                            style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer", fontSize: 13 }}
                            title="Regenerează planul (80/20)"
                        >
                            Regenerează
                        </button>
                        <button
                            type="button"
                            onClick={toggleTodayRequirement}
                            style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer", fontSize: 13 }}
                            title="Comută cerința pentru azi"
                        >
                            Comută azi
                        </button>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                        Zile umbrite: dovadă foto obligatorie. Zile în plan: {Math.min(30, totalMonthDays)} (≈{Math.max(1, Math.round(Math.min(30, totalMonthDays) * 0.2))} cu foto).
                    </div>
                </div>

                {/* Reguli */}
                <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, background: "rgba(255,255,255,0.65)", padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Reguli</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                        <li>Temperaturi: 3 citiri/zi pentru frigider și congelator.</li>
                        <li>Dovezi foto: conform plan 80/20 sau zilnic în modul Strict.</li>
                        <li>Escaladare dacă lipsesc 2 citiri consecutive.</li>
                    </ul>
                </div>
            </aside>
        </div>
    );
}
