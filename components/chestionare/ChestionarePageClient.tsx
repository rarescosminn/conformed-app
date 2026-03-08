'use client';
import Link from 'next/link';
import React from 'react';
import { useOrg } from '@/lib/context/OrgContext';

type Cat = { label: string; slug: string };
type Props = { stats: Record<string, number> };

const CATEGORIES_SPITAL: Cat[] = [
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

const CATEGORIES_COMPANIE: Cat[] = [
    { label: 'Calitate (ISO 9001)', slug: 'calitate-iso9001' },
    { label: 'Mediu (ISO 14001)', slug: 'mediu-iso14001' },
    { label: 'Securitate și sănătate în muncă (ISO 45001)', slug: 'ssm-iso45001' },
    { label: 'Securitate informații (ISO 27001)', slug: 'securitate-informatii' },
    { label: 'Continuitate afaceri (ISO 22301)', slug: 'continuitate-afaceri' },
    { label: 'Energie (ISO 50001)', slug: 'energie-iso50001' },
    { label: 'Responsabilitate socială (SA8000)', slug: 'responsabilitate-sociala' },
    { label: 'ESG', slug: 'esg' },
    { label: 'Guvernanță corporativă', slug: 'guvernanta-corporativa' },
];

const CATEGORIES_INSTITUTIE: Cat[] = [
    { label: 'Calitate servicii publice (ISO 9001)', slug: 'calitate-iso9001' },
    { label: 'Mediu (ISO 14001)', slug: 'mediu-iso14001' },
    { label: 'Securitate și sănătate în muncă (ISO 45001)', slug: 'ssm-iso45001' },
    { label: 'Securitate informații (ISO 27001)', slug: 'securitate-informatii' },
    { label: 'Continuitate activitate (ISO 22301)', slug: 'continuitate-afaceri' },
    { label: 'Energie (ISO 50001)', slug: 'energie-iso50001' },
    { label: 'Transparență și anticorupție', slug: 'transparenta-anticoruptie' },
    { label: 'ESG', slug: 'esg' },
];

export default function ChestionarePageClient({ stats }: Props) {
    const { orgType } = useOrg();

    const categories =
        orgType === 'spital' ? CATEGORIES_SPITAL :
        orgType === 'institutie_publica' ? CATEGORIES_INSTITUTIE :
        CATEGORIES_COMPANIE;

    const title =
        orgType === 'spital' ? 'Chestionare - sectii medicale' :
        orgType === 'institutie_publica' ? 'Chestionare - domenii institutie' :
        'Chestionare - domenii companie';

    const subtitle =
        orgType === 'spital'
            ? 'Alege sectia. Fiecare sectie are chestionarul ei.'
            : 'Alege domeniul. Fiecare domeniu are chestionarul sau de conformare.';

    const headerLabel =
        orgType === 'spital' ? 'Sectii / subdomenii' : 'Domenii / standarde';

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
            <p style={{ margin: '6px 0 12px', opacity: 0.8 }}>{subtitle}</p>

            <div style={{
                border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#f8fbff)',
                borderRadius: 14, padding: 14, color: '#1e3a8a', marginTop: 6, fontWeight: 700,
            }}>
                {headerLabel}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {categories.map((c) => (
                    <Link key={c.slug} href={`/chestionare/${c.slug}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 999, border: '1px solid #e5e7eb',
                        background: '#fff', textDecoration: 'none', fontSize: 14,
                    }}>
                        <span aria-hidden style={{
                            width: 10, height: 10, borderRadius: 999,
                            border: '1px solid #bfdbfe', background: '#eff6ff',
                        }} />
                        {c.label}
                        {stats[c.slug] > 0 && (
                            <span style={{
                                background: '#2563eb', color: '#fff',
                                borderRadius: 999, fontSize: 11,
                                padding: '1px 7px', fontWeight: 700,
                            }}>
                                {stats[c.slug]}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}