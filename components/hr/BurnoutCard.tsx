// /components/hr/BurnoutCard.tsx
'use client';

import React, { useMemo, useState } from 'react';

type Band = 'verde' | 'galben' | 'portocaliu' | 'rosu';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const round1 = (n: number) => Math.round(n * 10) / 10;

function bandColor(band: Band) {
    switch (band) {
        case 'verde': return 'bg-green-600';
        case 'galben': return 'bg-yellow-500';
        case 'portocaliu': return 'bg-orange-600';
        case 'rosu': return 'bg-red-600';
    }
}

export default function BurnoutCard() {
    // ======= Date „ore & ritm” – introducere manuală pentru demo =======
    const [weeks, setWeeks] = useState(8);
    const [weeklyHoursAvg, setWeeklyHoursAvg] = useState(48);
    const [weeklyHoursP95, setWeeklyHoursP95] = useState(56);
    const [longDaysPct, setLongDaysPct] = useState(20);
    const [consecutiveDaysMax, setConsecutiveDaysMax] = useState(6);
    const [lowRecoveryNightsPct, setLowRecoveryNightsPct] = useState(25);
    const [weekendWorkPct, setWeekendWorkPct] = useState(15);
    const [scheduleVariability, setScheduleVariability] = useState(1.5);
    const [nightShiftsCount, setNightShiftsCount] = useState(3);
    const [ptoDays, setPtoDays] = useState(6);

    // ======= Chestionar 10 itemi 0–10 (0=bine, 10=rău) =======
    const [answers, setAnswers] = useState<number[]>(Array.from({ length: 10 }, () => 0));

    // Scor chestionar 0–100
    const surveyScore = useMemo(() => {
        const mean = answers.reduce((a, b) => a + b, 0) / answers.length;
        return Math.round(clamp01(mean / 10) * 100);
    }, [answers]);

    // Scor obiectiv 0–100 din „ore & ritm”
    const objectiveScore = useMemo(() => {
        const h = weeklyHoursP95 || weeklyHoursAvg;
        const overload =
            h <= 35 ? 5 * (h / 35) :
                h <= 44 ? 50 * (h - 35) / 9 :
                    h <= 50 ? 50 + 30 * (h - 44) / 6 :
                        h <= 60 ? 80 + 20 * (h - 50) / 10 : 100;

        const recRaw =
            (lowRecoveryNightsPct) +
            (longDaysPct * 1.2) +
            (consecutiveDaysMax > 6 ? 20 : 0) +
            (ptoDays < Math.ceil(weeks) ? 20 : 0);
        const recovery = Math.min(100, recRaw) / 2.2;

        const circadian = clamp01(scheduleVariability / 5) * 100;
        const irregularity = Math.min(100, weekendWorkPct * 1.2 + longDaysPct * 0.5);
        const nights = clamp01(nightShiftsCount / (weeks * 2)) * 100;

        const score =
            overload * 0.35 +
            recovery * 0.25 +
            circadian * 0.15 +
            irregularity * 0.10 +
            nights * 0.15;

        return Math.round(score);
    }, [
        weeklyHoursAvg, weeklyHoursP95, longDaysPct, consecutiveDaysMax,
        lowRecoveryNightsPct, weekendWorkPct, scheduleVariability,
        nightShiftsCount, ptoDays, weeks
    ]);

    // Final (ore 75% + chestionar 25%)
    const combined = useMemo(() => {
        const s = Math.round(objectiveScore * 0.75 + surveyScore * 0.25);
        const band: Band = s < 25 ? 'verde' : s < 50 ? 'galben' : s < 75 ? 'portocaliu' : 'rosu';
        return { score: s, band };
    }, [objectiveScore, surveyScore]);

    const levelText = (v: number) => {
        if (v <= 2) return 'foarte scăzut — în control';
        if (v <= 4) return 'scăzut — ține sub observație';
        if (v <= 6) return 'moderat — afectează rutina';
        if (v <= 8) return 'ridicat — reduce încărcarea';
        return 'critic — acțiuni imediate';
    };

    return (
        <div className="w-full border rounded-2xl p-4 md:p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Burnout (demo în HR)</h3>
                <span className={`text-xs px-2 py-1 rounded text-white ${bandColor(combined.band)}`}>{combined.band}</span>
            </div>

            {/* Scoruri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Setări */}
                <div>
                    <div className="text-sm font-medium mb-2">Fereastră analiză</div>
                    <input type="range" min={4} max={12} step={1} value={weeks} onChange={e => setWeeks(parseInt(e.target.value))} className="w-full" />
                    <div className="text-xs text-gray-600 mt-1">{weeks} săptămâni</div>
                </div>

                {/* Scor final */}
                <div>
                    <ScoreBar label="Total" value={combined.score} band={combined.band} />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <ScoreMini label="Din ore" value={objectiveScore} />
                        <ScoreMini label="Chestionar" value={surveyScore} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">Ponderi: ore 75% • chestionar 25%</p>
                </div>

                {/* KPIs sintetici */}
                <div>
                    <KV k="Ore/săpt. (medie)" v={`${round1(weeklyHoursAvg)} h`} />
                    <KV k="Ore/săpt. (P95)" v={`${round1(weeklyHoursP95)} h`} />
                    <KV k="Zile >10h" v={`${round1(longDaysPct)}%`} />
                    <KV k="Max. zile consecutive" v={`${consecutiveDaysMax}`} />
                    <KV k="Nopți <11h" v={`${round1(lowRecoveryNightsPct)}%`} />
                    <KV k="Weekend lucrat" v={`${round1(weekendWorkPct)}%`} />
                </div>
            </div>

            {/* Form „Ore & ritm” */}
            <div className="mt-6">
                <h4 className="font-medium mb-2">Ore & ritm (introducere rapidă)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumInput label="Ore/săpt. (medie)" value={weeklyHoursAvg} step={1} min={0} max={120} onChange={setWeeklyHoursAvg} />
                    <NumInput label="Ore/săpt. (P95)" value={weeklyHoursP95} step={1} min={0} max={140} onChange={setWeeklyHoursP95} />
                    <NumInput label="% zile >10h" value={longDaysPct} step={1} min={0} max={100} onChange={setLongDaysPct} />
                    <NumInput label="Max. zile consecutive" value={consecutiveDaysMax} step={1} min={0} max={30} onChange={setConsecutiveDaysMax} />
                    <NumInput label="% nopți cu pauză <11h" value={lowRecoveryNightsPct} step={1} min={0} max={100} onChange={setLowRecoveryNightsPct} />
                    <NumInput label="% weekend lucrat" value={weekendWorkPct} step={1} min={0} max={100} onChange={setWeekendWorkPct} />
                    <NumInput label="Variabilitate oră start (h)" value={scheduleVariability} step={0.1} min={0} max={8} onChange={setScheduleVariability} />
                    <NumInput label="Ture de noapte (nr.)" value={nightShiftsCount} step={1} min={0} max={60} onChange={setNightShiftsCount} />
                    <NumInput label="Zile libere (PTO) în fereastră" value={ptoDays} step={1} min={0} max={90} onChange={setPtoDays} />
                </div>
            </div>

            {/* Chestionar 10 itemi */}
            <div className="mt-6">
                <h4 className="font-medium mb-2">Chestionar (0–10)</h4>
                <div className="space-y-4">
                    {QUESTIONS.map((text, i) => {
                        const v = answers[i] ?? 0;
                        return (
                            <div key={i} className="p-3 border rounded">
                                <div className="text-sm font-medium mb-2">{i + 1}. {text}</div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range" min={0} max={10} step={1}
                                        value={v}
                                        onChange={(e) => {
                                            const next = answers.slice();
                                            next[i] = parseInt(e.target.value);
                                            setAnswers(next);
                                        }}
                                        className="w-full"
                                    />
                                    <div className="w-20 text-right text-sm tabular-nums">{v}/10</div>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">{levelText(v)}</div>
                            </div>
                        );
                    })}
                    <p className="text-[11px] text-gray-500">0 = deloc/rar • 10 = extrem/aproape zilnic</p>
                </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-4 text-[11px] text-gray-500">
                Instrument orientativ — nu reprezintă diagnostic medical. La conectarea cu datele HR, câmpurile de mai sus se vor popula automat.
            </p>
        </div>
    );
}

/* ======= UI mici ======= */
function ScoreBar({ label, value, band }: { label: string; value: number; band: Band }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{value}/100</span></div>
            <div className="w-full h-3 rounded bg-gray-100">
                <div className={`h-3 rounded ${bandColor(band)}`} style={{ width: `${value}%` }} />
            </div>
            <div className="text-xs mt-1">
                Bandă: <span className={`text-white px-2 py-0.5 rounded ${bandColor(band)}`}>{band}</span>
            </div>
        </div>
    );
}

function ScoreMini({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1"><span>{label}</span><span>{value}</span></div>
            <div className="w-full h-2 rounded bg-gray-100">
                <div className="h-2 rounded bg-sky-500" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
            <span className="text-gray-500">{k}</span><span className="font-medium">{v}</span>
        </div>
    );
}

function NumInput({
    label, value, onChange, step, min, max
}: {
    label: string; value: number; onChange: (n: number) => void;
    step?: number; min?: number; max?: number;
}) {
    return (
        <div>
            <div className="text-xs text-gray-600 mb-1">{label}</div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                step={step ?? 1}
                min={min}
                max={max}
                className="w-full rounded border px-2 py-1"
            />
        </div>
    );
}

/* ======= întrebările (10) ======= */
const QUESTIONS = [
    'Mă simt epuizat(ă) după majoritatea zilelor de muncă.',
    'Îmi este greu să mă concentrez sau să iau decizii simple la muncă.',
    'Dimineața mă trezesc tot obosit(ă), ca și cum nu m-aș fi refăcut.',
    'Simt că îmi pasă din ce în ce mai puțin de muncă sau de oameni.',
    'Mă enervez ușor la muncă pentru lucruri minore.',
    'Am impresia că oricât muncesc, rezultatele sunt slabe.',
    'Volumul/ritmul muncii e adesea peste ce pot duce.',
    'Adorm greu, mă trezesc des sau dorm sub 6–7 ore.',
    'Am frecvent dureri de cap sau tensiune musculară din stres.',
    'Munca îmi aduce tot mai rar sentimentul că are rost.'
];
