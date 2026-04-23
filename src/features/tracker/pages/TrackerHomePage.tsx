import React from 'react';
import { ArrowRight, BellRing, BrainCircuit, ChartColumnBig, CheckCircle2, Users } from 'lucide-react';

interface TrackerHomePageProps {
  stats: {
    total: number;
    completedCount: number;
    overdueCount: number;
    completionRate: number;
  };
  onNavigate: (path: string) => void;
}

const features = [
  {
    title: 'Фиксация задач',
    text: 'Задания собираются в одном модуле, а не теряются между чатами, устными сообщениями и дневником.',
    icon: CheckCircle2,
  },
  {
    title: 'Напоминания по срокам',
    text: 'Трекер поднимает наверх задачи на сегодня и просрочки, чтобы быстро заметить риск.',
    icon: BellRing,
  },
  {
    title: 'Связка ролей',
    text: 'Ученик, учитель и родитель видят один и тот же процесс с разной глубиной доступа.',
    icon: Users,
  },
  {
    title: 'Расширение через ИИ',
    text: 'Умная заглушка уже умеет разбирать текст задания и подготавливает базу для будущей LLM-логики.',
    icon: BrainCircuit,
  },
];

export function TrackerHomePage({ stats, onNavigate }: TrackerHomePageProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Tracker MVP</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
          Изолированный модуль, который можно показать на защите уже сегодня
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          Модуль не ломает остальную кодовую базу и закрывает суть кейса: задачи, дедлайны, прогресс, связь ролей и умный ввод задания текстом.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Всего задач</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Выполнено</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.completedCount}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Просрочено</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.overdueCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('/tracker/student')}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Открыть экран ученика
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <button
            onClick={() => onNavigate('/tracker/teacher')}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Открыть экран учителя
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <ChartColumnBig className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Что уже закрыто</h3>
            <p className="text-sm text-slate-500">Структура для MVP и для следующего шага с Supabase.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-950">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
