// components/hr/HrCards.tsx
type Summary = {
    activFTE: number;
    idealLegal: number;
    idealAjustat: number;
    deficit: number;
    acoperireSondajPct: number;
};

export default function HrCards({ summary }: { summary: Summary }) {
    const items = [
        { label: "Personal activ (FTE)", value: summary.activFTE },
        { label: "Necesar legal", value: summary.idealLegal },
        { label: "Necesar ajustat", value: summary.idealAjustat },
        { label: "Deficit", value: summary.deficit },
        { label: "Acoperire sondaj", value: `${summary.acoperireSondajPct}%` },
    ];

    return (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {items.map(it => (
                <div key={it.label}
                    style={{
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 12,
                        padding: 12
                    }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{it.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{it.value}</div>
                </div>
            ))}
        </div>
    );
}
