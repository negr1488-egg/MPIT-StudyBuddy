interface AiTaskParseResult {
  subject?: string;
  title: string;
  description?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  recommendedEstimatedTime?: string;
}

export interface AiTaskStep {
  title: string;
  minutes: number;
}

export interface AiTaskStepsResult {
  steps: AiTaskStep[];
  source?: 'gigachat' | 'fallback';
}

function extractSubject(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('алгеб') || lower.includes('геом') || lower.includes('матем')) {
    return 'Математика';
  }
  if (lower.includes('рус')) {
    return 'Русский язык';
  }
  if (lower.includes('литер')) {
    return 'Литература';
  }
  if (lower.includes('физик')) {
    return 'Физика';
  }
  if (lower.includes('хими')) {
    return 'Химия';
  }
  if (lower.includes('биолог')) {
    return 'Биология';
  }
  if (lower.includes('истор')) {
    return 'История';
  }
  if (lower.includes('обществ')) {
    return 'Обществознание';
  }
  if (lower.includes('англ')) {
    return 'Английский язык';
  }
  if (lower.includes('информ')) {
    return 'Информатика';
  }

  return '';
}

function extractPriority(text: string): 'low' | 'medium' | 'high' {
  const lower = text.toLowerCase();

  if (
    lower.includes('срочно') ||
    lower.includes('важно') ||
    lower.includes('обязательно') ||
    lower.includes('как можно скорее')
  ) {
    return 'high';
  }

  return 'medium';
}

function extractTitle(text: string): string {
  const cleaned = text.trim();

  if (!cleaned) {
    return 'Новое задание';
  }

  const short = cleaned.split(/[.!?\n]/)[0].trim();

  if (short.length <= 80) {
    return short;
  }

  return `${short.slice(0, 77).trim()}...`;
}

function extractDeadline(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  const result = new Date();

  if (lower.includes('сегодня')) {
    result.setHours(23, 59, 0, 0);
    return result.toISOString();
  }

  if (lower.includes('завтра')) {
    result.setDate(result.getDate() + 1);
    result.setHours(23, 59, 0, 0);
    return result.toISOString();
  }

  if (lower.includes('послезавтра')) {
    result.setDate(result.getDate() + 2);
    result.setHours(23, 59, 0, 0);
    return result.toISOString();
  }

  if (lower.includes('к пятнице') || lower.includes('до пятницы')) {
    const day = result.getDay();
    const friday = 5;
    let diff = friday - day;
    if (diff <= 0) diff += 7;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 0, 0);
    return result.toISOString();
  }

  if (lower.includes('к понедельнику') || lower.includes('до понедельника')) {
    const day = result.getDay();
    const monday = 1;
    let diff = monday - day;
    if (diff <= 0) diff += 7;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 0, 0);
    return result.toISOString();
  }

  result.setDate(now.getDate() + 1);
  result.setHours(18, 0, 0, 0);
  return result.toISOString();
}

function buildLocalParseResult(input: string): AiTaskParseResult {
  const subject = extractSubject(input);
  const title = extractTitle(input);
  const deadline = extractDeadline(input);
  const priority = extractPriority(input);

  return {
    title,
    subject,
    description: input.trim(),
    deadline,
    priority,
    recommendedEstimatedTime: '30–45 мин',
  };
}

function buildLocalSteps(payload: {
  title?: string;
  subject?: string;
  description?: string;
  deadline?: string;
}): AiTaskStepsResult {
  const title = String(payload.title || 'Задание').trim();
  const subject = String(payload.subject || '').toLowerCase();
  const description = String(payload.description || '').toLowerCase();

  const isMath =
    subject.includes('мат') ||
    subject.includes('алгеб') ||
    subject.includes('геом') ||
    description.includes('реш') ||
    description.includes('пример');

  const isEssay =
    subject.includes('рус') ||
    subject.includes('лит') ||
    description.includes('сочинен') ||
    description.includes('эссе');

  if (isMath) {
    return {
      source: 'fallback',
      steps: [
        { title: 'Прочитать условие и понять, что нужно найти', minutes: 10 },
        { title: 'Выписать нужные формулы или правила', minutes: 10 },
        { title: 'Решить задания по порядку', minutes: 25 },
        { title: 'Проверить ответы и аккуратно оформить решение', minutes: 10 },
      ],
    };
  }

  if (isEssay) {
    return {
      source: 'fallback',
      steps: [
        { title: 'Прочитать тему и определить основную мысль', minutes: 10 },
        { title: 'Составить план текста', minutes: 10 },
        { title: 'Написать черновик', minutes: 25 },
        { title: 'Проверить ошибки и доработать текст', minutes: 15 },
      ],
    };
  }

  return {
    source: 'fallback',
    steps: [
      { title: `Понять суть задания "${title}"`, minutes: 10 },
      { title: 'Подготовить материалы и нужные источники', minutes: 10 },
      { title: 'Выполнить основную часть задания', minutes: 25 },
      { title: 'Проверить результат перед сдачей', minutes: 10 },
    ],
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'AI request failed');
  }

  return response.json() as Promise<T>;
}

export const gigachatClient = {
  async parseTask(input: string) {
    try {
      return await postJson<AiTaskParseResult>('/api/ai/task-parse', { input });
    } catch {
      return buildLocalParseResult(input);
    }
  },

  async buildTaskSteps(payload: {
    title?: string;
    subject?: string;
    description?: string;
    deadline?: string;
  }) {
    try {
      return await postJson<AiTaskStepsResult>('/api/ai/task-steps', payload);
    } catch {
      return buildLocalSteps(payload);
    }
  },

  async buildReminders(payload: {
    tasks: Array<{
      title: string;
      subject?: string;
      deadline: string;
      priority: string;
      status: string;
    }>;
  }) {
    return postJson<{ reminders: string[] }>('/api/ai/reminders', payload);
  },

  async buildAnalytics(payload: {
    tasks: Array<{
      title: string;
      subject?: string;
      deadline: string;
      priority: string;
      status: string;
    }>;
  }) {
    return postJson<{
      insight: string;
      riskLevel: 'low' | 'medium' | 'high';
      recommendation: string;
    }>('/api/ai/analytics', payload);
  },
};