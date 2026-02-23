// components/hr/HrTableSectii.tsx

type Row = {
    sectie: string;
    rol: "Șef secție" | "Medici" | "Asistenți" | "Infirmieri";
    idealLegal: number;
    idealAjustat: number;
    activREGES_FTE: number;
    respondenți: number;
    acoperirePct: number; // respondenți / activi * 100
    deficit: number;      // idealAjustat - activREGES_FTE
};

export default function HrTableSectii({ rows }: { rows: Row[] }) {
    return (
        <div
            style={{
                marginTop: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                overflowX: "auto",
            }}
        >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead style={{ background: "#f8fafc", color: "#475569" }}>
                    <tr>
                        <Th>Secție</Th>
                        <Th>Rol</Th>
                        <Th align="right">Ideal (MS)</Th>
                        <Th align="right">Ajustat</Th>
                        <Th align="right">Activ (REGES) FTE</Th>
                        <Th align="right">Respondenți</Th>
                        <Th align="right">% acoperire</Th>
                        <Th align="right">Deficit</Th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            <Td>{r.sectie}</Td>
                            <Td>{r.rol}</Td>
                            <Td align="right">{r.idealLegal}</Td>
                            <Td align="right">{r.idealAjustat}</Td>
                            <Td align="right">{r.activREGES_FTE}</Td>
                            <Td align="right">{r.respondenți}</Td>
                            <Td align="right">{r.acoperirePct.toFixed(0)}%</Td>
                            <Td
                                align="right"
                                style={{
                                    fontWeight: 700,
                                    color: r.deficit > 0 ? "#dc2626" : r.deficit < 0 ? "#059669" : "#334155",
                                }}
                            >
                                {r.deficit}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
    style,
}: {
    children: React.ReactNode;
    align?: "left" | "right" | "center";
    style?: React.CSSProperties;
}) {
    return (
        <td style={{ textAlign: align, padding: "10px 12px", ...(style ?? {}) }}>
            {children}
        </td>
    );
}
