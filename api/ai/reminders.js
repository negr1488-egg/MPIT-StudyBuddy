import { callGigaChat } from '../_lib/gigachat.js';
import { readBody, sendJson } from '../_lib/json.js';

export default async function handler(request, response) {
  try {
    const body = await readBody(request);
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];

    const fallback = {
      reminders: [
        'Начни с самой близкой задачи по дедлайну.',
        'Если четверг перегружен, перенеси часть работы на сегодня.',
        'Сначала закрой задачи с высоким приоритетом.',
      ],
    };

    const gigachat = await callGigaChat([
      {
        role: 'system',
        content: 'Ты учебный помощник. Верни JSON с массивом reminders на основе списка задач пользователя.',
      },
      {
        role: 'user',
        content: JSON.stringify(tasks),
      },
    ]).catch(() => null);

    const content = gigachat?.choices?.[0]?.message?.content;
    if (content) {
      try {
        return sendJson(response, 200, JSON.parse(content));
      } catch {
      }
    }

    return sendJson(response, 200, fallback);
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected AI proxy error.',
    });
  }
}
