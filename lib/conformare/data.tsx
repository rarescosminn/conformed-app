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
        .select('domeniu, scor')
        .eq('org_id', org.id);

    if (!cerinte || cerinte.length === 0) return { domenii: [] };

    // Grupează pe domeniu și calculează scor mediu
    const map = new Map<string, number[]>();
    for (const c of cerinte) {
        if (!map.has(c.domeniu)) map.set(c.domeniu, []);
        map.get(c.domeniu)!.push(c.scor ?? 0);
    }

    const domenii = Array.from(map.entries()).map(([id, scoruri]) => ({
        id,
        titlu: id,
        scor: Math.round(scoruri.reduce((a, b) => a + b, 0) / scoruri.length),
        descriere: '',
    }));

    return { domenii };
}