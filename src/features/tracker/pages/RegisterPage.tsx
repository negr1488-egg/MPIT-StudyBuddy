import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { UseMockSessionResult } from '../hooks/useMockSession';
import type { TrackerRole } from '../types/user';

interface RegisterPageProps {
  auth: UseMockSessionResult;
  onNavigate: (path: string) => void;
}

export function RegisterPage({ auth, onNavigate }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<TrackerRole | ''>('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    auth.resetError();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setLocalError('Заполни имя, email и пароль.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают.');
      return;
    }

    setIsSubmitting(true);
    const session = await auth.register({
      name,
      email,
      password,
      role: role || null,
    });
    setIsSubmitting(false);

    if (!session) {
      return;
    }

    setLocalError('');

    if (!session.role) {
      onNavigate('/onboarding/role');
      return;
    }

    onNavigate(`/app/${session.role}`);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <p className="text-sm text-slate-500">Регистрация</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Создать аккаунт</h1>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-800">Имя</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Например: Артём"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-800">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Минимум 6 символов"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Подтверждение пароля</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Повтори пароль"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-800">Выбор роли</label>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {[
                { id: 'student', label: 'Ученик' },
                { id: 'teacher', label: 'Учитель' },
                { id: 'parent', label: 'Родитель' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id as TrackerRole)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    role === item.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Можно оставить роль пустой и выбрать ее на следующем шаге.</p>
          </div>
          {(localError || auth.error) && <div className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{localError || auth.error}</div>}
          <div className="md:col-span-2">
            <button
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-300"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(37,99,235,0.84),rgba(124,58,237,0.78))] p-6 text-white shadow-[0_25px_70px_rgba(37,99,235,0.16)] md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-100/80">StudyBuddy onboarding</p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight">Новый вход в школьный процесс</h2>
        <p className="mt-4 text-sm leading-7 text-slate-100/90 md:text-base">
          После регистрации пользователь сразу попадает в свой кабинет: ученик — к задачам, учитель — к назначению и контролю, родитель — к прогрессу и сигналам.
        </p>
        <div className="mt-6 grid gap-4">
          {[
            'Ученик получает понятный поток задач и дедлайнов.',
            'Учитель видит статусы и создает задания в одном месте.',
            'Родитель получает сигналы без перегруза лишней информацией.',
          ].map((item) => (
            <div key={item} className="rounded-3xl bg-white/12 p-4 text-sm leading-7">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
