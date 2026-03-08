import { createClient } from '@/lib/supabase/server';

export async function getSsmPsiDashboardData() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return emptyData();

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) return emptyData();

    const orgId = org.id;
    const now = new Date();
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const in60 = new Date(); in60.setDate(in60.getDate() + 60);

    // EIP
    const { data: eip } = await supabase
        .from('ssm_eip')
        .select('id, data_expirare')
        .eq('org_id', orgId);

    const eipTotal = (eip ?? []).length;
    const eipExp30 = (eip ?? []).filter((i: any) =>
        i.data_expirare && new Date(i.data_expirare) <= in30
    ).length;

    // Evacuări
    const { data: evacuari } = await supabase
        .from('psi_evacuari')
        .select('*')
        .eq('org_id', orgId)
        .order('data_planificata', { ascending: true });

    const upcoming = (evacuari ?? []).find((e: any) =>
        new Date(e.data_planificata) >= now
    ) ?? null;

    // Avize
    const { data: avize } = await supabase
        .from('mediu_contracte')
        .select('id, valabil_pana')
        .eq('org_id', orgId);

    const avizeTotal = (avize ?? []).length;
    const avizeExp60 = (avize ?? []).filter((a: any) =>
        a.valabil_pana && new Date(a.valabil_pana) <= in60
    ).length;

    // Riscuri
    const { data: riscuri } = await supabase
        .from('ssm_riscuri')
        .select('id, status, termen')
        .eq('org_id', orgId);

    const riscuriDeschise = (riscuri ?? []).filter((r: any) => r.status !== 'inchis').length;
    const riscuriIntarziate = (riscuri ?? []).filter((r: any) =>
        r.termen && new Date(r.termen) < now && r.status !== 'inchis'
    ).length;

    // Documente
    const { data: documente } = await supabase
        .from('documente')
        .select('id, created_at')
        .eq('org_id', orgId);

    const docTotal = (documente ?? []).length;
    const in30past = new Date(); in30past.setDate(in30past.getDate() - 30);
    const docRecent = (documente ?? []).filter((d: any) =>
        d.created_at && new Date(d.created_at) >= in30past
    ).length;

    return {
        eip: { total: eipTotal, exp30: eipExp30 },
        evacuari: { upcoming },
        avize: { total: avizeTotal, exp60: avizeExp60 },
        permise: { activeAzi: 0 },
        riscuri: { deschise: riscuriDeschise, intarziate: riscuriIntarziate },
        audite: { viitoare: 0, nc: 0 },
        documente: { total: docTotal, recent: docRecent },
        kpi: { total: 0, recent: 0 },
    };
}

function emptyData() {
    return {
        eip: { total: 0, exp30: 0 },
        evacuari: { upcoming: null },
        avize: { total: 0, exp60: 0 },
        permise: { activeAzi: 0 },
        riscuri: { deschise: 0, intarziate: 0 },
        audite: { viitoare: 0, nc: 0 },
        documente: { total: 0, recent: 0 },
        kpi: { total: 0, recent: 0 },
    };
}