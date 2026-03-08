'use client';

import Link from 'next/link';
import React from 'react';
import { useOrg } from '@/lib/context/OrgContext';

const pageWrap: React.CSSProperties = { padding: 24 };
const titleStyle: React.CSSProperties = { margin: 0, fontWeight: 800, fontSize: 22, color: '#0f172a' };
const subtitle: React.CSSProperties = { margin: '6px 0 24px', color: 'rgba(15,23,42,.75)', fontSize: 14 };
const layout: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 24, alignItems: 'start' };
const sectionHeader: React.CSSProperties = { fontWeight: 700, fontSize: 15, color: 'rgba(15,23,42,.9)', margin: '0 0 12px' };
const gridCards2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 };
const dividerRightCol: React.CSSProperties = { paddingLeft: 16, borderLeft: '1px solid #e5e7eb' };
const sidebar: React.CSSProperties = { position: 'sticky', top: 16, paddingLeft: 16, borderLeft: '1px solid #e5e7eb' };
const sidebarStack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const card: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 8, padding: 18,
    textDecoration: 'none', background: '#ffffff', border: '1px solid #e5e7eb',
    borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    color: '#0f172a',
};

type AggData = {
    eip: { total: number; exp30: number };
    evacuari: { upcoming: any };
    avize: { total: number; exp60: number };
    permise: { activeAzi: number };
    riscuri: { deschise: number; intarziate: number };
    audite: { viitoare: number; nc: number };
    documente: { total: number; recent: number };
    kpi: { total: number; recent: number };
};

export default function SsmPsiPageClient({ agg }: { agg: AggData }) {
    const { orgType } = useOrg();

    const pageTitle =
        orgType === 'spital' ? 'SSM / PSI' :
        orgType === 'institutie_publica' ? 'Securitate si Sanatate in Munca / PSI' :
        'Securitate si Sanatate in Munca / PSI';

    const pageSubtitle =
        orgType === 'spital'
            ? 'Instruiri, echipamente, incidente. Module rapide in dreapta.'
            : 'Instruiri SSM, echipamente PSI, incidente, riscuri. Module rapide in dreapta.';

    const instruiriDesc =
        orgType === 'spital'
            ? 'Planificare HR, liste prezenta, dovezi, finalizare, % conformare.'
            : 'Planificare instruiri (introductiv-general, la locul de munca, periodic), liste prezenta, dovezi.';

    const incidenteDesc =
        orgType === 'spital'
            ? 'Raport initial, validare, clasificare, export fisa, arhiva.'
            : 'Raport initial accident/incident, validare, clasificare, ITM, export fisa, arhiva.';

    const echipamenteDesc =
        orgType === 'spital'
            ? 'Stingatoare, hidranti, truse, sisteme alarma - scadente si status.'
            : 'Stingatoare, hidranti, truse prim ajutor, sisteme detectie incendiu - scadente si verificari.';

    const eipDesc =
        orgType === 'spital'
            ? 'Gestiune si distributii pe angajat, marimi, expirari, confirmari primire.'
            : 'Gestionare EIP pe angajat si post de lucru, marimi, expirari, confirmari de primire.';

    const avizeDesc =
        orgType === 'spital'
            ? 'Evidenta scadente, fisiere atasate, remindere.'
            : 'Autorizatie ISU, aviz ITM, autorizatie de mediu - scadente, fisiere, remindere.';

    return (
        <div style={pageWrap}>
            <h1 style={titleStyle}>{pageTitle}</h1>
            <p style={subtitle}>{pageSubtitle}</p>

            <div style={layout}>
                {/* COL 1: SSM */}
                <section>
                    <div style={sectionHeader}>SSM</div>
                    <div style={gridCards2}>
                        <Link href="/ssm-psi/ssm/instruiri" style={card}>
                            <strong>Instruiri</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{instruiriDesc}</span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>
                        <Link href="/ssm-psi/ssm/incidente" style={card}>
                            <strong>Incidente / Accidente</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{incidenteDesc}</span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>
                    </div>
                </section>

                {/* COL 2: PSI */}
                <section style={dividerRightCol}>
                    <div style={sectionHeader}>PSI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
                        <div style={{ gridColumn: 'span 1' }}>
                            <Link href="/ssm-psi/psi/echipamente" style={card}>
                                <strong>Echipamente</strong>
                                <span style={{ fontSize: 13, opacity: 0.8 }}>{echipamenteDesc}</span>
                                <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* COL 3: Sidebar */}
                <aside style={sidebar}>
                    <div style={sectionHeader}>Module rapide</div>
                    <div style={sidebarStack}>
                        <Link href="/ssm-psi/ssm/eip" style={card}>
                            <strong>EIP - echipament individual de protectie</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{eipDesc}</span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.eip.total}</b> · Expira 30z: <b>{agg.eip.exp30}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/psi/evacuari" style={card}>
                            <strong>Exercitii de evacuare</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Planificare, procese-verbale, dovada foto/video, recurenta (trimestrial/anual).
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Urmatorul: <b>{agg.evacuari.upcoming ? new Date(agg.evacuari.upcoming.data_planificata).toLocaleDateString() : '-'}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/psi/avize" style={card}>
                            <strong>Avize si autorizatii (ISU, ITM, mediu)</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{avizeDesc}</span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.avize.total}</b> · Expira 60z: <b>{agg.avize.exp60}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/psi/permise-lucru" style={card}>
                            <strong>Permise de lucru</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                (lucru cu foc, spatii inchise, la inaltime, electric) - flux aprobare + jurnal interventii.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Active azi: <b>{agg.permise.activeAzi}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/ssm/riscuri" style={card}>
                            <strong>Registru riscuri si masuri</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Evaluari, responsabil, termene, status masuri (dashboard).
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Deschise: <b>{agg.riscuri.deschise}</b> · Intarziate: <b>{agg.riscuri.intarziate}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>
                    </div>
                </aside>

                {/* Module analiza & raportare */}
                <section style={{ gridColumn: '1 / span 2', marginTop: -350, alignSelf: 'start' }}>
                    <div style={sectionHeader}>Module de analiza si raportare</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
                        <Link href="/ssm-psi/ssm/audite" style={card}>
                            <strong>Audit / controale</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Programare, checklist, neconformitati + actiuni corective.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Viitoare: <b>{agg.audite.viitoare}</b> · NC: <b>{agg.audite.nc}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/documente" style={card}>
                            <strong>Documente SSM/PSI (biblioteca)</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Proceduri, instructiuni proprii, note interne - versiuni si istoric.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.documente.total}</b> · Recent 30z: <b>{agg.documente.recent}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>

                        <Link href="/ssm-psi/rapoarte" style={card}>
                            <strong>Rapoarte KPI</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Indicatori lunari/anuali, trenduri si exporturi.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.kpi.total}</b> · Recent 30z: <b>{agg.kpi.recent}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}