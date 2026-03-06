'use client';

import Link from 'next/link';
import React from 'react';

type Cat = { label: string; slug: string };

const CATEGORIES: Cat[] = [
    { label: 'ATI', slug: 'ati' },
    { label: 'Bloc operator', slug: 'bloc-operator' },
    { label: 'Boli infecțioase', slug: 'boli-infectioase' },
    { label: 'Cardiologie', slug: 'cardiologie' },
    { label: 'Chirurgie generală', slug: 'chirurgie-generala' },
    { label: 'CSSD/CPIVD (Sterilizare)', slug: 'cssd-sterilizare' },
    { label: 'Dermatologie', slug: 'dermatologie' },
    { label: 'Diabet, nutriție și boli metabolice', slug: 'diabet-nutritie' },
    { label: 'Endocrinologie', slug: 'endocrinologie' },
    { label: 'Farmacie', slug: 'farmacie' },
    { label: 'Gastroenterologie', slug: 'gastroenterologie' },
    { label: 'Hematologie', slug: 'hematologie' },
    { label: 'Laborator', slug: 'laborator' },
    { label: 'Nefrologie', slug: 'nefrologie' },
    { label: 'Neonatologie', slug: 'neonatologie' },
    { label: 'Neurologie', slug: 'neurologie' },
    { label: 'Obstetrică–Ginecologie', slug: 'obstetrica-ginecologie' },
    { label: 'Oftalmologie', slug: 'oftalmologie' },
    { label: 'Oncologie', slug: 'oncologie' },
    { label: 'ORL', slug: 'orl' },
    { label: 'Ortopedie', slug: 'ortopedie' },
    { label: 'Pediatrie', slug: 'pediatrie' },
    { label: 'Pneumologie', slug: 'pneumologie' },
    { label: 'Psihiatrie', slug: 'psihiatrie' },
    { label: 'Radiologie–Imagistică', slug: 'radiologie-imagistica' },
    { label: 'Recuperare medicală', slug: 'recuperare-medicala' },
    { label: 'UPU', slug: 'upu' },
];

export default function ChestionareIndex() {
    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Chestionare — secții medicale</h1>
            <p style={{ margin: '6px 0 12px', opacity: 0.8 }}>
                Alege secția. Fiecare secție are chestionarul ei, legat de un fișier JSON.
            </p>

            {/* header albastru, ca în HR */}
            <div
                style={{
                    border: '1px solid #bfdbfe',
                    background: 'linear-gradient(180deg,#eff6ff,#f8fbff)',
                    borderRadius: 14,
                    padding: 14,
                    color: '#1e3a8a',
                    marginTop: 6,
                    fontWeight: 700,
                }}
            >
                Secții / subdomenii
            </div>

            {/* chip-uri */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {CATEGORIES.map((c) => (
                    <Link
                        key={c.slug}
                        href={`/chestionare/${c.slug}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 999,
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            textDecoration: 'none',
                            fontSize: 14,
                        }}
                    >
                        <span
                            aria-hidden
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                border: '1px solid #bfdbfe',
                                background: '#eff6ff',
                            }}
                        />
                        {c.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
