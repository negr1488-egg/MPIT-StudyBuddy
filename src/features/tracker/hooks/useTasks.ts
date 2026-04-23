import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../api/tasksApi';
import { useSupabaseSession } from './useSupabaseSession';
import type { Task, TaskStatus, TaskPriority, TaskRoleOwner } from '../types/task';
import { normalizeTask, groupTasksByTimeline } from '../utils/taskStatus';
import { isToday } from '../utils/deadline';
import { isSupabaseEnabled } from '../../../shared/lib/supabase';
import { uploadTaskAttachments } from '../utils/uploadFile';
import { buildStudentAdaptiveReminders } from '../utils/adaptiveReminders';

export interface CreateTaskInput {
  title: string;
  subject?: string;
  description?: string;
  deadline: string;
  priority: TaskPriority;
  createdBy?: TaskRoleOwner;
  studentId?: string;
  teacherComment?: string;
  attachments?: File[];
}

export interface UpdateTaskInput {
  title: string;
  subject?: string;
  description?: string;
  deadline: string;
  priority: TaskPriority;
}

export interface RoleNotification {
  id: string;
  title: string;
  description: string;
  type: TaskStatus | 'info';
}

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export function useTasks() {
  const { session } = useSupabaseSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.id ?? null;
  const userRole = session?.role ?? null;

  const loadTasks = useCallback(async () => {
    if (!isSupabaseEnabled || !userId) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let dbTasks;

      if (userRole === 'teacher') {
        dbTasks = await tasksApi.getTeacherRelatedTasks(userId);
      } else if (userRole === 'student') {
        dbTasks = await tasksApi.getStudentTasks(userId);
      } else {
        dbTasks = await tasksApi.getUserTasks(userId);
      }

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
        reminderMissedCount: dbTask.reminder_missed_count ?? 0,
        attachments: dbTask.attachments ?? [],
        solutionText: dbTask.solution_text ?? undefined,
        solutionAttachments: dbTask.solution_attachments ?? [],
        teacherFeedback: dbTask.teacher_feedback ?? undefined,
        checkedAt: dbTask.checked_at ?? undefined,
      }));

      setTasks(frontTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить задачи');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    void loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!isSupabaseEnabled || !userId || !userRole) {
        throw new Error('Нет активной сессии');
      }

      const assignedTo = userRole === 'teacher' ? input.studentId! : userId;
      if (!assignedTo) {
        throw new Error('Не указан ученик');
      }

      const createdTask = await tasksApi.createTask({
        title: input.title,
        subject: input.subject ?? null,
        description: input.description ?? null,
        deadline: input.deadline,
        priority: input.priority,
        assigned_student_profile_id: assignedTo,
        created_by_profile_id: userId,
        teacher_profile_id: userRole === 'teacher' ? userId : null,
        teacher_comment: input.teacherComment ?? null,
        attachments: [],
      });

      if (input.attachments && input.attachments.length > 0) {
        const uploaded = await uploadTaskAttachments(input.attachments, createdTask.id, 'tasks');
        const urls = uploaded.map((file) => file.url);
        await tasksApi.updateTaskAttachments(createdTask.id, urls);
      }

      await loadTasks();
    },
    [userId, userRole, loadTasks]
  );

  const editTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      if (!isSupabaseEnabled) {
        throw new Error('Supabase выключен');
      }

      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        throw new Error('Задача не найдена');
      }

      if (currentTask.status === 'done') {
        throw new Error('Выполненную задачу нельзя редактировать');
      }

      await tasksApi.updateTask(taskId, {
        title: input.title,
        subject: input.subject ?? null,
        description: input.description ?? null,
        deadline: input.deadline,
        priority: input.priority,
      });

      await loadTasks();
    },
    [loadTasks, tasks]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus, teacherComment?: string) => {
      if (!isSupabaseEnabled) {
        throw new Error('Supabase выключен');
      }

      await tasksApi.updateTaskStatus(taskId, {
        status,
        teacher_comment: teacherComment,
      });

      await loadTasks();
    },
    [loadTasks]
  );

  const submitSolution = useCallback(
    async (taskId: string, text: string, files: File[]) => {
      if (!isSupabaseEnabled) {
        throw new Error('Supabase выключен');
      }

      let solutionAttachments: string[] = [];

      if (files.length > 0) {
        const uploaded = await uploadTaskAttachments(files, taskId, 'solutions');
        solutionAttachments = uploaded.map((file) => file.url);
      }

      await tasksApi.submitSolution(taskId, text, solutionAttachments);
      await loadTasks();
    },
    [loadTasks]
  );

  const reviewTask = useCallback(
    async (taskId: string, feedback: string, status: TaskStatus = 'done') => {
      if (!isSupabaseEnabled) {
        throw new Error('Supabase выключен');
      }

      await tasksApi.reviewTask(taskId, feedback, status);
      await loadTasks();
    },
    [loadTasks]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!isSupabaseEnabled) {
        throw new Error('Supabase выключен');
      }

      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        throw new Error('Задача не найдена');
      }

      if (currentTask.status === 'done') {
        throw new Error('Выполненную задачу нельзя удалить');
      }

      await tasksApi.deleteTask(taskId);
      await loadTasks();
    },
    [loadTasks, tasks]
  );

  const normalizedTasks = useMemo(() => {
    return tasks.map((task) => normalizeTask(task));
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    return groupTasksByTimeline(tasks);
  }, [tasks]);

  const stats = useMemo(() => {
    const total = normalizedTasks.length;
    const completed = normalizedTasks.filter((task) => task.status === 'done').length;
    const overdue = normalizedTasks.filter((task) => task.status === 'overdue').length;
    const inProgress = normalizedTasks.filter((task) => task.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const streak = Math.max(2, completed);
    const points = completed * 15 + (total - overdue) * 3;

    return {
      total,
      completedCount: completed,
      overdueCount: overdue,
      inProgressCount: inProgress,
      completionRate,
      streak,
      points,
    };
  }, [normalizedTasks]);

  const getNotificationsForRole = useCallback(
    (role: 'student' | 'teacher' | 'parent'): RoleNotification[] => {
      const now = new Date();
      const todayTasks = tasks.filter(
        (task) => isToday(task.deadline, now) && task.status !== 'done'
      );
      const overdueTasks = tasks.filter((task) => task.status === 'overdue');
      const waitingReview = tasks.filter((task) => task.status === 'done' && !task.checkedAt);

      if (role === 'student') {
        const notes: RoleNotification[] = [];

        if (overdueTasks.length) {
          notes.push({
            id: 'overdue',
            title: `Просрочено: ${overdueTasks.length}`,
            description: 'Закрой их как можно скорее',
            type: 'overdue',
          });
        }

        if (todayTasks.length) {
          notes.push({
            id: 'today',
            title: `На сегодня: ${todayTasks.length}`,
            description: 'Лучше выполнить их в первую очередь',
            type: 'info',
          });
        }

        if (waitingReview.length) {
          notes.push({
            id: 'waiting',
            title: 'На проверке',
            description: `${waitingReview.length} задач ожидают проверки`,
            type: 'info',
          });
        }

        return notes;
      }

      if (role === 'teacher') {
        const toReview = tasks.filter((task) => task.status === 'done' && !task.checkedAt);

        return toReview.length
          ? [
              {
                id: 'review',
                title: 'Требуют проверки',
                description: `${toReview.length} задач`,
                type: 'in_progress',
              },
            ]
          : [];
      }

      if (role === 'parent') {
        const parentNotes: RoleNotification[] = [];

        if (overdueTasks.length) {
          parentNotes.push({
            id: 'parent-overdue',
            title: `Есть просрочки: ${overdueTasks.length}`,
            description: 'Стоит обратить внимание на отстающие задачи',
            type: 'overdue',
          });
        }

        if (todayTasks.length) {
          parentNotes.push({
            id: 'parent-today',
            title: `На сегодня: ${todayTasks.length}`,
            description: 'У ребёнка есть активные задачи на сегодня',
            type: 'info',
          });
        }

        return parentNotes;
      }

      return [];
    },
    [tasks]
  );

  const getAiInsightsForRole = useCallback(
    (role: 'student' | 'teacher' | 'parent'): AiInsight[] => {
      const overdue = tasks.filter((task) => task.status === 'overdue');

      if (role === 'student') {
        return overdue.length
          ? [
              {
                id: 'focus',
                title: 'Просроченные задачи',
                description: `Сначала лучше закрыть ${overdue.length} просроченных задач`,
                severity: 'high',
              },
            ]
          : [
              {
                id: 'good',
                title: 'Хороший темп',
                description: 'Сейчас у тебя нет критических просрочек',
                severity: 'low',
              },
            ];
      }

      if (role === 'teacher') {
        const unchecked = tasks.filter((task) => task.status === 'done' && !task.checkedAt);

        return unchecked.length
          ? [
              {
                id: 'teacher-review',
                title: 'Проверка работ',
                description: `Есть ${unchecked.length} задач, ожидающих проверки`,
                severity: 'medium',
              },
            ]
          : [];
      }

      if (role === 'parent') {
        return overdue.length
          ? [
              {
                id: 'parent-risk',
                title: 'Нужен контроль',
                description: `Обнаружено просроченных задач: ${overdue.length}`,
                severity: 'high',
              },
            ]
          : [];
      }

      return [];
    },
    [tasks]
  );

  const adaptiveReminders = useMemo(() => {
    return buildStudentAdaptiveReminders(normalizedTasks);
  }, [normalizedTasks]);

  return {
    tasks: normalizedTasks,
    groupedTasks,
    stats,
    isLoading,
    error,
    addTask,
    editTask,
    updateTaskStatus,
    submitSolution,
    reviewTask,
    removeTask,
    reload: loadTasks,
    getNotificationsForRole,
    getAiInsightsForRole,
    adaptiveReminders,
  };
}

export type UseTasksResult = ReturnType<typeof useTasks>;