import { hasSupabaseEnv } from '../../shared/config/env';
import { requireSupabase } from './client';
import type { TrackerRole } from '../../features/tracker/types/user';
import type { MockSession } from '../../features/tracker/types/auth';

async function mapSession() {
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await client
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single();

  const nextSession: MockSession = {
    id: session.user.id,
    name: profile?.full_name ?? session.user.user_metadata.full_name ?? session.user.email ?? 'User',
    email: session.user.email ?? '',
    role: (profile?.role as TrackerRole | null) ?? null,
  };

  return nextSession;
}

export const supabaseAuthService = {
  isEnabled: hasSupabaseEnv,

  async restoreSession() {
    return mapSession();
  },

  async signIn(email: string, password: string) {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return mapSession();
  },

  async signUp(input: { name: string; email: string; password: string; role: TrackerRole | null }) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name,
        },
      },
    });

    if (error) throw error;
    const user = data.user;

    if (!user) {
      return null;
    }

    if (input.role) {
      await client.from('profiles').upsert({
        id: user.id,
        full_name: input.name,
        role: input.role,
      });
    }

    return mapSession();
  },

  async updateRole(role: TrackerRole) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return null;
    }

    await client.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata.full_name ?? user.email ?? 'User',
      role,
    });

    return mapSession();
  },

  async signOut() {
    const client = requireSupabase();
    await client.auth.signOut();
  },
};
