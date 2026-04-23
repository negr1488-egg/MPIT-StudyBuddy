import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ClipboardCheck,
  Sparkles,
  BarChart3,
  Users,
} from 'lucide-react';
import { TaskList } from '../components/TaskList';
import { ParentLinkCard } from '../components/ParentLinkCard';
import { useParentLinks } from '../hooks/useParentLinks';
import { tasksApi } from '../api/tasksApi';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import type { Task } from '../types/task';
import { normalizeTask } from '../utils/taskStatus';

export function ParentDashboardPage() {
  const { session } = useSupabaseSession();
  const {
    children,
    hasChildren,
    isLoading: linksLoading,
    loadChildrenForParent,
  } = useParentLinks();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddChildForm, setShowAddChildForm] = useState(false);

  const parentName = session?.name?.trim() || 'Родитель';

  // Автовыбор первого ребёнка при загрузке
  useEffect(() => {
    if (hasChildren && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, hasChildren, selectedChildId]);

  // Загрузка задач выбранного ребёнка
  useEffect(() => {
    if (!selectedChildId) return;

    const loadTasks = async () => {
      setTasksLoading(true);
      setError(null);
      try {
        const dbTasks = await tasksApi.getTasksByStudent(selectedChildId);
        const frontTasks: Task[] = dbTasks.map((dbTask) => ({
          id: dbTask.id,
          title: dbTask.title,
          subject: dbTask.subject ?? undefined,
          description: dbTask.description ?? undefined,
          deadline: dbTask.deadline,
          priority: dbTask.priority,
          status: dbTask.status,
          createdBy: dbTask.teacher_profile_id ? 'teacher' : 'student',
          assignedToStudentId: dbTask.assigned_student_profile_id,
          createdAt: dbTask.created_at,
          teacherComment: dbTask.teacher_comment ?? undefined,
          reminderMissedCount: dbTask.reminder_missed_count,
          attachments: dbTask.attachments ?? [],
          solutionText: dbTask.solution_text ?? undefined,
          solutionAttachments: dbTask.solution_attachments ?? [],
          teacherFeedback: dbTask.teacher_feedback ?? undefined,
          checkedAt: dbTask.checked_at ?? undefined,
        }));
        setTasks(frontTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить задачи ребёнка');
        console.error(err);
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [selectedChildId]);

  const normalizedTasks = useMemo(() => tasks.map((task) => normalizeTask(task)), [tasks]);

  const stats = useMemo(() => {
    const total = normalizedTasks.length;
    const completed = normalizedTasks.filter((t) => t.status === 'done' && t.checkedAt).length;
    const waitingReview = normalizedTasks.filter((t) => t.status === 'done' && !t.checkedAt).length;
    const overdue = normalizedTasks.filter((t) => t.status === 'overdue').length;
    const inProgress = normalizedTasks.filter((t) => t.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, waitingReview, overdue, inProgress, completionRate };
  }, [normalizedTasks]);

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.status === 'overdue'),
    [tasks]
  );
  const waitingReviewTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done' && !t.checkedAt),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done' && t.checkedAt),
    [tasks]
  );

  const riskyTasksCount = overdueTasks.length + waitingReviewTasks.length;

  const parentNotifications = useMemo(() => {
    const notes: { id: string; title: string; description: string }[] = [];
    if (overdueTasks.length > 0) {
      notes.push({
        id: 'overdue',
        title: `Просрочено задач: ${overdueTasks.length}`,
        description: 'Ребёнок не сдал работу вовремя. Рекомендуется обсудить причины.',
      });
    }
    if (waitingReviewTasks.length > 0) {
      notes.push({
        id: 'waiting',
        title: `На проверке: ${waitingReviewTasks.length}`,
        description: 'Учитель ещё не проверил выполненные работы.',
      });
    }
    tasks
      .filter((t) => t.reminderMissedCount && t.reminderMissedCount > 0)
      .forEach((t) => {
        notes.push({
          id: `missed-${t.id}`,
          title: `Пропущены напоминания: ${t.title}`,
          description: `Ребёнок пропустил ${t.reminderMissedCount} напоминаний по задаче.`,
        });
      });
    return notes.slice(0, 5);
  }, [overdueTasks, waitingReviewTasks, tasks]);

  const parentInsights = useMemo(() => {
    const insights: { id: string; title: string; description: string }[] = [];
    if (stats.overdue > 0) {
      insights.push({
        id: 'focus',
        title: 'Зона риска',
        description: `У ребёнка ${stats.overdue} просроченных задач. Возможно, нужна помощь с планированием.`,
      });
    } else if (stats.total > 0) {
      insights.push({
        id: 'pace',
        title: 'Хороший темп',
        description: 'Просрочек нет, ребёнок справляется с нагрузкой.',
      });
    }
    if (stats.completed > 0) {
      insights.push({
        id: 'progress',
        title: 'Прогресс',
        description: `Уже выполнено ${stats.completed} задач.`,
      });
    }
    return insights;
  }, [stats]);

  const selectedChildName = useMemo(() => {
    const child = children.find((c) => c.id === selectedChildId);
    return child?.full_name ?? 'Ребёнок';
  }, [children, selectedChildId]);

  const handleChildLinked = useCallback(async () => {
    await loadChildrenForParent();
    setShowAddChildForm(false);
  }, [loadChildrenForParent]);

  const handleChildUnlinked = useCallback(async () => {
    await loadChildrenForParent();
    if (selectedChildId && !children.some((c) => c.id === selectedChildId)) {
      setSelectedChildId(children.length > 0 ? children[0].id : null);
    }
  }, [children, loadChildrenForParent, selectedChildId]);

  // Если нет детей и форма не показана – показываем приглашение привязать первого
  if (!hasChildren && !showAddChildForm) {
    return (
      <div className="space-y-6">
        <ParentLinkCard onLinked={handleChildLinked} onUnlinked={handleChildUnlinked} />
      </div>
    );
  }

  if (linksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Модальная форма добавления ребёнка */}
      {showAddChildForm && (
        <ParentLinkCard
          onLinked={handleChildLinked}
          onUnlinked={handleChildUnlinked}
          onClose={() => setShowAddChildForm(false)}
        />
      )}

      <section className="overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              Кабинет родителя
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {parentName}, вы смотрите прогресс{' '}
              <span className="text-sky-300">{selectedChildName}</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Здесь видно, где ребёнок справляется хорошо, какие задачи требуют внимания и
              какие работы уже завершены.
            </p>
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-[28px] bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Всего задач</div>
              <div className="mt-2 text-3xl font-semibold">{stats.total}</div>
            </div>

            <div className="rounded-[28px] bg-rose-500/20 p-4 backdrop-blur">
              <div className="text-sm text-rose-100">Риски</div>
              <div className="mt-2 text-3xl font-semibold">{riskyTasksCount}</div>
            </div>

            <div className="rounded-[28px] bg-amber-500/20 p-4 backdrop-blur">
              <div className="text-sm text-amber-100">Ждут проверки</div>
              <div className="mt-2 text-3xl font-semibold">{waitingReviewTasks.length}</div>
            </div>

            <div className="rounded-[28px] bg-emerald-500/20 p-4 backdrop-blur">
              <div className="text-sm text-emerald-100">Завершено</div>
              <div className="mt-2 text-3xl font-semibold">{completedTasks.length}</div>
            </div>
          </div>
        </div>

        {/* Блок управления детьми */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/20 pt-4">
          {children.length > 1 && (
            <div className="min-w-[200px]">
              <label className="text-sm font-medium text-slate-300">Смотреть ребёнка:</label>
              <select
                value={selectedChildId ?? ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-sm text-white"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id} className="text-slate-900">
                    {child.full_name ?? 'Ученик'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowAddChildForm(true)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <Users className="mr-2 h-4 w-4" />
            Добавить ребёнка
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-950">Прогресс {selectedChildName}</h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Процент выполнения</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {stats.completionRate}%
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">В процессе</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {stats.inProgress}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Просрочено</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{stats.overdue}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-950">AI-подсказки</h2>
          </div>

          <div className="mt-4 space-y-3">
            {parentInsights.length > 0 ? (
              parentInsights.map((insight) => (
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[30px] border border-rose-200 bg-rose-50/70 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-700" />
            <h2 className="text-lg font-semibold text-rose-900">Сигналы риска</h2>
          </div>

          <div className="mt-4 space-y-3">
            {parentNotifications.length > 0 ? (
              parentNotifications.map((item) => (
                <div key={item.id} className="rounded-3xl bg-white/80 p-4">
                  <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-white/80 p-4 text-sm text-slate-500">
                Критичных сигналов сейчас нет.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-950">Быстрая сводка</h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Активные риски</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{riskyTasksCount}</div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Полностью завершено</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {completedTasks.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-rose-200 bg-rose-50/60 p-1">
        <div className="mb-2 flex items-center gap-2 px-4 pt-4 text-rose-900">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-semibold">Требует срочного внимания</span>
        </div>
        <TaskList
          title="Просрочено"
          description="Задачи, по которым уже есть просрочка и стоит подключиться к контролю."
          tasks={overdueTasks}
          emptyText="Просроченных задач нет."
          isLoading={tasksLoading}
        />
      </section>

      <section className="rounded-[30px] border border-amber-200 bg-amber-50/60 p-1">
        <div className="mb-2 flex items-center gap-2 px-4 pt-4 text-amber-900">
          <ClipboardCheck className="h-5 w-5" />
          <span className="text-sm font-semibold">Работы ждут проверки</span>
        </div>
        <TaskList
          title="Ждёт проверки"
          description="Задачи уже выполнены ребёнком, но учитель ещё не завершил проверку."
          tasks={waitingReviewTasks}
          emptyText="Нет задач, ожидающих проверки."
          isLoading={tasksLoading}
        />
      </section>

      <section className="rounded-[30px] border border-emerald-200 bg-emerald-50/60 p-1">
        <div className="mb-2 flex items-center gap-2 px-4 pt-4 text-emerald-900">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-semibold">Успешно завершено</span>
        </div>
        <TaskList
          title="Завершено"
          description="Полностью закрытые и уже проверенные задачи."
          tasks={completedTasks}
          emptyText="Пока нет полностью завершённых задач."
          isLoading={tasksLoading}
        />
      </section>
    </div>
  );
}