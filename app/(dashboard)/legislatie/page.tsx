// TODO: conectare API legislatie
// - tabel `legislatie` per org_id cu acte normative proprii
// - posibilitate upload PDF + metadate (numar, data, categorie)
// - badge count per categorie din Supabase

'use client';
import Link from 'next/link';
import s from './legislatie.module.css';
import { useOrg } from '@/lib/context/OrgContext';

type Card = { href: string; label: string; desc: string };

const CARDS_SPITAL: Card[] = [
    { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie sanitara, pacienti, HR, fiscal, contabil, achizitii.' },
    { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
    { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
    { href: '/legislatie/medicale', label: 'Medicale', desc: 'Ordine MS, epidemiologie, dispozitive, transfuzii, sterilizare.' },
    { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'SCIM, etica, avertizori, ANI.' },
    { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, DES/telemedicina, arhivare.' },
    { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Civil si comercial, malpraxis, PI, anti-discriminare.' },
];

const CARDS_COMPANIE: Card[] = [
    { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie HR, fiscal, contabil, achizitii, comercial.' },
    { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
    { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
    { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, GDPR, arhivare.' },
    { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Drept comercial, contracte, PI, anti-discriminare.' },
    { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'Guvernanta corporativa, etica, avertizori, ANI.' },
];

const CARDS_INSTITUTIE: Card[] = [
    { href: '/legislatie/generale', label: 'Generale', desc: 'Legislatie administratie publica, HR, fiscal, contabil, achizitii publice.' },
    { href: '/legislatie/ssm-psi', label: 'SSM-PSI', desc: 'SSM si PSI.' },
    { href: '/legislatie/mediu-si-sustenabilitate', label: 'Mediu si sustenabilitate', desc: 'Deseuri, APM/AFM, apa, energie, ESG.' },
    { href: '/legislatie/it-si-cibernetic', label: 'IT si cibernetic', desc: 'NIS/NIS2, ISO 27001, GDPR, arhivare electronica.' },
    { href: '/legislatie/juridic-si-administrativ', label: 'Juridic si administrativ', desc: 'Drept administrativ, contencios, PI, anti-discriminare.' },
    { href: '/legislatie/guvernanta-si-etica', label: 'Guvernanta si etica', desc: 'SCIM, transparenta, etica, avertizori, ANI.' },
];

export default function LegislatieHub() {
    const { orgType } = useOrg();

    const cards =
        orgType === 'spital' ? CARDS_SPITAL :
        orgType === 'institutie_publica' ? CARDS_INSTITUTIE :
        CARDS_COMPANIE;

    return (
        <div className={s.page}>
            <div className={s.header}>
                <Link href="/dashboard" className={s.back}>← Inapoi</Link>
                <h1 className={s.h1}>Legislatie</h1>
            </div>
            <div className={s.grid} style={{ display: 'grid' }}>
                {cards.map((c) => (
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