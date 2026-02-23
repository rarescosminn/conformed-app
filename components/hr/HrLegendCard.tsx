// components/hr/HrLegendCard.tsx

type Legend = {
    medici: string[];
    asistenti: string[];
    infirmieri: string[];
    note?: string;
};

const LEGENDS: Record<string, Legend> = {
    UPU: {
        medici: ["1 medic / 20 prezentări / tură"],
        asistenti: ["1 asistent / 20 prezentări / tură"],
        infirmieri: ["1 infirmier / 30 prezentări / tură"],
        note: "Se ajustează după media prezentărilor/24h și program 24/7.",
    },
    ATI: {
        medici: ["1 medic la max. 2 paturi"],
        asistenti: ["1 asistent / 1 pat (24/7)"],
        infirmieri: ["1 infirmier / 5–6 pacienți"],
    },
    Neonatologie: {
        medici: ["1 medic / 10–12 paturi"],
        asistenti: ["1 asistent / 2 paturi"],
        infirmieri: ["1 infirmier / 5–6 pacienți"],
    },
    GENERIC: {
        medici: ["1 medic / 15–20 paturi"],
        asistenti: ["1 asistent / 4–6 paturi"],
        infirmieri: ["1 infirmier / 15–20 pacienți"],
    },
};

export default function HrLegendCard({ domain = "GENERIC" }: { domain?: string }) {
    const l = LEGENDS[domain] ?? LEGENDS.GENERIC;

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
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Bază de calcul pentru necesar personal
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                Conform Ordin MS 1224/2010 (și actualizări). Normele diferă pe specialitate.
            </div>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                <LegendCol title="Medici" items={l.medici} />
                <LegendCol title="Asistenți" items={l.asistenti} />
                <LegendCol title="Infirmieri" items={l.infirmieri} />
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
                * Valorile se ajustează după mărimea spitalului, gradul de ocupare și istoric de prezentări (UPU).
                {l.note ? ` ${l.note}` : ""}
            </div>
        </div>
    );
}

function LegendCol({ title, items }: { title: string; items: string[] }) {
    return (
        <div style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.map((s, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
            </ul>
        </div>
    );
}
