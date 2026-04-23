import { useEffect, useMemo, useState } from 'react';
import type { MockAccount, MockSession } from '../types/auth';
import type { TrackerRole } from '../types/user';
import { sessionService } from '../../../services/auth/session.service';

export function useMockSession() {
  const [accounts] = useState<MockAccount[]>(sessionService.getAccounts());
  const [session, setSession] = useState<MockSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    sessionService
      .restoreSession()
      .then((nextSession) => {
        if (isMounted) {
          setSession(nextSession);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const nextSession = await sessionService.signIn(email, password);
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось войти.');
      return null;
    }
  };

  const register = async (input: { name: string; email: string; password: string; role: TrackerRole | null }) => {
    try {
      const nextSession = await sessionService.signUp(input);
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось создать аккаунт.');
      return null;
    }
  };

  const selectRole = async (role: TrackerRole) => {
    try {
      const nextSession = await sessionService.updateRole(role, session);
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось обновить роль.');
      return null;
    }
  };

  const logout = async () => {
    await sessionService.signOut();
    setSession(null);
    setError('');
  };

  const resetError = () => {
    setError('');
  };

  const helpers = useMemo(
    () => ({
      hasSession: Boolean(session),
      needsRoleSelection: Boolean(session && !session.role),
      demoAccounts: sessionService.demoAccounts,
      mode: sessionService.mode,
    }),
    [session],
  );

  return {
    accounts,
    session,
    isLoading,
    error,
    helpers,
    login,
    register,
    selectRole,
    logout,
    resetError,
  };
}

export type UseMockSessionResult = ReturnType<typeof useMockSession>;
