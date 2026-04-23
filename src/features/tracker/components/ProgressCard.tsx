import React from 'react';
import { Flame, Trophy, Target } from 'lucide-react';

interface ProgressCardProps {
  completedCount: number;
  total: number;
  completionRate: number;
  streak: number;
  points: number;
  title?: string;
  description?: string;
}

export function ProgressCard({ completedCount, total, completionRate, streak, points, title = 'Общий прогресс', description = 'Карточка прогресса делает трекер понятным: видно темп, процент закрытия и учебную инерцию.' }: ProgressCardProps) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Выполнено {completedCount} из {total}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500" style={{ width: `${completionRate}%` }} /></div>
          <p className="mt-2 text-sm font-medium text-slate-700">{completionRate}% от всех задач уже закрыто</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Target className="h-4 w-4" />Всего</div><p className="mt-2 text-3xl font-semibold text-slate-950">{total}</p></div>
          <div className="rounded-3xl bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Flame className="h-4 w-4" />Streak</div><p className="mt-2 text-3xl font-semibold text-slate-950">{streak} дня</p></div>
          <div className="rounded-3xl bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Trophy className="h-4 w-4" />Баллы</div><p className="mt-2 text-3xl font-semibold text-slate-950">{points}</p></div>
        </div>
      </div>
    </section>
  );
}
