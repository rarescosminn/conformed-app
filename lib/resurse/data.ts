import { createClient } from '@/lib/supabase/server';

export async function getResurseStats(): Promise<Record<string, number>> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) return {};

    const { data } = await supabase
        .from('documente')
        .select('categorie')
        .eq('org_id', org.id);

    const counts: Record<string, number> = {};
    for (const d of data ?? []) {
        counts[d.categorie] = (counts[d.categorie] ?? 0) + 1;
    }
    return counts;
}