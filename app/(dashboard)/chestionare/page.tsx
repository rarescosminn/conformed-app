export const dynamic = 'force-dynamic';
import ChestionarePageClient from '@/components/chestionare/ChestionarePageClient';
import { getChestionareStats } from '@/lib/chestionare/data';

export default async function ChestionarePage() {
    const stats = await getChestionareStats();
    return <ChestionarePageClient stats={stats} />;
}