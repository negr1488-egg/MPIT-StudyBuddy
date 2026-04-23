// src/services/ai.ts

// ====================== Парсинг ======================
export async function parseTask(input: string) {
  const res = await fetch('/api/ai/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Parse failed');
  }
  return res.json(); // { subject, title, description, deadline, priority, recommendedEstimatedTime, source }
}

// ====================== Разбивка на этапы ======================
export async function getTaskSteps(task: {
  title?: string;
  subject?: string;
  description?: string;
  deadline?: string;
}) {
  const res = await fetch('/api/ai/steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Steps failed');
  }
  return res.json(); // { steps: { title: string; minutes: number }[], source: 'mistral'|'fallback' }
}

// ====================== Адаптивные напоминания ======================
export async function getReminders(tasks: any[]) {
  const res = await fetch('/api/ai/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Reminders failed');
  }
  return res.json(); // { reminders: string[] }
}

// ====================== Аналитика ======================
export async function getAnalytics(tasks: any[]) {
  const res = await fetch('/api/ai/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Analytics failed');
  }
  return res.json(); // { insight, riskLevel, recommendation }
}

// ====================== Геймификация ======================
export async function getGamification(stats: {
  completedTasks?: number;
  totalPoints?: number;
  streak?: number;
  [key: string]: any;
}) {
  const res = await fetch('/api/ai/gamification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Gamification failed');
  }
  return res.json(); // { achievements, goals, challenge }
}
