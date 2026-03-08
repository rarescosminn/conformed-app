import { createClient } from '@/lib/supabase/server';

export async function getAprobariData() {
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
        .from('aprobari')
        .select('*')
        .eq('org_id', org.id)
        .order('submitted_at', { ascending: false });

    return (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.titlu,
        kind: r.tip,
        category: r.categorie,
        status: r.status,
        submittedBy: r.submitted_by ?? '',
        assignee: r.assignee ?? '',
        submittedAt: r.submitted_at,
        dueAt: r.due_at,
        history: r.history ?? [],
        archiveAt: r.archive_at,
        refId: null,
        authors: [],
        baseVersion: null,
        proposedVersion: null,
        changeSummary: null,
        requestType: null,
        justification: null,
        previewUrl: null,
        downloadUrl: null,
    }));
}