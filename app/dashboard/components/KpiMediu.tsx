'use client';

import React, { useEffect, useState } from 'react';
import { getMediuKpi, MediuKPI } from '@/lib/mediu-kpi';

const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    padding: 16,
};

export default function KpiMediu() {
    const [kpi, setKpi] = useState<MediuKPI | null>(null);

    useEffect(() => {
        // rulează pe client deoarece citește din localStorage
        setKpi(getMediuKpi());
    }, []);

    if (!kpi) return null;

    return (
        <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                {/* Col stânga: KPI mare */}
                <div>
                    <div style={{ fontSize: 12, opacity: .8, marginBottom: 6 }}>Deșeuri — luna curentă</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{kpi.totalKgMonth} kg</div>
                    <div style={{ marginTop: 10, fontSize: 12, opacity: .8 }}>
                        <span style={{ fontWeight: 600 }}>Contracte/autorizații cu expirare ≤30 zile:</span> {kpi.contractsExpiringIn30}
                    </div>
                </div>

                {/* Col dreapta: Top 3 secții */}
                <div>
                    <div style={{ fontSize: 12, opacity: .8, marginBottom: 6 }}>Top 3 secții (kg)</div>
                    {kpi.top3Sectii.length === 0 ? (
                        <div style={{ opacity: .7 }}>Nu există date.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: 6 }}>
                            {kpi.top3Sectii.map((r, i) => (
                                <div key={r.sectie}
                                    style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, alignItems: 'center' }}>
                                    <div>{i + 1}. {r.sectie}</div>
                                    <div style={{ textAlign: 'right' }}><b>{r.kg}</b> kg</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
