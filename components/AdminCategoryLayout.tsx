// components/AdminCategoryLayout.tsx
'use client';
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Scope } from "@/lib/context";
import { countOpenTasks, countTodoLate, countTodoToday } from "@/lib/tasks/store";
import { addSuggestion } from "@/lib/suggestions/store";

type Links = {
    addTask?: string;
    questionnaire?: string;
    history?: string;
};

type Props = {
    title: string;
    intro?: string;
    children?: ReactNode;
    links?: Links;

    /** dacă NU vrei să calculez automat pe scope */
    todoTodayCount?: number;
    todoLateCount?: number;

    /** Buton „Înapoi” în titlu (opțional) */
    showBack?: boolean;

    /** Context de filtrare pe subdomeniu (administratie/retelistica etc.) */
    scope?: Scope;

    /** Card „Taskuri deschise” (auto-calc dacă există scope) */
    openTasksCount?: number;
    openTasksHref?: string;

    /** Arătăm sau nu „Chestionare” în sidebar (default: true) */
    showQuestionnaires?: boolean;

    /** Arătăm cardul de Sugestii (default: true) */
    showSuggestions?: boolean;
};

export default function AdminCategoryLayout({
    title,
    intro,
    children,
    links,
    todoTodayCount,
    todoLateCount,
    showBack = false,
    scope,
    openTasksCount,
    openTasksHref,
    showQuestionnaires = true,
    showSuggestions = true,
}: Props) {
    const cardStyle: React.CSSProperties = {
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        background: "rgba(255,255,255,0.65)",
        padding: 16,
        boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    };

    // ===== Auto-count pe scope (fallback la 0 dacă nu există date) =====
    const autoTodoToday = useMemo(() => (scope ? countTodoToday(scope) : 0), [scope]);
    const autoTodoLate = useMemo(() => (scope ? countTodoLate(scope) : 0), [scope]);
    const autoOpenTasks = useMemo(() => (scope ? countOpenTasks(scope) : 0), [scope]);

    const computedTodoToday = todoTodayCount ?? autoTodoToday;
    const computedTodoLate = todoLateCount ?? autoTodoLate;
    const computedOpenTasks = openTasksCount ?? autoOpenTasks;

    const computedOpenTasksHref =
        openTasksHref ??
        (scope
            ? `/administratie/taskuri?area=${encodeURIComponent(scope.area)}&subdomain=${encodeURIComponent(scope.subdomain)}&status=open`
            : "/administratie/taskuri?status=open");

    const addTaskHref =
        links?.addTask ??
        (scope
            ? `/administratie/todo/new?area=${encodeURIComponent(scope.area)}&subdomain=${encodeURIComponent(scope.subdomain)}`
            : `/administratie/todo/new`);

    const questionnaireHref =
        links?.questionnaire ??
        (scope
            ? `/administratie/chestionare?area=${encodeURIComponent(scope.area)}&subdomain=${encodeURIComponent(scope.subdomain)}`
            : `/administratie/chestionare`);

    const historyHref =
        links?.history ??
        (scope
            ? `/administratie/chestionare?area=${encodeURIComponent(scope.area)}&subdomain=${encodeURIComponent(scope.subdomain)}&view=istoric`
            : `/administratie/chestionare?view=istoric`);

    // ====== Sugestii: modal local ======
    const [sugOpen, setSugOpen] = useState(false);
    const [msg, setMsg] = useState("");
    const [isAnon, setIsAnon] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [gdpr, setGdpr] = useState(false);
    const [sentOk, setSentOk] = useState<null | string>(null);

    const needGDPR = !isAnon && (!!name.trim() || !!email.trim());

    function resetSuggestionForm() {
        setMsg("");
        setIsAnon(true);
        setName("");
        setEmail("");
        setGdpr(false);
        setSentOk(null);
    }

    function submitSuggestion(e: React.FormEvent) {
        e.preventDefault();
        if (!scope) {
            setSentOk("Nu am context de subdomeniu.");
            return;
        }
        if (!msg.trim()) {
            setSentOk("Scrie mesajul înainte de a trimite.");
            return;
        }
        if (needGDPR && !gdpr) {
            setSentOk("Bifează acordul GDPR dacă trimiți date personale.");
            return;
        }
        addSuggestion({
            area: scope.area,
            subdomain: scope.subdomain,
            message: msg.trim(),
            isAnonymous: isAnon,
            name: isAnon ? undefined : name.trim() || undefined,
            email: isAnon ? undefined : email.trim() || undefined,
            gdprConsent: needGDPR ? gdpr : false,
        });
        setSentOk("Mulțumim! Sugestia a fost trimisă.");
        setTimeout(() => {
            setSugOpen(false);
            resetSuggestionForm();
        }, 900);
    }

    return (
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {showBack && (
                        <Link
                            href="/administratie"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 10px",
                                borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.12)",
                                textDecoration: "none",
                                fontSize: 13,
                            }}
                            title="Înapoi la Administrație"
                        >
                            ← Înapoi
                        </Link>
                    )}
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
                </div>

                {intro && <p style={{ margin: "6px 0 18px", opacity: 0.8 }}>{intro}</p>}
                <div>{children}</div>
            </div>

            <aside
                style={{
                    position: "sticky",
                    top: 16,
                    alignSelf: "start",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                }}
            >
                {/* To-Do */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>To-Do</div>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                        <div>• Azi: <strong>{computedTodoToday}</strong></div>
                        <div>• Întârziate: <strong>{computedTodoLate}</strong></div>
                    </div>
                    <Link
                        href={addTaskHref}
                        style={{
                            display: "inline-flex",
                            marginTop: 10,
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.12)",
                            textDecoration: "none",
                            fontSize: 13,
                        }}
                    >
                        + Adaugă task
                    </Link>
                </div>

                {/* Chestionare (opțional) */}
                {showQuestionnaires && (
                    <div style={cardStyle}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Chestionare</div>
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
                            Ultimul scor: <strong>—</strong>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Link
                                href={questionnaireHref}
                                style={{
                                    display: "inline-flex",
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    textDecoration: "none",
                                    fontSize: 13,
                                }}
                            >
                                Completează
                            </Link>
                            <Link
                                href={historyHref}
                                style={{
                                    display: "inline-flex",
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    textDecoration: "none",
                                    fontSize: 13,
                                }}
                            >
                                Istoric
                            </Link>
                        </div>
                    </div>
                )}

                {/* Taskuri deschise — filtrate pe scope */}
                <Link
                    href={computedOpenTasksHref}
                    style={{ textDecoration: "none", color: "inherit" }}
                    title="Vezi lista taskurilor deschise (filtrate pe subdomeniu)"
                >
                    <div
                        style={{
                            ...cardStyle,
                            cursor: "pointer",
                            border: "1px solid #bfdbfe",
                            background: "linear-gradient(180deg,#eff6ff,#f8fbff)",
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 6, color: "#1e3a8a" }}>
                            Taskuri deschise
                        </div>

                        {computedOpenTasks > 0 ? (
                            <div style={{ fontSize: 13, color: "#0f172a" }}>
                                Aveți <strong>{computedOpenTasks}</strong> taskuri deschise.
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: "#0f172a" }}>
                                <em>Nu aveți niciun task setat.</em>
                            </div>
                        )}

                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                            Click pentru lista filtrată pe subdomeniu.
                        </div>
                    </div>
                </Link>

                {/* Sugestii (nou) */}
                {showSuggestions && (
                    <div style={cardStyle}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Sugestii</div>
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
                            Trimite o propunere de îmbunătățire (poți alege anonim).
                        </div>
                        <button
                            type="button"
                            onClick={() => setSugOpen(true)}
                            style={{
                                display: "inline-flex",
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 13,
                            }}
                        >
                            Trimite sugestie
                        </button>
                    </div>
                )}
            </aside>

            {/* Modal Sugestii */}
            {showSuggestions && sugOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }}>
                    <div style={{ width: 'min(720px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                            <b style={{ color: '#1e3a8a' }}>Sugestie {scope ? `— ${scope.subdomain}` : ''}</b>
                            <button onClick={() => { setSugOpen(false); resetSuggestionForm(); }} style={{ marginLeft: 'auto', border: '1px solid #bfdbfe', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <form onSubmit={submitSuggestion} style={{ padding: 16, display: 'grid', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Mesaj</div>
                                <textarea
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                    required
                                    placeholder="Scrie propunerea ta…"
                                    style={{ width: '100%', minHeight: 120, borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', padding: 10, background: '#fff' }}
                                />
                            </div>

                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} />
                                Trimit anonim
                            </label>

                            {!isAnon && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <input
                                        placeholder="Nume și prenume (opțional)"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    />
                                    <input
                                        placeholder="Email (opțional)"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    />
                                </div>
                            )}

                            {!isAnon && (name.trim() || email.trim()) && (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, background: '#f8fafc', padding: 8, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                    <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
                                    Îmi exprim acordul pentru prelucrarea datelor personale în scopul soluționării sugestiei. (GDPR)
                                </label>
                            )}

                            {sentOk && <div style={{ fontSize: 13, color: sentOk.startsWith('Mulțumim') ? '#166534' : '#991b1b' }}>{sentOk}</div>}

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button type="button" onClick={() => { setSugOpen(false); resetSuggestionForm(); }} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Anulează</button>
                                <button type="submit" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Trimite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
