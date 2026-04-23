import type { Task } from '../types/task';

export type ReminderTone = 'soft' | 'neutral' | 'strong';

export interface AdaptiveReminder {
  taskId: string;
  title: string;
  message: string;
  tone: ReminderTone;
  risk: 'low' | 'medium' | 'high';
  nextReminderLabel: string;
  shouldNotifyParent: boolean;
}

function getHoursUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline).getTime();
  const now = Date.now();
  return (deadlineDate - now) / (1000 * 60 * 60);
}

function formatNextReminder(hoursLeft: number, status?: string) {
  if (status === 'done') return 'Не требуется';

  if (hoursLeft <= 0) return 'Сейчас';
  if (hoursLeft <= 2) return 'Через 30 минут';
  if (hoursLeft <= 6) return 'Через 1 час';
  if (hoursLeft <= 24) return 'Через 3 часа';
  if (hoursLeft <= 72) return 'Сегодня вечером';

  return 'Завтра утром';
}

export function buildAdaptiveReminder(task: Task): AdaptiveReminder | null {
  if (task.status === 'done') return null;

  const hoursLeft = getHoursUntilDeadline(task.deadline);
  const isHighPriority = task.priority === 'high';
  const isLowPriority = task.priority === 'low';
  const isInProgress = task.status === 'in_progress';
  const missedCount = task.reminderMissedCount ?? 0;

  let risk: 'low' | 'medium' | 'high' = 'low';
  let tone: ReminderTone = 'soft';
  let message = '';

  if (hoursLeft <= 0) {
    risk = 'high';
    tone = 'strong';
    message = `Срок по задаче "${task.title}" уже прошёл. Лучше заняться ей прямо сейчас.`;
  } else if (hoursLeft <= 6) {
    risk = 'high';
    tone = 'strong';
    message = `По задаче "${task.title}" дедлайн уже близко. Начни её в ближайшее время.`;
  } else if (hoursLeft <= 24) {
    risk = 'medium';
    tone = 'neutral';
    message = `Не забудь про "${task.title}" — лучше выполнить её сегодня.`;
  } else if (hoursLeft <= 72) {
    risk = 'medium';
    tone = 'neutral';
    message = `По задаче "${task.title}" ещё есть время, но стоит начать заранее.`;
  } else {
    risk = 'low';
    tone = 'soft';
    message = `Можно спокойно запланировать задачу "${task.title}".`;
  }

  if (isHighPriority && risk !== 'high') {
    risk = 'high';
    tone = 'strong';
    message = `У задачи "${task.title}" высокий приоритет. Постарайся не откладывать её.`;
  }

  if (isLowPriority && risk === 'low') {
    tone = 'soft';
  }

  if (isInProgress && risk !== 'high') {
    tone = 'soft';
    message = `Ты уже начал задачу "${task.title}". Хорошо бы довести её до конца.`;
  }

  if (missedCount >= 2) {
    risk = 'high';
    tone = 'strong';
    message = `Задача "${task.title}" уже несколько раз откладывалась. Лучше закрыть её как можно скорее.`;
  }

  return {
    taskId: task.id,
    title: task.title,
    message,
    tone,
    risk,
    nextReminderLabel: formatNextReminder(hoursLeft, task.status),
    shouldNotifyParent: risk === 'high' || missedCount >= 2,
  };
}

export function buildStudentAdaptiveReminders(tasks: Task[]): AdaptiveReminder[] {
  return tasks
    .filter((task) => task.status !== 'done')
    .map(buildAdaptiveReminder)
    .filter((item): item is AdaptiveReminder => Boolean(item))
    .sort((a, b) => {
      const riskScore = { high: 3, medium: 2, low: 1 };
      return riskScore[b.risk] - riskScore[a.risk];
    });
}