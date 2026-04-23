import { hasSupabaseEnv } from '../../shared/config/env';
import { requireSupabase } from './client';

export const supabaseAnalyticsService = {
  isEnabled: hasSupabaseEnv,

  async listAiInsights(profileId: string) {
    const client = requireSupabase();
    const { data, error } = await client.from('ai_insights').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
