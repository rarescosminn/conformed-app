// app/legislatie/generale/[law]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import s from '../../legislatie.module.css';
import { findLawGenerale } from '../data';

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('ro-RO') : '—');

export default function LawDetail() {
    const { law } = useParams<{ law: string }>();
    const curr = findLawGenerale(law);

    if (!curr) {
        return (
            <div className={s.page}>
                <div className={s.header}>
                    <Link href="/legislatie/generale" className={s.back}>← Înapoi</Link>
                    <h1 className={s.h1}>Lege inexistentă</h1>
                </div>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <div className={s.header}>
                <Link href="/legislatie/generale" className={s.back}>← Înapoi</Link>
                <h1 className={s.h1}>{curr.title} — {curr.number}</h1>
            </div>

            <div className={s.card}>
                <div className={s.meta}>
                    <span className={s.small}><b>Categorie:</b> Generale</span>
                    <span className={s.small}><b>Publicat:</b> {fmt(curr.published)}</span>
                    {curr.status && (
                        <span className={`${s.status} ${curr.status === 'in_vigoare' ? s['st-in'] :
                                curr.status === 'modificat' ? s['st-mo'] : s['st-ab']
                            }`}>
                            {curr.status === 'in_vigoare' ? 'în vigoare' : curr.status}
                        </span>
                    )}
                </div>

                {curr.summary && <p className={s.desc} style={{ marginTop: 8 }}>{curr.summary}</p>}

                <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {curr.content ?? 'Conținutul detaliat al legii va fi disponibil aici.'}
                </div>

                {curr.source && (
                    <div className={s.open} style={{ marginTop: 12 }}>
                        <a href={curr.source} target="_blank" rel="noopener noreferrer">Deschide sursa oficială →</a>
                    </div>
                )}
            </div>
        </div>
    );
}
