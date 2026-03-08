export const dynamic = 'force-dynamic';
import SetariPageClient from '@/components/setari/SetariPageClient';
import { getSetariData } from '@/lib/setari/data';

export default async function SetariPage() {
    const data = await getSetariData();
    return <SetariPageClient onboardingDoneDB={data.onboardingDone} />;
}