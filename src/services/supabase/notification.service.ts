import { hasSupabaseEnv } from '../../shared/config/env';
import { requireSupabase } from './client';

export const supabaseNotificationService = {
  isEnabled: hasSupabaseEnv,

  async listNotifications(profileId: string) {
    const client = requireSupabase();
    const { data, error } = await client.from('notifications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async markAsRead(notificationId: string) {
    const client = requireSupabase();
    const { error } = await client.from('notifications').update({ is_read: true }).eq('id', notificationId);
    if (error) throw error;
  },
};
