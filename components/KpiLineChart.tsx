"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
    ChartOptions,
    ChartData,
    ChartDataset,
} from "chart.js";
import {
    useIndicatoriStore,
    isPointsSerie,
    type SeriesMap,
} from "@/store/indicatori";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function fmtNumber(n: number) {
    return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n);
}

const MONTH_LABELS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"] as const;

export default function KpiLineChart() {
    const { series, activeYears } = useIndicatoriStore();

    const datasets = useMemo<ChartDataset<"line", number[]>[]>(() => {
        const labels = MONTH_LABELS as unknown as string[];
        return Object.entries(series as SeriesMap).map(([key, s]) => {
            const data: number[] = isPointsSerie(s)
                ? labels.map((_, i) =>
                    s.points
                        .filter((p) => (activeYears.length ? activeYears.includes(p.year) : true))
                        .filter((p) => p.month === i + 1)
                        .reduce((acc: number, p) => acc + p.value, 0)
                )
                : (("values" in s && Array.isArray((s as any).values)) ? (s as any).values as number[] : []);

            return {
                label: (s as any).label || key,
                data,
                tension: 0.25,
                pointRadius: 3,
                pointHoverRadius: 4,
                fill: false,
            };
        });
    }, [series, activeYears]);

    const data: ChartData<"line", number[], string> = {
        labels: MONTH_LABELS as unknown as string[],
        datasets,
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top", labels: { boxWidth: 16 } },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${fmtNumber(Number(ctx.raw))}`,
                },
            },
        },
        scales: {
            x: {
                type: "category",
                grid: { display: false },
                // ascunde linia axei X (în v4 se face pe `border`)
                border: { display: false },
            },
            y: {
                type: "linear",
                // înlocuiește `grid: { drawBorder: false }` cu:
                border: { display: false },
                ticks: {
                    callback: (v) => fmtNumber(Number(v)),
                },
            },
        },
    };

    return (
        <div className="rounded-xl border border-zinc-200 bg-white" style={{ minHeight: 160, maxHeight: 220, padding: 8 }}>
            <Line data={data} options={{ ...options, maintainAspectRatio: true }} />
        </div>
    );
}
