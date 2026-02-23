'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminCategoryLayout from '@/components/AdminCategoryLayout';

/* ----------------- Alergeni (conform codurilor folosite în aplicație) ----------------- */
const ALLERGENS = [
    { id: 1, abbr: 'GLU', name: 'Cereale cu gluten (grâu, secară, orz, ovăz) și derivate' },
    { id: 2, abbr: 'OU', name: 'Ouă și derivate' },
    { id: 3, abbr: 'PES', name: 'Pește și derivate' },
    { id: 4, abbr: 'LAP', name: 'Lapte și derivate (incl. lactoză)' },
    { id: 5, abbr: 'TEL', name: 'Țelină și derivate' },
    { id: 6, abbr: 'MUS', name: 'Muștar și derivate' },
    { id: 7, abbr: 'CONG', name: 'Produs congelat' },
    { id: 8, abbr: 'SOI', name: 'Soia și derivate' },
] as const;

/* ----------------- Modal „Legendă alergeni” (accent albastru) ----------------- */
function AllergensModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
            <div style={{ width: 'min(920px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: 'white', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a8a' }}>Legendă alergeni</div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>
                        ✕
                    </button>
                </div>

                <div style={{ padding: 16, display: 'grid', gap: 12, fontSize: 14 }}>
                    <p style={{ margin: 0, color: '#0f172a' }}>
                        Folosim aceste abrevieri pentru a marca alergeni în rețetar și pe meniurile zilnice. La fiecare preparat se bifează codurile relevante.
                    </p>

                    <div style={{ border: '1px solid #bfdbfe', borderRadius: 12, padding: 12, background: '#f5faff' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>Lista de alergeni</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {ALLERGENS.map((a) => (
                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 56,
                                            padding: '2px 10px',
                                            borderRadius: 999,
                                            border: '1px solid #bfdbfe',
                                            background: '#eff6ff',
                                            color: '#1e40af',
                                            fontSize: 12,
                                        }}
                                    >
                                        {a.abbr}
                                    </span>
                                    <span>{a.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Reguli de marcaj</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>Se bifează <b>toți</b> alergenii care se regăsesc în preparat (inclusiv urme).</li>
                            <li>„CONG” se marchează pentru <b>produse congelate</b> sau componente provenite din congelate.</li>
                            <li>Lista este vizibilă și pe pagina Rețetar (în panoul din dreapta).</li>
                        </ul>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}>
                            Închide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ----------------- Pagina Bucătărie ----------------- */
export default function Page() {
    // Banner + modal (preferință salvată local)
    const INFO_KEY = 'bucatarie-alergeni-info-dismissed';
    const [openInfo, setOpenInfo] = useState(false);
    const [hideInfo, setHideInfo] = useState(false);
    useEffect(() => {
        try { setHideInfo(localStorage.getItem(INFO_KEY) === '1'); } catch { }
    }, []);
    const dismissInfo = () => {
        try { localStorage.setItem(INFO_KEY, '1'); } catch { }
        setHideInfo(true);
    };

    return (
        <AdminCategoryLayout
            title="Bucătărie"
            intro="Rețetar săptămânal, marcaj alergeni și procese suport."
            showBack
            links={{
                addTask: "/administratie/todo/new?cat=bucatarie",
                questionnaire: "/administratie/chestionare?cat=bucatarie",
                history: "/administratie/chestionare?cat=bucatarie&view=istoric",
            }}
        >
            {/* Banner albastru cu Alergeni */}
            <div
                style={{
                    border: '1px solid #bfdbfe',
                    background: 'linear-gradient(180deg,#eff6ff, #f8fbff)',
                    color: '#1e3a8a',
                    borderRadius: 14,
                    padding: 14,
                    marginTop: 6,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>Marcarea alergenilor pe rețetar</div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {!hideInfo && (
                            <>
                                <button
                                    onClick={() => setOpenInfo(true)}
                                    style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}
                                >
                                    Alergeni
                                </button>
                                <button
                                    onClick={dismissInfo}
                                    style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #bfdbfe', background: 'white', cursor: 'pointer' }}
                                >
                                    Am înțeles
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                    Coduri: {ALLERGENS.map(a => a.abbr).join(', ')}. Deschide „Alergeni” pentru legendă completă.
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
                <Link
                    href="/administratie/bucatarie/retetar"
                    style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid #bfdbfe',
                        background: '#ffffff',
                        color: '#1e3a8a',
                        textDecoration: 'none',
                    }}
                    title="Deschide Rețetarul săptămânal"
                >
                    Rețetar săptămânal
                </Link>

                {hideInfo && (
                    <button
                        onClick={() => setOpenInfo(true)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: 'white', color: '#1e3a8a', cursor: 'pointer' }}
                    >
                        Legendă alergeni
                    </button>
                )}
            </div>

            {/* Conținutul principal al secțiunii Bucătărie (poți adăuga aici alte carduri/secțiuni) */}
            <div
                style={{
                    display: 'grid',
                    gap: 12,
                }}
            >
                <div
                    style={{
                        border: '1px solid #bfdbfe',
                        borderRadius: 16,
                        background: '#f8fbff',
                        padding: 16,
                        boxShadow: '0 6px 20px rgba(30,64,175,0.06)',
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>
                        Rețetar – meniu pe zile și mese
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
                        Completează preparatele și marchează alergenii pentru fiecare porție. Poți importa date din PDF în pasul următor.
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <Link
                            href="/administratie/bucatarie/retetar"
                            style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid #bfdbfe',
                                background: 'white',
                                color: '#1e3a8a',
                                textDecoration: 'none',
                            }}
                        >
                            Deschide Rețetarul
                        </Link>
                    </div>
                </div>
            </div>

            {/* Modal alergeni */}
            <AllergensModal open={openInfo} onClose={() => setOpenInfo(false)} />
        </AdminCategoryLayout>
    );
}
