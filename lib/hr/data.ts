import { createClient } from '@/lib/supabase/server';

export async function getHrDashboardData() {
    const supabase = createClient();

    // Obține organizația curentă
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { summary: emptySummary(), rows: [], currentDomain: '' };
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) {
        return { summary: emptySummary(), rows: [], currentDomain: '' };
    }

    // Citește angajații din Supabase
    // Fetch departamente selectate la onboarding
    const { data: depts } = await supabase
        .from('departments')
        .select('nume')
        .eq('org_id', org.id)
        .eq('activ', true);

    const depturiActive = (depts ?? []).map((d: any) => d.nume);

    const { data: angajati } = await supabase
        .from('hr_angajati')
        .select('*')
        .eq('org_id', org.id)
        .eq('activ', true)
        .in('sectie', depturiActive.length > 0 ? depturiActive : ['__none__']);

    const rows = angajati ?? [];

    // Calculează summary
    const activFTE = rows.length;
    const idealLegal = rows.reduce((s: number, r: any) => s + (r.ideal_legal ?? 0), 0);
    const idealAjustat = rows.reduce((s: number, r: any) => s + (r.ideal_ajustat ?? 0), 0);
    const deficit = idealAjustat - activFTE;
    const respondenti = rows.filter((r: any) => r.respondent).length;
    const acoperireSondajPct = activFTE > 0 ? Math.round((respondenti / activFTE) * 100) : 0;

    const summary = { activFTE, idealLegal, idealAjustat, deficit, acoperireSondajPct };

    // Grupează pe secție/rol pentru tabel
    const grouped = groupRows(rows);

    const currentDomain = grouped[0]?.sectie ?? '';

    return { summary, rows: grouped, currentDomain };
}

function emptySummary() {
    return { activFTE: 0, idealLegal: 0, idealAjustat: 0, deficit: 0, acoperireSondajPct: 0 };
}

function groupRows(angajati: any[]) {
    const map = new Map<string, any>();

    for (const a of angajati) {
        const key = `${a.sectie}__${a.rol}`;
        if (!map.has(key)) {
            map.set(key, {
                sectie: a.sectie,
                rol: a.rol,
                idealLegal: a.ideal_legal ?? 0,
                idealAjustat: a.ideal_ajustat ?? 0,
                activREGES_FTE: 0,
                respondenti: 0,
                acoperirePct: 0,
                deficit: 0,
            });
        }
        const g = map.get(key);
        g.activREGES_FTE += 1;
        if (a.respondent) g.respondenti += 1;
    }

    for (const g of map.values()) {
        g.acoperirePct = g.activREGES_FTE > 0
            ? Math.round((g.respondenti / g.activREGES_FTE) * 100)
            : 0;
        g.deficit = g.idealAjustat - g.activREGES_FTE;
    }

    return Array.from(map.values());
}