// app/legislatie/page.tsx
'use client';

import Link from 'next/link';
import s from './legislatie.module.css';

const CARDS = [
    { href: '/legislatie/generale', label: 'Generale', desc: 'Legislație sanitară, pacienți, HR, fiscal, contabil, achiziții.' },
    { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM și PSI.' },
    { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu și sustenabilitate', desc: 'Deșeuri, APM/AFM, apă, energie, ESG.' },
    { href: '/legislatie/medicale', label: 'Medicale', desc: 'Ordine MS, epidemiologie, dispozitive, transfuzii, sterilizare.' },
    { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanță și etică', desc: 'SCIM, etică, avertizori, ANI.' },
    { href: '/legislatie/it-si-cibernetic', label: 'IT și cibernetic', desc: 'NIS/NIS2, ISO 27001, DES/telemedicină, arhivare.' },
    { href: '/legislatie/juridic-si-administrativ', label: 'Juridic și administrativ', desc: 'Civil și comercial, malpraxis, PI, anti-discriminare.' },
];

export default function LegislatieHub() {
    return (
        <div className={s.page}>
            <div className={s.header}>
                <Link href="/dashboard" className={s.back}>← Înapoi</Link>
                <h1 className={s.h1}>Legislație</h1>
            </div>

            <div className={s.grid} style={{ display: 'grid' }}>
                {CARDS.map((c) => (
                    <Link key={c.href} href={c.href} className={s.card}>
                        <div className={s.title}>{c.label}</div>
                        <p className={s.desc}>{c.desc}</p>
                        <div className={s.open}>Deschide →</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
