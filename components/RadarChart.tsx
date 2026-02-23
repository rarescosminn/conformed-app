'use client';
import { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import type { Domeniu } from '@/types/domains';
import { CARD_HEIGHT } from '@/config/uiConfig'; // 👈 nou

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Props = { domains?: Domeniu[]; height?: number | string }; // 👈 nou

const clean = (s: string) => s.replace(/&/g, 'și').trim();

export default function RadarChart({ domains, height = CARD_HEIGHT }: Props) { // 👈 nou
    // statistici folosite în tooltip
    const statsByLabel = useMemo(() => {
        if (!domains?.length) return {} as Record<string, { avg: number; min: number; max: number; n: number }>;
        const out: Record<string, { avg: number; min: number; max: number; n: number }> = {};
        for (const d of domains) {
            const label = clean(d.nume);
            const vals = (d.subdomenii ?? []).map(sd => sd.score ?? 0);
            const n = vals.length || 1;
            const sum = vals.reduce((s, v) => s + v, 0);
            const avg = Math.round(sum / n);
            const min = vals.length ? Math.min(...vals) : 0;
            const max = vals.length ? Math.max(...vals) : 0;
            out[label] = { avg, min, max, n };
        }
        return out;
    }, [domains]);

    // perechi (label, value = media) + curățare „&”
    const pairs = useMemo(() => {
        if (!domains?.length) return [{ label: 'General', value: 78 }];
        return domains.map(d => {
            const label = clean(d.nume);
            const vals = (d.subdomenii ?? []).map(sd => sd.score ?? 0);
            const n = vals.length || 1;
            const avg = Math.round(vals.reduce((s, v) => s + v, 0) / n);
            return { label, value: avg };
        });
    }, [domains]);

    // dacă avem < 3 puncte, replicăm pentru a păstra o figură vizibilă
    const padded = useMemo(() => {
        if (pairs.length >= 3) return pairs;
        if (pairs.length === 2) return [pairs[0], pairs[1], pairs[0]];
        return [pairs[0], pairs[0], pairs[0]];
    }, [pairs]);

    const data = {
        labels: padded.map(p => p.label),
        datasets: [
            {
                label: 'Conformare medie %',
                data: padded.map(p => p.value),
                backgroundColor: 'rgba(0, 122, 173, 0.2)',
                borderColor: '#007AAD',
                borderWidth: 2,
                pointRadius: 3,
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 8 },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                callbacks: {
                    title: (items: any[]) => items?.[0]?.label ?? '',
                    label: (ctx: any) => {
                        const label = ctx?.label ?? '';
                        const v = ctx?.raw ?? '';
                        const st = (statsByLabel as any)[label];
                        if (!st) return ` Media: ${v}%`;
                        return [` Media: ${st.avg}%`, ` Minim: ${st.min}%`, ` Maxim: ${st.max}%`, ` Subdomenii: ${st.n}`];
                    },
                },
            },
        },
        scales: {
            r: {
                angleLines: { display: false },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: { stepSize: 20 },
                grid: { color: 'rgba(0,0,0,0.06)' },
                pointLabels: { font: { size: 12 } },
            },
        },
    };

    return (
        <div className="card" style={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingBottom: 0 }}>
                <h3 className="h1" style={{ margin: 0 }}>Conformare medie pe domenii</h3>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                <div style={{ width: '100%', maxWidth: 700, height: '100%' }}>
                    <Radar data={data} options={options} />
                </div>
            </div>
        </div>
    );
}
