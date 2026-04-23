import type { TaskPriority } from '../types/task';

export interface ParsedTaskDraft {
  subject?: string;
  title: string;
  deadline: string;
  priority: TaskPriority;
}

const subjectDictionary: Record<string, string> = {
  алгебр: 'Алгебра',
  геометр: 'Геометрия',
  русск: 'Русский язык',
  литератур: 'Литература',
  истор: 'История',
  биолог: 'Биология',
  физик: 'Физика',
  хим: 'Химия',
  информат: 'Информатика',
  англий: 'Английский язык',
};

const weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function setDefaultDeadline(daysFromNow: number, hours: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

function getNextWeekday(targetWeekday: number) {
  const date = new Date();
  const current = date.getDay();
  let offset = targetWeekday - current;

  if (offset <= 0) {
    offset += 7;
  }

  date.setDate(date.getDate() + offset);
  date.setHours(18, 0, 0, 0);
  return date.toISOString();
}

export function parseTaskFromText(text: string): ParsedTaskDraft {
  const normalized = text.trim().toLowerCase();

  const subject = Object.entries(subjectDictionary).find(([key]) => normalized.includes(key))?.[1];
  const taskNumber = normalized.match(/№\s*\d+[а-яa-z0-9-]*/i)?.[0];
  const priority: TaskPriority = normalized.includes('срочно') || normalized.includes('сегодня') ? 'high' : normalized.includes('важно') ? 'medium' : 'medium';

  let deadline = setDefaultDeadline(1, 18);

  if (normalized.includes('сегодня')) {
    deadline = setDefaultDeadline(0, 20);
  } else if (normalized.includes('завтра')) {
    deadline = setDefaultDeadline(1, 18);
  } else if (normalized.includes('послезавтра')) {
    deadline = setDefaultDeadline(2, 18);
  } else {
    const weekdayMatch = weekdays.find((day) => normalized.includes(day.slice(0, -1)) || normalized.includes(`до ${day}`));
    if (weekdayMatch) {
      deadline = getNextWeekday(weekdays.indexOf(weekdayMatch));
    }
  }

  const cleanedTitle = normalized
    .replace(/до\s+[а-яёa-z]+/gi, '')
    .replace(/сегодня|завтра|послезавтра|срочно|важно/gi, '')
    .trim();

  const title = taskNumber ? `${subject ?? 'Задание'} ${taskNumber}` : cleanedTitle ? cleanedTitle[0].toUpperCase() + cleanedTitle.slice(1) : 'Новое задание';

  return {
    subject,
    title,
    deadline,
    priority,
  };
}
