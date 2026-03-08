import { createClient } from '@/lib/supabase/server';

export async function getMediuDashboardData() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return emptyData();

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) return emptyData();

    const azi = new Date().toISOString().slice(0, 10);

    // Deșeuri azi
    const { data: deseuri } = await supabase
        .from('mediu_deseuri')
        .select('*')
        .eq('org_id', org.id)
        .eq('data', azi);

    const totalKgAzi = (deseuri ?? []).reduce(
        (acc: number, s: any) => acc + (s.kg_estimat ?? 0), 0
    );
    const needValidate = (deseuri ?? []).filter((s: any) => !s.validat).length;

    // Contracte
    const { data: contracte } = await supabase
        .from('mediu_contracte')
        .select('*')
        .eq('org_id', org.id);

    const today = new Date();
    const in60 = new Date();
    in60.setDate(in60.getDate() + 60);

    let exp60 = 0, expirate = 0, faraScan = 0;
    for (const c of contracte ?? []) {
        if (!c.scan_url) faraScan++;
        if (!c.valabil_pana) continue;
        const end = new Date(c.valabil_pana);
        if (end < today) expirate++;
        else if (end <= in60) exp60++;
    }

    return {
        deseuri: { totalKgAzi: Math.round(totalKgAzi * 10) / 10, needValidate },
        contracte: { total: (contracte ?? []).length, exp60, expirate, faraScan },
        locked: false,
    };
}

function emptyData() {
    return {
        deseuri: { totalKgAzi: 0, needValidate: 0 },
        contracte: { total: 0, exp60: 0, expirate: 0, faraScan: 0 },
        locked: false,
    };
}