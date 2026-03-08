export const dynamic = 'force-dynamic';
import RapoartePageClient from '@/components/rapoarte/RapoartePageClient';
import { getRapoarteData } from '@/lib/rapoarte/data';

export default async function RapoartePage() {
    const rapoarte = await getRapoarteData();
    return <RapoartePageClient rapoarteDB={rapoarte} />;
}