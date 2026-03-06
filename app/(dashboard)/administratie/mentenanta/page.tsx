'use client';
import React, { useMemo, useState, useEffect } from 'react';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';
import { MAINTENANCE_CARDS, Frecventa, MaintenanceCard } from '@/lib/maintenance/cards';
import { sortByImpactDesc, impactOf } from '@/lib/maintenance/priority';

const FREQ_LABEL: Record<Frecventa, string> = {
    zilnic: 'Zilnic',
    saptamanal: 'Săptămânal',
    lunar: 'Lunar',
    trimestrial: 'Trimestrial',
    semestrial: 'Semestrial',
    anual: 'Anual',
};

function ImpactMethodologyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
            <div style={{ width: 'min(920px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: 'white', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a8a' }}>Metodologie calcul impact</div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 10, fontSize: 14 }}>
                    <p style={{ margin: 0, color: '#0f172a' }}>Impactul arată cât de tare lovește spitalul dacă activitatea lipsește sau e în avarie. Cardurile sunt sortate descrescător după acest scor.</p>
                    <div style={{ border: '1px solid #bfdbfe', borderRadius: 12, padding: 12, background: '#f5faff' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#1e3a8a' }}>Formula</div>
                        <code style={{ fontFamily: 'monospace', color: '#1e40af' }}>impact = (scor_severitate 1..5) + (critical ? 1 : 0)</code>
                        <ul style={{ margin: '8px 0 0 18px' }}>
                            <li>Scor implicit (fallback) dacă lipsește intrarea: <b>2</b>.</li>
                            <li><b>critical</b> = activitate cu risc vital/continuitate/obligație legală ⇒ +1 și dovadă obligatorie.</li>
                            <li>Rezultatul este între <b>2</b> și <b>6</b>. Sortăm descrescător după impact.</li>
                        </ul>
                    </div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Scala severitate (1..5)</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li><b>5 – critic major</b>: oprește spitalul / siguranță pacienți / obligație legală (ex: gaze med., ATS generator, buletine apă/Legionella, PRAM/RCD, ISCIR).</li>
                            <li><b>4 – întreruperi majore</b>: afectează multe zone/servicii (ex: UPS alarme/autonomie, centrale/ACM, tel. alarmă lift).</li>
                            <li><b>3 – impact operațional</b>: confort/calitate pe departamente (ex: AHU/filtre, chiller/VRF, hidrofor).</li>
                            <li><b>2 – rutină</b>: întreținere uzuală (grătare aer, sifoane, sare dedurizare).</li>
                        </ul>
                        <p style={{ marginTop: 8, opacity: 0.8 }}><i>Frecvența</i> nu influențează impactul — măsurăm doar consecința avariei.</p>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>Închide</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

type SortMode = 'impact' | 'alfabetic';

export default function Page() {
    const [freq, setFreq] = useState<Frecventa>('zilnic');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<SortMode>('impact');

    const INFO_KEY = 'mentenanta-impact-info-dismissed';
    const [openInfo, setOpenInfo] = useState(false);
    const [hideInfo, setHideInfo] = useState(false);
    useEffect(() => {
        try { setHideInfo(localStorage.getItem(INFO_KEY) === '1'); } catch { }
    }, []);
    const dismissInfo = () => {
        try { localStorage.setItem(INFO_KEY, '1'); } catch { }
        setHideInfo(true);
    };

    const items = useMemo(() => {
        let base = MAINTENANCE_CARDS.filter((c) => c.frequency === freq);
        if (q.trim()) {
            const s = q.toLowerCase();
            base = base.filter((c) => c.title.toLowerCase().includes(s) || c.tags?.some((t) => t.toLowerCase().includes(s)));
        }
        if (sort === 'impact') return sortByImpactDesc(base);
        return [...base].sort((a, b) => a.title.localeCompare(b.title));
    }, [freq, q, sort]);

    return (
        <AdminCategoryLayout
            title="Mentenanță"
            intro="Carduri standard — critice sus, în ordinea impactului."
            showBack
            links={{
                addTask: "/administratie/todo/new?cat=mentenanta",
                questionnaire: "/administratie/chestionare?cat=mentenanta",
                history: "/administratie/chestionare?cat=mentenanta&view=istoric",
            }}
        >
            <div style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff, #f8fbff)', color: '#1e3a8a', borderRadius: 14, padding: 14, marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>Carduri standard — critice sus, în ordinea impactului.</div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {!hideInfo && (
                            <>
                                <button onClick={() => setOpenInfo(true)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>Metodologie</button>
                                <button onClick={dismissInfo} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>Am înțeles</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
                {(['zilnic', 'saptamanal', 'lunar', 'trimestrial', 'semestrial', 'anual'] as Frecventa[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFreq(f)}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: freq === f ? '#dbeafe' : '#ffffff', color: '#1e3a8a', cursor: 'pointer' }}
                    >
                        {FREQ_LABEL[f]}
                    </button>
                ))}

                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Caută titlu/tag…"
                    style={{ marginLeft: 'auto', padding: '8px 10px', borderRadius: 10, border: '1px solid #bfdbfe', minWidth: 220 }}
                />

                <div style={{ display: 'inline-flex', gap: 6, border: '1px solid #bfdbfe', borderRadius: 10, padding: 4, background: '#f5faff' }}>
                    <button onClick={() => setSort('impact')} style={{ padding: '6px 10px', borderRadius: 8, background: sort === 'impact' ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}>
                        Sortează: Impact
                    </button>
                    <button onClick={() => setSort('alfabetic')} style={{ padding: '6px 10px', borderRadius: 8, background: sort === 'alfabetic' ? '#dbeafe' : 'transparent', color: '#1e3a8a' }}>
                        Sortează: Alfabetic
                    </button>
                </div>

                {hideInfo && (
                    <button
                        onClick={() => setOpenInfo(true)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: 'white', color: '#1e3a8a', cursor: 'pointer' }}
                    >
                        Metodologie impact
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {items.map((c) => <Card key={c.id} card={c} />)}
                {items.length === 0 && <div style={{ opacity: 0.7, fontSize: 14 }}>Niciun card pentru filtrul curent.</div>}
            </div>

            <ImpactMethodologyModal open={openInfo} onClose={() => setOpenInfo(false)} />
        </AdminCategoryLayout>
    );
}

function Card({ card }: { card: MaintenanceCard }) {
    const impact = impactOf(card);
    return (
        <div style={{ border: '1px solid #bfdbfe', borderRadius: 16, background: '#f8fbff', padding: 16, boxShadow: '0 6px 20px rgba(30,64,175,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
                <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 999, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af', fontSize: 12 }}>
                    {FREQ_LABEL[card.frequency]}
                </span>
                {card.critical && (
                    <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #fdba74', background: '#fff7ed', color: '#9a3412', fontSize: 12 }} title="Critic – dovadă obligatorie (foto/PDF).">
                        Critic
                    </span>
                )}
                <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1e3a8a', fontSize: 12 }} title="Impact = scor (1–5) +1 dacă e «Critic». Sortare descrescătoare.">
                    Impact {impact}/6
                </span>
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {card.fields.map((f) => (
                    <span key={f.key} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#f1f5f9', color: '#0f172a' }} title={`${f.type}${f.unit ? `, ${f.unit}` : ''}`}>
                        {f.label}{f.required ? ' *' : ''}
                    </span>
                ))}
            </div>

            {card.tags?.length ? (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {card.tags.map((t) => (<span key={t} style={{ fontSize: 11, color: '#1e40af', opacity: 0.9 }}>#{t}</span>))}
                </div>
            ) : null}
        </div>
    );
}
