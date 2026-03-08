export const dynamic = 'force-dynamic';
import ConformarePageClient from '@/components/conformare/ConformarePageClient';
import { getConformareData } from '@/lib/conformare/data';

export default async function ConformarePage() {
    const data = await getConformareData();
    return <ConformarePageClient domeniiDB={data.domenii} />;
}