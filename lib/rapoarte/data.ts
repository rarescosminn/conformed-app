import { createClient } from '@/lib/supabase/server';
import { Report } from '@/lib/reports';

export async function getRapoarteData(): Promise<Report[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!org) return [];

    const { data } = await supabase
        .from('rapoarte')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false });

    return (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.titlu,
        description: r.descriere ?? '',
        createdAt: r.created_at,
        author: r.autor ?? '',
        role: r.rol ?? 'Manager',
        sizeMb: r.size_mb ?? 0,
        type: r.tip ?? 'PDF',
        tags: r.tags ?? [],
        year: r.an ?? new Date(r.created_at).getFullYear(),
        month: r.luna ?? new Date(r.created_at).getMonth() + 1,
    }));
}