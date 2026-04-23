import React, { useEffect, useState } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import type { UseMockSessionResult } from '../hooks/useMockSession';

interface LoginPageProps {
  auth: UseMockSessionResult;
  onNavigate: (path: string) => void;
}

export function LoginPage({ auth, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('student@studybuddy.local');
  const [password, setPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    auth.resetError();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const session = await auth.login(email, password);
    setIsSubmitting(false);

    if (!session) {
      return;
    }

    if (!session.role) {
      onNavigate('/onboarding/role');
      return;
    }

    onNavigate(`/app/${session.role}`);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.92fr]">
      <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(37,99,235,0.98),rgba(124,58,237,0.86))] p-6 text-white shadow-[0_25px_70px_rgba(37,99,235,0.16)] md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-100/80">StudyBuddy login</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">Вход в сервис</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-100/90 md:text-base">
          {auth.helpers.mode === 'supabase'
            ? 'Активен Supabase-режим. После входа сессия восстанавливается из backend и пользователь попадает в свой кабинет.'
            : 'Для демо можно использовать готовые аккаунты ученика, учителя и родителя. После входа система ведет пользователя сразу в его кабинет.'}
        </p>
        {auth.helpers.mode === 'demo' && (
          <div className="mt-6 space-y-3">
            {auth.helpers.demoAccounts.map((account) => (
              <div key={account.id} className="rounded-3xl bg-white/12 p-4 text-sm">
                <p className="font-semibold">{account.name}</p>
                <p className="mt-1 text-slate-100/85">{account.email}</p>
                <p className="mt-1 text-slate-100/85">Пароль: 123456</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <div className="mb-6">
          <p className="text-sm text-slate-500">Авторизация</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Войти</h2>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-800">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="student@studybuddy.local"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="123456"
            />
          </div>
          {auth.error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{auth.error}</div>}
          <button
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <button
          onClick={() => onNavigate('/register')}
          className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 transition hover:text-blue-800"
        >
          Нет аккаунта? Зарегистрироваться
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </section>
    </div>
  );
}
