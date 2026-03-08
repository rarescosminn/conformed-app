export const dynamic = 'force-dynamic';
import MediuPageClient from '@/components/mediu/MediuPageClient';
import { getMediuDashboardData } from '@/lib/mediu/data';

export default async function MediuPage() {
    const data = await getMediuDashboardData();
    return (
        <MediuPageClient
            deseuri={data.deseuri}
            contracte={data.contracte}
            locked={data.locked}
        />
    );
}