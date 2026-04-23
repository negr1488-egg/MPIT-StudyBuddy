// /src/services/gigachat/client.ts

interface ParsedTask {
  title: string;
  subject?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: string; // ISO-строка
}

interface TaskSteps {
  steps: string[];
  estimatedTotalHours?: number;
}

// Если задана переменная окружения VITE_GIGACHAT_API_URL – будут запросы к реальному серверу
const GIGACHAT_BASE = import.meta.env.VITE_GIGACHAT_API_URL || '';

async function tryApi(path: string, body: unknown): Promise<Response | null> {
  if (!GIGACHAT_BASE) return null;
  try {
    const response = await fetch(`${GIGACHAT_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

/* ---------- Fallback – локальная логика ---------- */

function localParse(rawText: string): ParsedTask {
  const lower = rawText.toLowerCase();

  // Приоритет
  let priority: ParsedTask['priority'] = 'medium';
  if (lower.includes('срочно') || lower.includes('важно') || lower.includes('завтра')) {
    priority = 'high';
  } else if (lower.includes('можно позже') || lower.includes('не горит') || lower.includes('не срочно')) {
    priority = 'low';
  }

  // Название задачи – первые 5–6 слов + многоточие
  const words = rawText.trim().split(/\s+/);
  const title = words.length > 5 ? words.slice(0, 5).join(' ') + '…' : rawText.trim();

  // Предмет по ключевым словам
  const subjectsMap: Record<string, string> = {
    алгебра: 'Алгебра',
    геометрия: 'Геометрия',
    русский: 'Русский язык',
    литература: 'Литература',
    физика: 'Физика',
    химия: 'Химия',
    биология: 'Биология',
    история: 'История',
    география: 'География',
    информатика: 'Информатика',
    английский: 'Английский язык',
  };
  let subject: string | undefined;
  for (const [key, value] of Object.entries(subjectsMap)) {
    if (lower.includes(key)) {
      subject = value;
      break;
    }
  }

  // Простейшее описание – оставшаяся часть текста
  const descriptionWords = words.length > 5 ? words.slice(5).join(' ') : undefined;

  return { title, subject, description: descriptionWords, priority };
}

function localSteps(payload: { title: string; subject?: string; description?: string }): TaskSteps {
  return {
    steps: [
      'Прочитай условие и пойми, что требуется',
      'Собери необходимые материалы (учебник, тетрадь, конспект)',
      payload.subject
        ? `Выполни основную работу по предмету «${payload.subject}»`
        : 'Выполни основную часть задания',
      'Проверь правильность и оформи результат',
    ],
    estimatedTotalHours: 1.5,
  };
}

/* ---------- Экспортируемые методы ---------- */

export async function parseTask(rawText: string): Promise<ParsedTask> {
  const response = await tryApi('/api/ai/task-parse', { text: rawText });
  if (response) {
    const data = await response.json();
    return {
      title: data.title || '',
      subject: data.subject || undefined,
      description: data.description || undefined,
      priority: data.priority || 'medium',
      deadline: data.deadline || undefined,
    };
  }
  return localParse(rawText);
}

export async function buildTaskSteps(
  payload: { title: string; subject?: string; description?: string }
): Promise<TaskSteps> {
  const response = await tryApi('/api/ai/task-steps', payload);
  if (response) {
    return response.json();
  }
  return localSteps(payload);
}
