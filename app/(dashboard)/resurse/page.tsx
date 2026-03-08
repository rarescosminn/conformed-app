export const dynamic = 'force-dynamic';
import ResursePageClient from '@/components/resurse/ResursePageClient';
import { getResurseStats } from '@/lib/resurse/data';

export default async function ResursePage() {
    const stats = await getResurseStats();
    return <ResursePageClient stats={stats} />;
}