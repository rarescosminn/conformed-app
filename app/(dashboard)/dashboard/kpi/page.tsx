import KpiUploader from "@/components/KpiUploader";
import KpiLineChart from "@/components/KpiLineChart";

const KPI_LIST = [
    { key: "sales", label: "Venituri totale" },
    { key: "leads", label: "Lead-uri calificate" },
    { key: "nps", label: "Scor NPS" },
];

export default function KpiPage() {
    return (
        <div className="grid gap-4 md:grid-cols-2" style={{ height: "calc(100vh - 120px)" }}>
            {/* Stânga: control + upload, cu scroll */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-y-auto p-3">
                <KpiUploader kpis={KPI_LIST} />
            </div>

            {/* Dreapta: grafic, card mic cu scroll propriu dacă pui mai multe grafice */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-y-auto p-3">
                <KpiLineChart />
            </div>
        </div>
    );
}
