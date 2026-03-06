// app/legislatie/lege/[lege]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import s from '../../legislatie.module.css';

// Importuri din fiecare categorie (alias-urile există în data.ts-urile lor)
import { findLawGenerale } from '../../generale/data';
import { findLawSSMPSI } from '../../ssm-psi/data';
import { findLawMediuSustenabilitate } from '../../mediu-si-sustenabilitate/data';
import { findLawMedicale } from '../../medicale/data';
import { findLawGuvernantaEtica } from '../../guvernanta-si-etica/data';
import { findLawITSI } from '../../it-si-cibernetic/data';
import { findLawJuridicAdmin } from '../../juridic-si-administrativ/data';

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('ro-RO') : '—');

export default function LegeDetaliu() {
    // numele parametrului trebuie să fie identic cu numele folderului: [lege]
    const { lege } = useParams<{ lege: string }>();

    type LegeType =
        | ReturnType<typeof findLawGenerale>
        | ReturnType<typeof findLawSSMPSI>
        | ReturnType<typeof findLawMediuSustenabilitate>
        | ReturnType<typeof findLawMedicale>
        | ReturnType<typeof findLawGuvernantaEtica>
        | ReturnType<typeof findLawITSI>
        | ReturnType<typeof findLawJuridicAdmin>;

    let curr: LegeType | undefined;
    let categorie = '';
    let backHref = '/legislatie';

    const trySet = (found: LegeType, nume: string, href: string) => {
        if (found) {
            curr = found;
            categorie = nume;
            backHref = href;
            return true;
        }
        return false;
    };

    // Căutăm pe rând în toate seturile de legi
    if (!trySet(findLawGenerale(lege), 'Generale', '/legislatie/generale')) {
        if (!trySet(findLawSSMPSI(lege), 'SSM-PSI', '/legislatie/ssm-psi')) {
            if (!trySet(
                findLawMediuSustenabilitate(lege),
                'Mediu și sustenabilitate',
                '/legislatie/mediu-si-sustenabilitate'
            )) {
                if (!trySet(findLawMedicale(lege), 'Medicale', '/legislatie/medicale')) {
                    if (!trySet(
                        findLawGuvernantaEtica(lege),
                        'Guvernanță și etică',
                        '/legislatie/guvernanta-si-etica'
                    )) {
                        trySet(findLawITSI(lege), 'IT și cibernetic', '/legislatie/it-si-cibernetic') ||
                            trySet(
                                findLawJuridicAdmin(lege),
                                'Juridic și administrativ',
                                '/legislatie/juridic-si-administrativ'
                            );
                    }
                }
            }
        }
    }

    if (!curr) {
        return (
            <div className={s.page}>
                <div className={s.header}>
                    <Link href="/legislatie" className={s.back}>← Înapoi</Link>
                    <h1 className={s.h1}>Lege inexistentă</h1>
                </div>
                <div className={s.card}>
                    <p className={s.desc}>
                        Nu am găsit această lege în categoriile configurate. Revino la hub și alege categoria potrivită.
                    </p>
                    <div className={s.open}>
                        <Link href="/legislatie">Mergi la hub →</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <div className={s.header}>
                <Link href={backHref} className={s.back}>← Înapoi</Link>
                <h1 className={s.h1}>{curr.title} — {curr.number}</h1>
            </div>

            <div className={s.card}>
                <div className={s.meta}>
                    <span className={s.small}><b>Categorie:</b> {categorie}</span>
                    <span className={s.small}><b>Publicat:</b> {fmt(curr.published)}</span>
                    {'status' in curr! && curr!.status && (
                        <span
                            className={`${s.status} ${curr!.status === 'in_vigoare'
                                    ? s['st-in']
                                    : curr!.status === 'modificat'
                                        ? s['st-mo']
                                        : s['st-ab']
                                }`}
                        >
                            {curr!.status === 'in_vigoare' ? 'în vigoare' : curr!.status}
                        </span>
                    )}
                </div>

                {'summary' in curr! && curr!.summary && (
                    <p className={s.desc} style={{ marginTop: 8 }}>{curr!.summary}</p>
                )}

                <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {'content' in curr! && curr!.content
                        ? curr!.content
                        : 'Conținutul detaliat al legii va fi disponibil aici.'}
                </div>

                {'source' in curr! && curr!.source && (
                    <div className={s.open} style={{ marginTop: 12 }}>
                        <a href={curr!.source} target="_blank" rel="noopener noreferrer">
                            Deschide sursa oficială →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
