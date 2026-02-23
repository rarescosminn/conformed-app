// app/administratie/taskuri/page.tsx
import Link from "next/link";

export default function Page() {
    return (
        <div style={{ padding: 20, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link href="/administratie" style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 10, textDecoration: "none" }}>
                    ← Înapoi
                </Link>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Taskuri (general)</h1>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
                <div style={{ opacity: 0.8 }}>În curând vei putea vedea toate taskurile deschise la nivel de Administrație. Momentan, nu există intrări.</div>
            </div>
        </div>
    );
}
