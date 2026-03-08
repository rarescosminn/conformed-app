export const dynamic = 'force-dynamic';
import SsmPsiPageClient from '@/components/ssmpsi/SsmPsiPageClient';
import { getSsmPsiDashboardData } from '@/lib/ssmpsi/data';

export default async function SsmPsiPage() {
    const data = await getSsmPsiDashboardData();
    return <SsmPsiPageClient agg={data} />;
}