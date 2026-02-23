// /components/RightSidebarGeneral.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSsmPsiStore } from "@/store/ssmpsi";

const Card = ({
    title,
    subtitle,
    children,
    href,
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    href: string;
}) => {
    return (
        <div className="rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 bg-white">
            <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
            </div>
            <div className="mb-3">{children}</div>
            <Link
                href={href}
                className="inline-flex items-center text-sm font-medium hover:underline"
            >
                Deschide →
            </Link>
        </div>
    );
};

const fmtDate = (iso?: string) => {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString();
    } catch {
        return "-";
    }
};

const daysUntil = (iso?: string) => {
    if (!iso) return Infinity;
    const d = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return diff;
};

export default function RightSidebarGeneral() {
    const store = useSsmPsiStore();

    useEffect(() => {
        store.load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        store.save();
    }, [store]);

    /** 1) EIP – total + expirări < 30 zile */
    const eipTotals = useMemo(() => {
        const total = store.eip.length;
        const expiringSoon = store.eip.filter((i) => daysUntil(i.dataExpirare) <= 30).length;
        return { total, expiringSoon };
    }, [store.eip]);

    /** 2) Exerciții evacuare – următoarea dată + ultimele 2 */
    const evacuariInfo = useMemo(() => {
        const ord = [...store.evacuari].sort(
            (a, b) => new Date(a.dataPlanificata).getTime() - new Date(b.dataPlanificata).getTime()
        );
        const upcoming = ord.find((x) => new Date(x.dataPlanificata).getTime() >= Date.now());
        const lastTwo = [...store.evacuari]
            .sort((a, b) => new Date(b.dataPlanificata).getTime() - new Date(a.dataPlanificata).getTime())
            .slice(0, 2);
        return { upcoming, lastTwo };
    }, [store.evacuari]);

    /** 3) Avize & autorizații – expiră în < 60 zile */
    const avizeStats = useMemo(() => {
        const exp60 = store.avize.filter((a) => daysUntil(a.dataExpirare) <= 60).length;
        const total = store.avize.length;
        return { exp60, total };
    }, [store.avize]);

    /** 4) Permise de lucru – active azi */
    const permiseStats = useMemo(() => {
        const now = Date.now();
        const activeAzi = store.permise.filter((p) => {
            const start = new Date(p.dataStart).getTime();
            const stop = p.dataStop ? new Date(p.dataStop).getTime() : undefined;
            const okInterval = stop ? now >= start && now <= stop : now >= start;
            return p.activ && okInterval;
        }).length;
        return { activeAzi };
    }, [store.permise]);

    /** 5) Registru riscuri & măsuri – deschise + întârziate */
    const riscuriStats = useMemo(() => {
        const deschise = store.riscuri.filter((r) => r.status !== "inchis").length;
        const intarziate = store.riscuri.filter((r) => {
            if (!r.termen) return false;
            return daysUntil(r.termen) < 0 && r.status !== "inchis";
        }).length;
        return { deschise, intarziate };
    }, [store.riscuri]);

    /** 6) Audit/controale – programări viitoare + NC deschise */
    const auditStats = useMemo(() => {
        const viitoare = store.audit.filter((a) => new Date(a.data).getTime() >= Date.now()).length;
        const ncDeschise = store.audit.reduce((acc, a) => acc + (a.neconformitatiDeschise || 0), 0);
        return { viitoare, ncDeschise };
    }, [store.audit]);

    /** 7) Documente SSM/PSI – total + încărcate recent (< 30 zile) */
    const bibliotecaStats = useMemo(() => {
        const total = store.biblioteca.length;
        const recent = store.biblioteca.filter((d) => daysUntil(d.dataUpload) >= -30).length;
        return { total, recent };
    }, [store.biblioteca]);

    /** 8) Rapoarte KPI – generate în ultimele 30 zile */
    const kpiStats = useMemo(() => {
        const recent = store.kpi.filter((r) => daysUntil(r.dataGenerare) >= -30).length;
        const total = store.kpi.length;
        return { total, recent };
    }, [store.kpi]);

    return (
        <aside className="w-full">
            <Card
                title="EIP – echipament individual de protecție"
                subtitle="Gestiune pe angajat, mărimi, expirări, confirmări primire."
                href="/ssm/eip"
            >
                <div className="text-sm text-gray-700">
                    <div>Total EIP: <b>{eipTotals.total}</b></div>
                    <div>Expiră în ≤ 30 zile: <b>{eipTotals.expiringSoon}</b></div>
                </div>
            </Card>

            <Card
                title="Exerciții de evacuare"
                subtitle="Planificare, procese-verbale, dovezi media, recurență."
                href="/ssm/evacuari"
            >
                <div className="text-sm text-gray-700 space-y-1">
                    <div>Următorul: <b>{fmtDate(evacuariInfo.upcoming?.dataPlanificata)}</b></div>
                    {evacuariInfo.lastTwo.length > 0 ? (
                        <ul className="list-disc list-inside text-xs text-gray-600">
                            {evacuariInfo.lastTwo.map((e) => (
                                <li key={e.id}>PV {fmtDate(e.dataPlanificata)}</li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-xs text-gray-500">Nu există înregistrări.</div>
                    )}
                </div>
            </Card>

            <Card
                title="Avize & autorizații (ISU, ITM, mediu)"
                subtitle="Scadențe, fișiere atașate, remindere."
                href="/ssm/avize"
            >
                <div className="text-sm text-gray-700">
                    <div>Total: <b>{avizeStats.total}</b></div>
                    <div>Expiră în ≤ 60 zile: <b className={avizeStats.exp60 > 0 ? "text-red-600" : ""}>{avizeStats.exp60}</b></div>
                </div>
            </Card>

            <Card
                title="Permise de lucru"
                subtitle="Foc, spații închise, înălțime, electric – flux aprobare + jurnal."
                href="/ssm/permise"
            >
                <div className="text-sm text-gray-700">
                    <div>Permise active azi: <b>{permiseStats.activeAzi}</b></div>
                </div>
            </Card>

            <Card
                title="Registru riscuri & măsuri"
                subtitle="Evaluări, responsabil, termene, status."
                href="/ssm/riscuri"
            >
                <div className="text-sm text-gray-700">
                    <div>Riscuri deschise: <b>{riscuriStats.deschise}</b></div>
                    <div>Măsuri întârziate: <b className={riscuriStats.intarziate > 0 ? "text-red-600" : ""}>{riscuriStats.intarziate}</b></div>
                </div>
            </Card>

            <Card
                title="Audit / controale"
                subtitle="Programare, checklist, NC + AC."
                href="/ssm/audit"
            >
                <div className="text-sm text-gray-700">
                    <div>Programări viitoare: <b>{auditStats.viitoare}</b></div>
                    <div>NC deschise: <b>{auditStats.ncDeschise}</b></div>
                </div>
            </Card>

            <Card
                title="Documente SSM/PSI (bibliotecă)"
                subtitle="Proceduri, IPSSM, note interne, versiuni & istoric."
                href="/ssm/biblioteca"
            >
                <div className="text-sm text-gray-700">
                    <div>Total documente: <b>{bibliotecaStats.total}</b></div>
                    <div>Încărcate recent (≤ 30 zile): <b>{bibliotecaStats.recent}</b></div>
                </div>
            </Card>

            <Card
                title="Rapoarte KPI"
                subtitle="Indicatori lunari/anuali, trenduri și exporturi."
                href="/ssm/kpi"
            >
                <div className="text-sm text-gray-700">
                    <div>Total rapoarte: <b>{kpiStats.total}</b></div>
                    <div>Ultimele 30 zile: <b>{kpiStats.recent}</b></div>
                </div>
            </Card>
        </aside>
    );
}
