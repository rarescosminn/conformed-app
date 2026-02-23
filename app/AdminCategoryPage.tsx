// components/AdminCategoryLayout.tsx
import Link from "next/link";
import type { ReactNode } from "react";

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
    todoTodayCount?: number;
    todoLateCount?: number;

    /** Buton „Înapoi” în titlu (opțional) */
    showBack?: boolean;

    /** Card nou sub „Chestionare” — Taskuri deschise */
    openTasksCount?: number;
    openTasksHref?: string;
};

export default function AdminCategoryLayout({
    title,
    intro,
    children,
    links,
    todoTodayCount = 0,
    todoLateCount = 0,
    showBack = false,
    openTasksCount,
    openTasksHref,
}: Props) {
    const cardStyle: React.CSSProperties = {
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        background: "rgba(255,255,255,0.65)",
        padding: 16,
        boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    };

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
                        <div>• Azi: <strong>{todoTodayCount}</strong></div>
                        <div>• Întârziate: <strong>{todoLateCount}</strong></div>
                    </div>
                    <Link
                        href={links?.addTask || "#"}
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

                {/* Chestionare */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Chestionare</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
                        Ultimul scor: <strong>—</strong>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link
                            href={links?.questionnaire || "#"}
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
                            href={links?.history || "#"}
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

                {/* ✅ Card nou: Taskuri deschise */}
                {typeof openTasksCount === "number" && openTasksHref ? (
                    <Link
                        href={openTasksHref}
                        style={{ textDecoration: "none", color: "inherit" }}
                        title="Vezi lista taskurilor deschise (grupată pe categorii)"
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
                            <div style={{ fontSize: 13, color: "#0f172a" }}>
                                Aveți <strong>{openTasksCount}</strong> taskuri deschise.
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                                Click pentru lista grupată pe categorii.
                            </div>
                        </div>
                    </Link>
                ) : null}
            </aside>
        </div>
    );
}
