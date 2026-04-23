import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';
import type { TrackerRole } from '../types/user';

type Mode = 'supabase' | 'demo';

export interface MockAccountLike {
  id: string;
  name: string;
  email: string;
  role: TrackerRole;
  password: string;
}

export interface SupabaseSessionLike {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: TrackerRole | null;
  inviteCode: string | null;
}

export interface MockSessionLike {
  id: string;
  name: string;
  email: string;
  role: TrackerRole | null;
  inviteCode: string | null;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: TrackerRole | null;
}

export function useSupabaseSession() {
  const [session, setSession] = useState<SupabaseSessionLike | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const resetError = useCallback(() => setError(''), []);

  const toMockSession = useCallback(
    (value: SupabaseSessionLike | null): MockSessionLike | null => {
      if (!value) return null;
      return {
        id: value.id,
        name: value.name,
        email: value.email,
        role: value.role,
        inviteCode: value.inviteCode,
      };
    },
    []
  );

  const loadProfile = useCallback(async (userId: string, email?: string | null) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, invite_code')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      const fullName = data?.full_name ?? '';
      return {
        id: data?.id ?? userId,
        name: fullName,
        fullName,
        email: email ?? '',
        role: data?.role ?? null,
        inviteCode: data?.invite_code ?? null,
      } satisfies SupabaseSessionLike;
    } catch (err) {
      console.error('loadProfile error:', err);
      return {
        id: userId,
        name: '',
        fullName: '',
        email: email ?? '',
        role: null,
        inviteCode: null,
      };
    }
  }, []);

  // Принудительный сброс загрузки через 5 секунд
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Forcing isLoading to false after 5 seconds');
        setIsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(forceTimeout);
  }, [isLoading]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const init = async () => {
      if (!isSupabaseEnabled || !supabase) {
        console.log('Supabase disabled or client missing');
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (authSession?.user) {
          const profile = await loadProfile(authSession.user.id, authSession.user.email);
          if (mounted) setSession(profile);
        }
      } catch (err) {
        console.error('Init session error:', err);
        setError(err instanceof Error ? err.message : 'Ошибка инициализации');
      } finally {
        if (mounted) setIsLoading(false);
      }

      authSubscription = supabase.auth.onAuthStateChange(async (event, authSession) => {
        console.log('Auth state change:', event);
        if (!mounted) return;
        if (!authSession?.user) {
          setSession(null);
          return;
        }
        try {
          const profile = await loadProfile(authSession.user.id, authSession.user.email);
          setSession(profile);
        } catch (err) {
          console.error('Auth change profile error:', err);
        }
      });
    };

    init();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) return null;
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return toMockSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, toMockSession]);

  const register = useCallback(async ({ name, email, password, role }: RegisterInput) => {
    if (!supabase) return null;
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('User not created');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, full_name: name, role });
      if (profileError) throw profileError;
      return toMockSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, toMockSession]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка выхода');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRole = useCallback(async (role: TrackerRole) => {
    if (!supabase || !session) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', session.id)
        .select('id, full_name, role, invite_code')
        .maybeSingle();
      if (error) throw error;
      const updated = {
        ...session,
        role,
        name: data?.full_name ?? session.name,
        fullName: data?.full_name ?? session.fullName,
        inviteCode: data?.invite_code ?? session.inviteCode,
      };
      setSession(updated);
      return toMockSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка смены роли');
      return null;
    }
  }, [session, toMockSession]);

  const accounts = useMemo<MockAccountLike[]>(() => {
    if (!session?.role) return [];
    return [{ id: session.id, name: session.name, email: session.email, role: session.role, password: '' }];
  }, [session]);

  const helpers = useMemo(() => ({
    hasSession: Boolean(session),
    needsRoleSelection: Boolean(session && !session.role),
    demoAccounts: accounts,
    mode: (isSupabaseEnabled ? 'supabase' : 'demo') as Mode,
  }), [accounts, session]);

  return {
    accounts,
    session: toMockSession(session),
    isLoading,
    error,
    helpers,
    login,
    register,
    logout,
    selectRole,
    restoreSession: async () => toMockSession(session),
    resetError,
  };
}