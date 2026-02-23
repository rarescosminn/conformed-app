'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import type { Domeniu } from '@/types/domains';
import { CARD_HEIGHT } from '@/config/uiConfig'; // 👈 nou

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = { domains?: Domeniu[]; height?: number | string }; // 👈 nou

const clean = (s: string) => s.replace(/&/g, 'și').trim();

const BANDS = [
    { id: 'lt60', label: '< 60%', test: (v: number) => v < 60, color: '#EF4444' },
    { id: '60_69', label: '60–69%', test: (v: number) => v >= 60 && v < 70, color: '#F97316' },
    { id: '70_84', label: '70–84%', test: (v: number) => v >= 70 && v < 85, color: '#EAB308' },
    { id: 'ge85', label: '≥85%', test: (v: number) => v >= 85, color: '#22C55E' },
];

export default function BarChart({ domains, height = CARD_HEIGHT }: Props) { // 👈 nou
    const [colorByRisk, setColorByRisk] = useState(false);
    const [activeBands, setActiveBands] = useState<string[]>(BANDS.map(b => b.id));
    const [clickedInfo, setClickedInfo] = useState<{ label: string; domain: string; value: number } | null>(null);

    // 🔎 căutare live cu debounce
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 200);
        return () => clearTimeout(t);
    }, [searchInput]);

    const chartRef = useRef<any>(null);

    // fallback minim
    const fallback = [
        { label: 'Anatomie patologică', domain: 'Domeniul Medical', value: 89 },
        { label: 'ATI - Anestezie și Terapie Intensivă', domain: 'Domeniul Medical', value: 68 },
        { label: 'Boli infecțioase', domain: 'Domeniul Medical', value: 74 },
    ];

    // perechi (label, value, domain)
    const pairsAll = useMemo(() => {
        if (!domains?.length) return fallback;
        return domains.flatMap(d =>
            (d.subdomenii ?? []).map(sd => ({
                label: clean(sd.nume),
                value: sd.score ?? 0,
                domain: clean(d.nume),
            })),
        );
    }, [domains]);

    // sortare
    const sortedAll = useMemo(
        () => [...pairsAll].sort((a, b) => a.label.localeCompare(b.label, 'ro')),
        [pairsAll]
    );

    // filtrare pe benzi + căutare (live)
    const filtered = useMemo(() => {
        const tests = BANDS.filter(b => activeBands.includes(b.id)).map(b => b.test);
        const s = search.trim().toLowerCase();
        return sortedAll.filter(p => {
            const bandOk = tests.length === BANDS.length ? true : tests.some(fn => fn(p.value));
            const searchOk = !s || (p.label.toLowerCase().includes(s) || p.domain.toLowerCase().includes(s));
            return bandOk && searchOk;
        });
    }, [sortedAll, activeBands, search]);

    const labels = filtered.map(x => x.label);
    const values = filtered.map(x => x.value);
    const domainsOfLabels = filtered.map(x => x.domain);

    const riskColor = (v: number) => (v < 60 ? '#EF4444' : v < 70 ? '#F97316' : v < 85 ? '#EAB308' : '#22C55E');

    // înălțime „naturală” (scroll în card)
    const chartHeight = labels.length * 28 + 100;

    // dataset + opțiuni
    const data = {
        labels,
        datasets: [
            {
                label: 'Conformare %',
                data: values,
                backgroundColor: colorByRisk ? values.map(v => riskColor(v)) : '#007AAD',
                borderWidth: 0,
            },
        ],
    };

    const options: any = {
        indexAxis: 'y',
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
                        const idx = ctx.dataIndex;
                        const dom = domainsOfLabels[idx] || '';
                        const v = ctx.raw ?? '';
                        return [`Domeniu: ${dom}`, `Conformare %: ${v}`];
                    },
                },
            },
        },
        scales: {
            y: { ticks: { autoSkip: false, font: { size: 10 } } },
            x: { beginAtZero: true, suggestedMax: 100, ticks: { stepSize: 10 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        },
        onClick: (_: any, elements: any[]) => {
            if (!elements?.length) return setClickedInfo(null);
            const i = elements[0].index;
            setClickedInfo({ label: labels[i], domain: domainsOfLabels[i], value: values[i] });
        },
    };

    // UI helpers
    const toggleBand = (id: string) =>
        setActiveBands(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    const selectAll = () => setActiveBands(BANDS.map(b => b.id));
    const clearAll = () => setActiveBands([]);

    // forțează re-mount când comuți colorarea (fix pentru revenire la culoarea unică)
    const chartKey = colorByRisk ? 'risk' : 'plain';

    return (
        <div className="card" style={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingBottom: 0 }}>
                <h3 className="h1" style={{ margin: 0, fontSize: 26 }}>Conformare pe Subdomenii</h3>

                <label style={{ fontSize: 14, color: '#374151', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    <input
                        type="checkbox"
                        checked={colorByRisk}
                        onChange={(e) => setColorByRisk(e.target.checked)}
                        style={{ marginRight: 6 }}
                    />
                    Colorare după risc
                </label>
            </div>

            {/* Filtre, căutare live și count */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '6px 8px 0' }}>
                {BANDS.map(b => (
                    <label key={b.id} style={{ fontSize: 12, userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={activeBands.includes(b.id)}
                            onChange={() => toggleBand(b.id)}
                            style={{ marginRight: 6 }}
                        />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 12, height: 12, display: 'inline-block', background: b.color, borderRadius: 2 }} />
                            {b.label}
                        </span>
                    </label>
                ))}

                {/* 🔎 căutare live (debounced) */}
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Caută subdomeniu sau domeniu..."
                    style={{ marginLeft: 8, padding: '6px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 220 }}
                />

                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280' }}>
                    Afișez <strong>{labels.length}</strong> din {sortedAll.length}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={selectAll} style={{ fontSize: 12, padding: '2px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
                        Selectează toate
                    </button>
                    <button onClick={clearAll} style={{ fontSize: 12, padding: '2px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
                        Golește
                    </button>
                </div>
            </div>

            {/* zona scrollabilă */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ height: chartHeight, minWidth: '100%', padding: 8 }}>
                    <Bar key={chartKey} ref={chartRef} data={data} options={options} />
                </div>
            </div>

            {/* banner click info */}
            {clickedInfo && (
                <div style={{ padding: '6px 8px', fontSize: 12, color: '#111827', background: '#F3F4F6', borderTop: '1px solid #E5E7EB' }}>
                    <strong>{clickedInfo.label}</strong> — Domeniu: <strong>{clickedInfo.domain}</strong> • Conformare: <strong>{clickedInfo.value}%</strong>
                </div>
            )}
        </div>
    );
}
