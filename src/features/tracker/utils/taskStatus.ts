import type { Task, TaskPriority, TaskStatus } from '../types/task';
import { isOverdue, isToday, isWithinUpcomingDays } from './deadline';

export function getDerivedTaskStatus(task: Task, now = new Date()): TaskStatus {
  if (task.status === 'done') {
    return 'done';
  }

  if (isOverdue(task.deadline, now)) {
    return 'overdue';
  }

  return task.status;
}

export function normalizeTask(task: Task, now = new Date()): Task {
  return {
    ...task,
    status: getDerivedTaskStatus(task, now),
  };
}

export function groupTasksByTimeline(tasks: Task[], now = new Date()) {
  const normalizedTasks = tasks.map((task) => normalizeTask(task, now));

  return {
    today: normalizedTasks.filter((task) => task.status !== 'done' && task.status !== 'overdue' && isToday(task.deadline, now)),
    soon: normalizedTasks.filter((task) => task.status !== 'done' && task.status !== 'overdue' && !isToday(task.deadline, now) && isWithinUpcomingDays(task.deadline, 7, now)),
    overdue: normalizedTasks.filter((task) => task.status === 'overdue'),
    completed: normalizedTasks.filter((task) => task.status === 'done'),
  };
}

export function getTaskStatusLabel(status: TaskStatus) {
  return {
    todo: 'Запланировано',
    in_progress: 'В работе',
    done: 'Выполнено',
    overdue: 'Просрочено',
  }[status];
}

export function getTaskPriorityLabel(priority: TaskPriority) {
  return {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  }[priority];
}

export function getTaskStatusTone(status: TaskStatus) {
  return {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-amber-100 text-amber-800',
    done: 'bg-emerald-100 text-emerald-800',
    overdue: 'bg-rose-100 text-rose-800',
  }[status];
}

export function getTaskPriorityTone(priority: TaskPriority) {
  return {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-sky-100 text-sky-800',
    high: 'bg-rose-100 text-rose-800',
  }[priority];
}
