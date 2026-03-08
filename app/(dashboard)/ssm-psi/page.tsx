'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { stats, onDataChange } from '@/lib/ssmpsi-bridge';
import { useOrg } from '@/lib/context/OrgContext';

/* ===== Stiluri ===== */
const pageWrap: React.CSSProperties = { padding: 24 };
const title: React.CSSProperties = { margin: 0, fontWeight: 800, fontSize: 22, color: '#0f172a' };
const subtitle: React.CSSProperties = { margin: '6px 0 24px', color: 'rgba(15,23,42,.75)', fontSize: 14 };
const layout: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 360px',
    gap: 24,
    alignItems: 'start',
};
const sectionHeader: React.CSSProperties = {
    fontWeight: 700, fontSize: 15, color: 'rgba(15,23,42,.9)', margin: '0 0 12px',
};
const gridCards2: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20,
};
const dividerRightCol: React.CSSProperties = { paddingLeft: 16, borderLeft: '1px solid #e5e7eb' };
const sidebar: React.CSSProperties = { position: 'sticky', top: 16, paddingLeft: 16, borderLeft: '1px solid #e5e7eb' };
const sidebarStack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const card: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 8, padding: 18,
    textDecoration: 'none', background: '#ffffff', border: '1px solid #e5e7eb',
    borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    color: '#0f172a',
};

export default function Page() {
    const { orgType } = useOrg();

    const [agg, setAgg] = useState({
        eip: stats.eip(),
        evac: stats.evacuari(),
        avz: stats.avize(),
        prm: stats.permise(),
        rsc: stats.riscuri(),
        aud: stats.audite(),
        doc: stats.documente(),
        kpi: stats.kpi(),
    });

    useEffect(() => {
        const refresh = () => setAgg({
            eip: stats.eip(),
            evac: stats.evacuari(),
            avz: stats.avize(),
            prm: stats.permise(),
            rsc: stats.riscuri(),
            aud: stats.audite(),
            doc: stats.documente(),
            kpi: stats.kpi(),
        });
        refresh();
        return onDataChange(refresh);
    }, []);

    const pageTitle =
        orgType === 'spital' ? 'SSM / PSI' :
        orgType === 'institutie_publica' ? 'Securitate și Sănătate în Muncă / PSI' :
        'Securitate și Sănătate în Muncă / PSI';

    const pageSubtitle =
        orgType === 'spital'
            ? 'Instruiri, echipamente, incidente. Module rapide în dreapta.'
            : 'Instruiri SSM, echipamente PSI, incidente, riscuri. Module rapide în dreapta.';

    const instruiriDesc =
        orgType === 'spital'
            ? 'Planificare HR, liste prezență, dovezi, finalizare, % conformare.'
            : 'Planificare instruiri (introductiv-general, la locul de muncă, periodic), liste prezență, dovezi.';

    const incidenteDesc =
        orgType === 'spital'
            ? 'Raport inițial, validare, clasificare, export fișă, arhivă.'
            : 'Raport inițial accident/incident, validare, clasificare, ITM, export fișă, arhivă.';

    const echipamenteDesc =
        orgType === 'spital'
            ? 'Stingătoare, hidranți, truse, sisteme alarmă — scadențe și status.'
            : 'Stingătoare, hidranți, truse prim ajutor, sisteme detecție incendiu — scadențe și verificări.';

    const eipDesc =
        orgType === 'spital'
            ? 'Gestiune și distribuții pe angajat, mărimi, expirări, confirmări primire.'
            : 'Gestionare EIP pe angajat și post de lucru, mărimi, expirări, confirmări de primire.';

    const avizeDesc =
        orgType === 'spital'
            ? 'Evidență scadențe, fișiere atașate, remindere.'
            : 'Autorizație ISU, aviz ITM, autorizație de mediu — scadențe, fișiere, remindere.';

    return (
        <div style={pageWrap}>
            <h1 style={title}>{pageTitle}</h1>
            <p style={subtitle}>{pageSubtitle}</p>

            <div style={layout}>
                {/* COL 1: SSM */}
                <section>
                    <div style={sectionHeader}>SSM</div>
                    <div style={gridCards2}>
                        <Link href="/ssm-psi/ssm/instruiri" style={card}>
                            <strong>Instruiri</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{instruiriDesc}</span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/ssm/incidente" style={card}>
                            <strong>Incidente / Accidente</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{incidenteDesc}</span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
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
                                <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* COL 3: Sidebar */}
                <aside style={sidebar}>
                    <div style={sectionHeader}>Module rapide</div>
                    <div style={sidebarStack}>
                        <Link href="/ssm-psi/ssm/eip" style={card}>
                            <strong>EIP – echipament individual de protecție</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{eipDesc}</span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.eip.total}</b> · Expiră ≤30z: <b>{agg.eip.exp30}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/psi/evacuari" style={card}>
                            <strong>Exerciții de evacuare</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Planificare, procese-verbale, dovadă foto/video, recurență (trimestrial/anual).
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Următorul: <b>{agg.evac.upcoming ? new Date(agg.evac.upcoming.dataPlanificata).toLocaleDateString() : '-'}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/psi/avize" style={card}>
                            <strong>Avize și autorizații {orgType === 'spital' ? '(ISU, ITM, mediu)' : '(ISU, ITM, mediu)'}</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{avizeDesc}</span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.avz.total}</b> · Expiră ≤60z: <b>{agg.avz.exp60}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/psi/permise-lucru" style={card}>
                            <strong>Permise de lucru</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                (lucru cu foc, spații închise, la înălțime, electric) – flux aprobare + jurnal intervenții.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Active azi: <b>{agg.prm.activeAzi}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/ssm/riscuri" style={card}>
                            <strong>Registru riscuri și măsuri</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Evaluări, responsabil, termene, status măsuri (dashboard).
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Deschise: <b>{agg.rsc.deschise}</b> · Întârziate: <b>{agg.rsc.intarziate}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>
                    </div>
                </aside>

                {/* Module analiză & raportare */}
                <section style={{ gridColumn: '1 / span 2', marginTop: -350, alignSelf: 'start' }}>
                    <div style={sectionHeader}>Module de analiză și raportare</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
                        <Link href="/ssm-psi/ssm/audite" style={card}>
                            <strong>Audit / controale</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Programare, checklist, neconformități + acțiuni corective.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Viitoare: <b>{agg.aud.viitoare}</b> · NC: <b>{agg.aud.nc}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/documente" style={card}>
                            <strong>Documente SSM/PSI (bibliotecă)</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Proceduri, instrucțiuni proprii, note interne — versiuni și istoric.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.doc.total}</b> · Recent ≤30z: <b>{agg.doc.recent}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>

                        <Link href="/ssm-psi/rapoarte" style={card}>
                            <strong>Rapoarte KPI</strong>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>
                                Indicatori lunari/anuali, trenduri și exporturi.
                            </span>
                            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                                Total: <b>{agg.kpi.total}</b> · Recent ≤30z: <b>{agg.kpi.recent}</b>
                            </span>
                            <span style={{ marginTop: 'auto', fontSize: 13, opacity: 0.9 }}>Deschide →</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}