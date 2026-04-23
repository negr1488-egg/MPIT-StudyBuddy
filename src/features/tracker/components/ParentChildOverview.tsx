import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';
import type { Task } from '../types/task';

interface ParentChildOverviewProps {
  childName: string;
  progressRate: number;
  completedCount: number;
  overdueCount: number;
  totalCount: number;
  problematicTasks: Task[];
}

export function ParentChildOverview({ childName, progressRate, completedCount, overdueCount, totalCount, problematicTasks }: ParentChildOverviewProps) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ребёнок</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 md:text-3xl">{childName}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">В этом блоке собраны ключевые показатели по ребёнку: общий прогресс, завершённые задачи и дедлайны, где нужен контроль.</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Общий прогресс</p>
          <p className="mt-2 text-3xl font-semibold">{progressRate}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><TrendingUp className="h-4 w-4" />Всего задач</div><p className="mt-2 text-3xl font-semibold text-slate-950">{totalCount}</p></div>
        <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" />Выполнено</div><p className="mt-2 text-3xl font-semibold text-slate-950">{completedCount}</p></div>
        <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><AlertTriangle className="h-4 w-4" />Просрочки</div><p className="mt-2 text-3xl font-semibold text-slate-950">{overdueCount}</p></div>
        <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4" />Проблемных задач</div><p className="mt-2 text-3xl font-semibold text-slate-950">{problematicTasks.length}</p></div>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Список проблемных задач</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">Сюда попадают просрочки и задачи с повышенным риском, где уже есть игнорированные напоминания.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">{problematicTasks.length}</span>
        </div>

        {problematicTasks.length > 0 ? (
          <div className="mt-4 space-y-3">
            {problematicTasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.subject ?? 'Без предмета'}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{task.status === 'overdue' ? 'Просрочено' : 'Нужен контроль'}</p>
                    {typeof task.reminderMissedCount === 'number' && task.reminderMissedCount > 0 && <p className="mt-1 text-rose-600">Пропущено напоминаний: {task.reminderMissedCount}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">Сейчас проблемных задач нет. Это значит, что критичных сигналов по ребёнку не обнаружено.</div>
        )}
      </div>
    </section>
  );
}
