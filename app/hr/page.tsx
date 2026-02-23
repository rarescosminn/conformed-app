// app/hr/page.tsx
import HrPageClient from "../../components/hr/HrPageClient";
import { getHrDashboardData } from "../../lib/hr/data";

export default async function HrPage() {
    const data = await getHrDashboardData();
    return (
        <HrPageClient
            summary={data.summary}
            rows={data.rows}
            currentDomain={data.currentDomain}
        />
    );
}
