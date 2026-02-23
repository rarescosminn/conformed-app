'use client';

type Kpi = {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  target?: number;       // pentru colorare vs țintă
  isPercent?: boolean;   // formatare %
  invert?: boolean;      // dacă valoare mai mică e mai bună (ex. DSO)
};

// ====== DEMO DATA (înlocuiește cu fetch din Supabase) ======
const demo = {
  month: '2025-08',
  revenuePlan: 18_500_000,
  revenueActual: 17_900_000,
  opexPlan: 11_000_000,
  opexActual: 10_800_000,
  payrollActual: 6_550_000,
  capexActual: 1_200_000,
  ebitda: 2_150_000,
  arBalance: 8_700_000,   // creanțe
  apBalance: 6_100_000,   // datorii
  collectionsCNAS: 15_200_000,
  contractedCNAS: 16_200_000,
  cashEnd: 5_100_000,
  monthlyBurn: 4_000_000,
  inpatientDays: 43_500,
  drgCases: 11_800
};
// =========================================================

const fmt = (n: number) => n.toLocaleString('ro-RO');
const pct = (n: number) => `${n.toFixed(1)}%`;

// culoare vs target: verde ok, galben ±10%, roșu rest
function colorByTarget(val: number, target = 100, invert = false) {
  const ratio = invert ? target / Math.max(val, 0.0001) : val / Math.max(target, 0.0001);
  if (ratio >= 1) return '#2ECC71';           // verde
  if (ratio >= 0.9) return '#F1C40F';         // galben
  return '#E74C3C';                            // roșu
}

export default function FinanceKPIs() {
  // calcule KPI (demo)
  const execRevenue = (demo.revenueActual / demo.revenuePlan) * 100;
  const payrollPct = (demo.payrollActual / demo.revenueActual) * 100;
  const opexPct = (demo.opexActual / demo.revenueActual) * 100;
  const capexPct = (demo.capexActual / (demo.capexActual + demo.opexActual)) * 100;
  const ebitdaMargin = (demo.ebitda / demo.revenueActual) * 100;
  const cnasCollectPct = (demo.collectionsCNAS / demo.contractedCNAS) * 100;
  // ipoteză simplă pentru DSO/DPO (luni de 30 zile)
  const avgDailyRevenue = demo.revenueActual / 30;
  const avgDailyCost = demo.opexActual / 30;
  const DSO = demo.arBalance / Math.max(avgDailyRevenue, 1);
  const DPO = demo.apBalance / Math.max(avgDailyCost, 1);
  const cashRunwayMonths = demo.cashEnd / Math.max(demo.monthlyBurn, 1);
  const costPerInpatientDay = demo.opexActual / Math.max(demo.inpatientDays, 1);
  const costPerDRG = (demo.opexActual + demo.payrollActual) / Math.max(demo.drgCases, 1);

  const kpis: Kpi[] = [
    { key: 'exec', label: 'Execuție buget venituri', value: pct(execRevenue), target: 100, isPercent: true },
    { key: 'cnas', label: 'Colectare CNAS', value: pct(cnasCollectPct), target: 100, isPercent: true },
    { key: 'ebitda', label: 'EBITDA margin', value: pct(ebitdaMargin), target: 12, isPercent: true },
    { key: 'payroll', label: 'Payroll / Venituri', value: pct(payrollPct), target: 35, isPercent: true, invert: true },
    { key: 'opex', label: 'OPEX / Venituri', value: pct(opexPct), target: 65, isPercent: true, invert: true },
    { key: 'capex', label: 'CAPEX % din total', value: pct(capexPct), target: 15, isPercent: true },
    { key: 'dso', label: 'DSO (zile creanțe)', value: Math.round(DSO), unit: 'zile', target: 45, invert: true },
    { key: 'dpo', label: 'DPO (zile datorii)', value: Math.round(DPO), unit: 'zile', target: 60 },
    { key: 'cash', label: 'Cash runway', value: cashRunwayMonths.toFixed(1), unit: 'luni', target: 3 },
    { key: 'cpd', label: 'Cost / zi spitalizare', value: Math.round(costPerInpatientDay), unit: 'lei', target: 280 },
    { key: 'cdrg', label: 'Cost / caz DRG', value: Math.round(costPerDRG), unit: 'lei', target: 1700 },
    { key: 'rev', label: 'Venituri luna curentă', value: fmt(demo.revenueActual), unit: 'lei' }
  ];

  return (
    <div className="card">
      <h3 className="h1" style={{ marginBottom: 8 }}>Indicatori financiari (DEMO)</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12
      }}>
        {kpis.map(k => {
          const numeric = typeof k.value === 'number' ? Number(k.value) : parseFloat(String(k.value).toString());
          const valForColor = k.isPercent ? parseFloat(String(k.value).toString().replace('%', '')) : (typeof k.value === 'number' ? k.value : numeric);
          const bg = k.target != null ? colorByTarget(Number(valForColor), k.target, !!k.invert) : '#ECF0F1';

          return (
            <div key={k.key} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              padding: 14,
              borderLeft: `6px solid ${bg}`
            }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0C1D32' }}>
                {typeof k.value === 'number' ? fmt(k.value) : k.value} {k.unit ? <span style={{ fontSize: 12, color: '#374151' }}>{k.unit}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
