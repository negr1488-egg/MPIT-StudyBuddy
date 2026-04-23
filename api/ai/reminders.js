// api/ai/reminders.ts
export const config = { runtime: 'edge' };
import { callMistral } from '../_lib/mistral.js';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { tasks } = await req.json();
    const taskList = Array.isArray(tasks) ? tasks : [];

    const fallback = {
      reminders: [
        'Начни с самой близкой задачи по дедлайну.',
        'Если четверг перегружен, перенеси часть работы на сегодня.',
        'Сначала закрой задачи с высоким приоритетом.',
      ],
    };

    if (taskList.length === 0) {
      return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await callMistral([
      {
        role: 'system',
        content:
          'Ты учебный помощник. На основе списка задач пользователя верни JSON с массивом reminders (3-5 советов по порядку выполнения). Формат: { "reminders": ["строка", ...] }',
      },
      { role: 'user', content: JSON.stringify(taskList) },
    ]).catch(() => null);

    if (result) {
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed.reminders)) {
          return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch {}
    }

    return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Reminders error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
