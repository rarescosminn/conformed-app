// /app/hr/burnout/page.tsx
'use client';

import React, { useMemo, useState } from 'react';

type Band = 'verde' | 'galben' | 'portocaliu' | 'rosu';

function bandColor(band: Band) {
  switch (band) {
    case 'verde': return 'bg-green-600';
    case 'galben': return 'bg-yellow-500';
    case 'portocaliu': return 'bg-orange-600';
    case 'rosu': return 'bg-red-600';
  }
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function round1(n: number) { return Math.round(n * 10) / 10; }

export default function BurnoutManualPage() {
  // ---- Date obiective introduse manual (fictive) ----
  const [weeks, setWeeks] = useState(8); // doar pentru text
  const [weeklyHoursAvg, setWeeklyHoursAvg] = useState(48);
  const [weeklyHoursP95, setWeeklyHoursP95] = useState(56);
  const [longDaysPct, setLongDaysPct] = useState(20);            // % zile >10h
  const [consecutiveDaysMax, setConsecutiveDaysMax] = useState(6);
  const [lowRecoveryNightsPct, setLowRecoveryNightsPct] = useState(25); // % pauze <11h
  const [weekendWorkPct, setWeekendWorkPct] = useState(15);      // % weekend lucrat
  const [scheduleVariability, setScheduleVariability] = useState(1.5); // mediană |Δ oră start| (h)
  const [nightShiftsCount, setNightShiftsCount] = useState(3);   // nr. ture de noapte în fereastră
  const [ptoDays, setPtoDays] = useState(6);                     // zile libere în fereastră

  // ---- Chestionar 10 itemi 0–10 (0 = bine, 10 = rău) ----
  const [answers, setAnswers] = useState<number[]>(
    Array.from({ length: 10 }, () => 0)
  );

  // Scor chestionar 0–100
  const surveyScore = useMemo(() => {
    const mean = answers.reduce((a, b) => a + b, 0) / answers.length;
    return Math.round(clamp01(mean / 10) * 100);
  }, [answers]);

  // Scor obiectiv din „ore & ritm” (0–100) – aceeași logică ca în variantele cu HR
  const objectiveScore = useMemo(() => {
    // Overload: pe baza P95 (fallback la medie)
    const h = weeklyHoursP95 || weeklyHoursAvg;
    const overload =
      h <= 35 ? 5 * (h / 35) :
      h <= 44 ? 50 * (h - 35) / 9 :
      h <= 50 ? 50 + 30 * (h - 44) / 6 :
      h <= 60 ? 80 + 20 * (h - 50) / 10 : 100;

    // Recovery: % nopți <11h + % zile >10h + consec >6 + PTO prea puțin (estimat)
    const recRaw =
      (lowRecoveryNightsPct) +
      (longDaysPct * 1.2) +
      (consecutiveDaysMax > 6 ? 20 : 0) +
      (ptoDays < Math.ceil(weeks) ? 20 : 0);
    const recovery = Math.min(100, recRaw) / 2.2;

    // Circadian: variabilitatea orei de start (0–5h -> 0–100)
    const circadian = clamp01(scheduleVariability / 5) * 100;

    // Irregularity: weekend + zile lungi
    const irregularity = Math.min(100, weekendWorkPct * 1.2 + longDaysPct * 0.5);

    // Nights: ture de noapte (~2/săpt. ≈ 100 la 8 săpt.)
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

  // Combinație finală (ore 75% + chestionar 25%)
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
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Burnout – Mod manual (demonstrativ)</h1>
      <p className="text-gray-600 mt-1">
        Completează rapid câmpurile de mai jos pentru a simula scorul. Nu sunt date medicale; instrument orientativ.
      </p>

      {/* Scoruri */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filtre / fereastră */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-3">Setări</h2>
          <label className="block text-sm mb-2">Fereastră analiză (săptămâni)</label>
          <input type="range" min={4} max={12} step={1} value={weeks} onChange={e=>setWeeks(parseInt(e.target.value))} className="w-full" />
          <div className="text-sm text-gray-700">{weeks} săptămâni</div>
        </div>

        {/* Scor final */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-3">Scor final</h2>
          <ScoreBar label="Total" value={combined.score} band={combined.band} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <ScoreMini label="Din ore (manual)" value={objectiveScore} />
            <ScoreMini label="Chestionar" value={surveyScore} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Ponderi: ore 75% • chestionar 25%</p>
        </div>

        {/* Indicatori din „ore” */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-3">Indicatori introduși</h2>
          <KV k="Ore/săpt. (medie)" v={`${round1(weeklyHoursAvg)} h`} />
          <KV k="Ore/săpt. (P95)" v={`${round1(weeklyHoursP95)} h`} />
          <KV k="Zile >10h" v={`${round1(longDaysPct)}%`} />
          <KV k="Max. zile consecutive" v={`${consecutiveDaysMax}`} />
          <KV k="Nopți recuperare <11h" v={`${round1(lowRecoveryNightsPct)}%`} />
          <KV k="Weekend lucrat" v={`${round1(weekendWorkPct)}%`} />
          <KV k="Variabilitate oră start (med.)" v={`${round1(scheduleVariability)} h`} />
          <KV k="Ture de noapte (nr.)" v={`${nightShiftsCount}`} />
          <KV k="Zile libere (PTO)" v={`${ptoDays}`} />
        </div>
      </section>

      {/* Form „Ore & ritm” */}
      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-3">Completează „Ore & ritm”</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Ore/săpt. (medie)" value={weeklyHoursAvg} step={1} min={0} max={120} onChange={setWeeklyHoursAvg} />
          <NumInput label="Ore/săpt. (P95)" value={weeklyHoursP95} step={1} min={0} max={140} onChange={setWeeklyHoursP95} />
          <NumInput label="% zile >10h" value={longDaysPct} step={1} min={0} max={100} onChange={setLongDaysPct} />
          <NumInput label="Max. zile consecutive" value={consecutiveDaysMax} step={1} min={0} max={30} onChange={setConsecutiveDaysMax} />
          <NumInput label="% nopți cu pauză <11h" value={lowRecoveryNightsPct} step={1} min={0} max={100} onChange={setLowRecoveryNightsPct} />
          <NumInput label="% weekend lucrat" value={weekendWorkPct} step={1} min={0} max={100} onChange={setWeekendWorkPct} />
          <NumInput label="Variabilitate oră start (h – mediană)" value={scheduleVariability} step={0.1} min={0} max={8} onChange={setScheduleVariability} />
          <NumInput label="Ture de noapte (nr.)" value={nightShiftsCount} step={1} min={0} max={60} onChange={setNightShiftsCount} />
          <NumInput label="Zile libere (PTO) în fereastră" value={ptoDays} step={1} min={0} max={90} onChange={setPtoDays} />
        </div>
      </section>

      {/* Chestionar 10 itemi */}
      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-3">Chestionar (0–10)</h2>
        <Survey10 values={answers} onChange={(idx, v) => {
          const next = answers.slice();
          next[idx] = v;
          setAnswers(next);
        }} />
      </section>

      {/* Recomandări */}
      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-2">Recomandări</h2>
        {combined.band === 'verde' && <List items={[
          'Menține încărcarea actuală; monitorizare lunară.',
          'Pauze ≥ 11h între zile, weekend protejat.'
        ]} />}
        {combined.band === 'galben' && <List items={[
          'Țintește ≤ 44h/săpt. (medie) și limitează vârfurile > 50h.',
          'Planifică cel puțin 2 zile de recuperare în 14 zile.'
        ]} />}
        {combined.band === 'portocaliu' && <List items={[
          'Reducere încărcare 4–6 săpt.; redistribuire sarcini.',
          'Variabilitate oră start < 1h; weekend protejat.'
        ]} />}
        {combined.band === 'rosu' && <List items={[
          'Stop ore suplimentare, mini-concediu, rotație ture de noapte.',
          'Consult de specialitate; monitorizare săptămânală.'
        ]} />}
        <p className="text-xs text-gray-500 mt-3">
          Instrument orientativ — nu reprezintă diagnostic medical. La conectare cu HR, câmpurile se vor popula automat.
        </p>
      </section>
    </main>
  );
}

/* ---------- mici componente UI ---------- */

function ScoreBar({label, value, band}:{label:string; value:number; band:Band}) {
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

function ScoreMini({label, value}:{label:string; value:number}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span>{value}</span></div>
      <div className="w-full h-2 rounded bg-gray-100">
        <div className="h-2 rounded bg-sky-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function KV({k, v}:{k:string; v:string}) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
      <span className="text-gray-500">{k}</span><span className="font-medium">{v}</span>
    </div>
  );
}

function List({items}:{items:string[]}) {
  return <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">{items.map((t,i)=><li key={i}>{t}</li>)}</ul>;
}

function NumInput({
  label, value, onChange, step, min, max
}:{
  label: string; value: number; onChange: (n:number)=>void;
  step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
        step={step ?? 1}
        min={min}
        max={max}
        className="w-full rounded border px-2 py-1"
      />
    </div>
  );
}

function Survey10({values, onChange}:{values:number[]; onChange:(idx:number, v:number)=>void}) {
  const items = [
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

  const level = (v:number) => {
    if (v <= 2) return 'foarte scăzut — în control';
    if (v <= 4) return 'scăzut — ține sub observație';
    if (v <= 6) return 'moderat — afectează rutina';
    if (v <= 8) return 'ridicat — reduce încărcarea';
    return 'critic — acțiuni imediate';
  };

  return (
    <div className="space-y-4">
      {items.map((text, i) => {
        const v = values[i] ?? 0;
        return (
          <div key={i} className="p-3 border rounded">
            <div className="text-sm font-medium mb-2">{i+1}. {text}</div>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={10} step={1}
                value={v}
                onChange={(e)=>onChange(i, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="w-24 text-right text-sm tabular-nums">{v}/10</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{level(v)}</div>
          </div>
        );
      })}
      <p className="text-xs text-gray-500">0 = deloc/rar • 10 = extrem/aproape zilnic</p>
    </div>
  );
}
