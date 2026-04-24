import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';
import type { AchievementSavePayload, StudentAchievementRow } from '../types/achievement';

export const studentAchievementsApi = {
  async getByStudent(profileId: string): Promise<StudentAchievementRow[]> {
    if (!isSupabaseEnabled || !supabase) return [];

    const { data, error } = await supabase
      .from('student_achievements')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as StudentAchievementRow[]) ?? [];
  },

  async upsertMany(profileId: string, achievements: AchievementSavePayload[]): Promise<void> {
    if (!isSupabaseEnabled || !supabase || achievements.length === 0) return;

    const rows = achievements.map((achievement) => ({
      profile_id: profileId,
      ...achievement,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('student_achievements')
      .upsert(rows, { onConflict: 'profile_id,achievement_key' });

    if (error) throw error;
  },
};
