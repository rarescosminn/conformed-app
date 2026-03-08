import { createClient } from '@/lib/supabase/server';

export async function getSetariData() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { onboardingDone: false };

    const { data: org } = await supabase
        .from('organizations')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

    return {
        onboardingDone: !!org?.onboarding_completed,
    };
}