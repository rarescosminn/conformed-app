// app/legislatie/juridic-si-administrativ/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from '../legislatie.module.css';
import { LEGI_JURIDIC_ADMIN } from './data';

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('ro-RO') : '—');

export default function JuridicSiAdministrativ() {
    const r = useRouter();

    return (
        <div className={s.page}>
            <div className={s.header}>
                <Link href="/legislatie" className={s.back}>← Înapoi</Link>
                <h1 className={s.h1}>Juridic și administrativ</h1>
            </div>

            <div className={s.grid} style={{ display: 'grid' }}>
                {LEGI_JURIDIC_ADMIN.map((lege) => (
                    <div
                        key={lege.slug}
                        className={s.card}
                        onClick={() => r.push(`/legislatie/lege/${encodeURIComponent(lege.slug)}`)}
                    >
                        <div className={s.title}>{lege.title} — {lege.number}</div>
                        {lege.summary && <p className={s.desc}>{lege.summary}</p>}
                        <div className={s.meta}>
                            <span className={s.small}>Publicat: {fmt(lege.published)}</span>
                            {lege.status && (
                                <span className={`${s.status} ${lege.status === 'in_vigoare' ? s['st-in'] :
                                        lege.status === 'modificat' ? s['st-mo'] : s['st-ab']
                                    }`}>
                                    {lege.status === 'in_vigoare' ? 'în vigoare' : lege.status}
                                </span>
                            )}
                        </div>
                        <div className={s.open}>Deschide →</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
