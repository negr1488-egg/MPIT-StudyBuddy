import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  BellRing,
  AlertTriangle,
  KeyRound,
  Copy,
} from 'lucide-react';
import { TaskList } from '../components/TaskList';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIChat } from '../components/AIChat';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { useTasks } from '../hooks/useTasks';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import { useStudentAchievements } from '../hooks/useStudentAchievements';

function getRiskStyles(risk: 'low' | 'medium' | 'high') {
  switch (risk) {
    case 'high':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
}

export function StudentDashboardPage() {
  const tasksApi = useTasks();
  const { session } = useSupabaseSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const notifications = useMemo(
    () => tasksApi.getNotificationsForRole('student'),
    [tasksApi]
  );

  const insights = useMemo(
    () => tasksApi.getAiInsightsForRole('student'),
    [tasksApi]
  );

  const adaptiveReminders = useMemo(
    () => tasksApi.adaptiveReminders ?? [],
    [tasksApi]
  );

  const topReminder = adaptiveReminders[0] ?? null;
  const inviteCode = session?.inviteCode ?? '';
  const achievementsApi = useStudentAchievements(session?.id, tasksApi.tasks, tasksApi.stats);

  const tasksWaitingReview = useMemo(() => {
    return tasksApi.tasks.filter((task) => task.status === 'done' && !task.checkedAt);
  }, [tasksApi.tasks]);

  const tasksCompletedFinal = useMemo(() => {
    return tasksApi.tasks.filter((task) => task.status === 'done' && Boolean(task.checkedAt));
  }, [tasksApi.tasks]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyMessage('Код скопирован');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage('Не удалось скопировать код');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        {/* ... шапка без изменений ... */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              Личный кабинет ученика
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Управляй учебными задачами без хаоса
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Добавляй задания, отмечай выполнение, отправляй решения и держи под контролем
              свой прогресс.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Добавить задачу
              </button>
            </div>
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-[28px] bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Всего задач</div>
              <div className="mt-2 text-3xl font-semibold">{tasksApi.stats.total}</div>
            </div>
            <div className="rounded-[28px] bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Выполнено</div>
              <div className="mt-2 text-3xl font-semibold">{tasksApi.stats.completedCount}</div>
            </div>
            <div className="rounded-[28px] bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Баллы</div>
              <div className="mt-2 text-3xl font-semibold">{tasksApi.stats.points}</div>
            </div>
            <div className="rounded-[28px] bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Серия</div>
              <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
                <Flame className="h-7 w-7" />
                {tasksApi.stats.streak}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Код привязки */}
      <section className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-950">Код для привязки учителя</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Передай этот код учителю, чтобы он мог привязать тебя к своему кабинету и назначать задания.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex min-h-[52px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold tracking-[0.18em] text-slate-900">
            {inviteCode || 'Код недоступен'}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!inviteCode}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="mr-2 h-4 w-4" />
            Скопировать код
          </button>
          {copyMessage && <div className="text-sm text-slate-600">{copyMessage}</div>}
        </div>
      </section>

      {tasksApi.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {tasksApi.error}
        </div>
      )}

      {/* Прогресс + подсказки */}
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-950">Твой прогресс</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Процент выполнения</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {tasksApi.stats.completionRate}%
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">В процессе</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {tasksApi.stats.inProgressCount}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Просрочено</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {tasksApi.stats.overdueCount}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-950">Подсказки</h2>
          </div>
          <div className="mt-4 space-y-3">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-3xl border border-violet-100 bg-violet-50 p-4"
                >
                  <div className="text-sm font-medium text-violet-900">{insight.title}</div>
                  <div className="mt-1 text-sm leading-6 text-violet-800">
                    {insight.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
                Пока подсказок нет.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Адаптивные напоминания + уведомления */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-950">Адаптивные напоминания</h2>
          </div>
          <div className="mt-4 space-y-3">
            {topReminder ? (
              <div className={`rounded-3xl border p-4 ${getRiskStyles(topReminder.risk)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{topReminder.title}</div>
                    <div className="mt-2 text-sm leading-6">{topReminder.message}</div>
                  </div>
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                </div>
                <div className="mt-3 text-xs opacity-80">
                  Следующее напоминание: {topReminder.nextReminderLabel}
                </div>
                {topReminder.shouldNotifyParent && (
                  <div className="mt-2 text-xs font-medium">
                    При дальнейшем игнорировании будет сигнал родителю
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
                Активных напоминаний нет.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur lg:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-950">Уведомления по задачам</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {adaptiveReminders.length > 0 ? (
              adaptiveReminders.slice(0, 4).map((item) => (
                <div
                  key={item.taskId}
                  className={`rounded-3xl border p-4 ${getRiskStyles(item.risk)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="mt-1 text-sm leading-6">{item.message}</div>
                    </div>
                    <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                      {item.nextReminderLabel}
                    </div>
                  </div>
                </div>
              ))
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div key={item.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
                Новых уведомлений нет.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Достижения ученика */}
      <AchievementsPanel
        achievements={achievementsApi.achievements}
        savedAchievements={achievementsApi.savedAchievements}
        isLoading={achievementsApi.isLoading}
        error={achievementsApi.error}
      />

      {/* AI‑чат */}
      <section className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
        <AIChat />
      </section>

      {/* Списки задач */}
      <TaskList
        title="Сегодня"
        description="Ближайшие дедлайны, которые лучше не откладывать."
        tasks={tasksApi.groupedTasks.today}
        emptyText="На сегодня задач нет. Можно перейти к блоку «Скоро» и сделать запас."
        isLoading={tasksApi.isLoading}
        onStatusChange={tasksApi.updateTaskStatus}
        onSubmitSolution={tasksApi.submitSolution}
        onRequestHelp={tasksApi.requestTeacherHelp}
        onEdit={tasksApi.editTask}
        onDelete={tasksApi.removeTask}
      />

      <TaskList
        title="Скоро"
        description="Задачи, до дедлайна которых ещё есть время."
        tasks={tasksApi.groupedTasks.soon}
        emptyText="Ближайших задач пока нет."
        isLoading={tasksApi.isLoading}
        onStatusChange={tasksApi.updateTaskStatus}
        onSubmitSolution={tasksApi.submitSolution}
        onRequestHelp={tasksApi.requestTeacherHelp}
        onEdit={tasksApi.editTask}
        onDelete={tasksApi.removeTask}
      />

      <TaskList
        title="Просрочено"
        description="Задачи, требующие срочного внимания."
        tasks={tasksApi.groupedTasks.overdue}
        emptyText="Просроченных задач нет — отличный результат."
        isLoading={tasksApi.isLoading}
        onStatusChange={tasksApi.updateTaskStatus}
        onSubmitSolution={tasksApi.submitSolution}
        onRequestHelp={tasksApi.requestTeacherHelp}
        onEdit={tasksApi.editTask}
        onDelete={tasksApi.removeTask}
      />

      <section className="rounded-[30px] border border-amber-200 bg-amber-50/60 p-1">
        <TaskList
          title="Отправлено на проверку"
          description="Эти задачи уже выполнены тобой и сейчас ждут проверки учителя."
          tasks={tasksWaitingReview}
          emptyText="Пока нет задач, отправленных на проверку."
          isLoading={tasksApi.isLoading}
          onStatusChange={tasksApi.updateTaskStatus}
          onSubmitSolution={tasksApi.submitSolution}
        onRequestHelp={tasksApi.requestTeacherHelp}
          onEdit={tasksApi.editTask}
          onDelete={tasksApi.removeTask}
        />
      </section>

      <section className="rounded-[30px] border border-emerald-200 bg-emerald-50/60 p-1">
        <TaskList
          title="Завершено"
          description="Полностью закрытые и уже проверенные задачи."
          tasks={tasksCompletedFinal}
          emptyText="Пока нет полностью завершённых задач."
          isLoading={tasksApi.isLoading}
          onStatusChange={tasksApi.updateTaskStatus}
          onSubmitSolution={tasksApi.submitSolution}
        onRequestHelp={tasksApi.requestTeacherHelp}
          onEdit={tasksApi.editTask}
          onDelete={tasksApi.removeTask}
        />
      </section>

      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={tasksApi.addTask}
        defaultCreatedBy="student"
      />
    </div>
  );
}
