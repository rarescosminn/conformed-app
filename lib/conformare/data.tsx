import { createClient } from '@/lib/supabase/server';

export async function getConformareData() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { domenii: [] };

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) return { domenii: [] };

    const { data: cerinte } = await supabase
        .from('conformare_cerinte')
        .select('domeniu, status, titlu, standard')
        .eq('org_id', org.id);

    if (!cerinte || cerinte.length === 0) return { domenii: [] };

    // Grupează pe domeniu și calculează scor real din status
    const map = new Map<string, { total: number; conforme: number }>();
    for (const c of cerinte) {
        if (!map.has(c.domeniu)) map.set(c.domeniu, { total: 0, conforme: 0 });
        const g = map.get(c.domeniu)!;
        g.total++;
        if (c.status === 'conform') g.conforme++;
    }

    const domenii = Array.from(map.entries()).map(([id, { total, conforme }]) => ({
        id,
        titlu: id,
        scor: total > 0 ? Math.round((conforme / total) * 100) : 0,
        total,
        conforme,
        neconforme: total - conforme,
        descriere: '',
    }));

    return { domenii };
}