import { createClient } from '@/lib/supabase/server';

export async function getChestionareStats() {
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
        .from('chestionare_generic')
        .select('categorie, id')
        .eq('org_id', org.id)
        .eq('activ', true);

    // { slug: count }
    const counts: Record<string, number> = {};
    for (const c of data ?? []) {
        counts[c.categorie] = (counts[c.categorie] ?? 0) + 1;
    }

    return counts;
}