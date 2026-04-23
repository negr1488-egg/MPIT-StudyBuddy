import type { TrackerRole } from '../../features/tracker/types/user';
import type { MockAccount, MockSession } from '../../features/tracker/types/auth';
import { getStoredJson, removeStoredValue, setStoredJson } from '../storage/localStorage';
import { supabaseAuthService } from '../supabase/auth.service';

const ACCOUNTS_KEY = 'studybuddy.accounts';
const SESSION_KEY = 'studybuddy.session';

const demoAccounts: MockAccount[] = [
  { id: 'demo-student', name: 'Артём', email: 'student@studybuddy.local', password: '123456', role: 'student' },
  { id: 'demo-teacher', name: 'Марина Сергеева', email: 'teacher@studybuddy.local', password: '123456', role: 'teacher' },
  { id: 'demo-parent', name: 'Ольга Петрова', email: 'parent@studybuddy.local', password: '123456', role: 'parent' },
];

function ensureDemoAccounts() {
  const accounts = getStoredJson<MockAccount[]>(ACCOUNTS_KEY, []);
  if (accounts.length === 0) {
    setStoredJson(ACCOUNTS_KEY, demoAccounts);
    return demoAccounts;
  }
  return accounts;
}

function toSession(account: MockAccount): MockSession {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };
}

export const sessionService = {
  mode: supabaseAuthService.isEnabled ? 'supabase' : 'demo',
  demoAccounts,

  async restoreSession() {
    if (supabaseAuthService.isEnabled) {
      return supabaseAuthService.restoreSession();
    }

    return getStoredJson<MockSession | null>(SESSION_KEY, null);
  },

  getAccounts() {
    return ensureDemoAccounts();
  },

  async signIn(email: string, password: string) {
    if (supabaseAuthService.isEnabled) {
      return supabaseAuthService.signIn(email, password);
    }

    const accounts = ensureDemoAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts.find((item) => item.email.toLowerCase() === normalizedEmail && item.password === password);
    if (!account) {
      throw new Error('Не удалось войти. Проверь email и пароль.');
    }

    const session = toSession(account);
    setStoredJson(SESSION_KEY, session);
    return session;
  },

  async signUp(input: { name: string; email: string; password: string; role: TrackerRole | null }) {
    if (supabaseAuthService.isEnabled) {
      return supabaseAuthService.signUp(input);
    }

    const accounts = ensureDemoAccounts();
    const normalizedEmail = input.email.trim().toLowerCase();
    if (accounts.some((item) => item.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Аккаунт с таким email уже существует.');
    }

    const nextAccount: MockAccount = {
      id: globalThis.crypto?.randomUUID?.() ?? `account-${Date.now()}`,
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      role: input.role,
    };

    const nextAccounts = [nextAccount, ...accounts];
    setStoredJson(ACCOUNTS_KEY, nextAccounts);
    const session = toSession(nextAccount);
    setStoredJson(SESSION_KEY, session);
    return session;
  },

  async updateRole(role: TrackerRole, session: MockSession | null) {
    if (supabaseAuthService.isEnabled) {
      return supabaseAuthService.updateRole(role);
    }

    if (!session) return null;
    const accounts = ensureDemoAccounts().map((item) => (item.id === session.id ? { ...item, role } : item));
    setStoredJson(ACCOUNTS_KEY, accounts);
    const nextSession = { ...session, role };
    setStoredJson(SESSION_KEY, nextSession);
    return nextSession;
  },

  async signOut() {
    if (supabaseAuthService.isEnabled) {
      await supabaseAuthService.signOut();
      return;
    }

    removeStoredValue(SESSION_KEY);
  },
};
