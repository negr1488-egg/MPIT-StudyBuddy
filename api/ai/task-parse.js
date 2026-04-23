import { callGigaChat } from '../_lib/gigachat.js';
import { readBody, sendJson } from '../_lib/json.js';

function fallbackParse(input) {
  const normalized = String(input || '').toLowerCase();
  const subject = normalized.includes('алгебр')
    ? 'Алгебра'
    : normalized.includes('истор')
      ? 'История'
      : normalized.includes('биолог')
        ? 'Биология'
        : normalized.includes('физик')
          ? 'Физика'
          : undefined;

  const title = normalized.match(/№\s*\d+[а-яa-z0-9-]*/i)?.[0]
    ? `${subject ?? 'Задание'} ${normalized.match(/№\s*\d+[а-яa-z0-9-]*/i)?.[0]}`
    : (input || 'Новое задание').trim();

  const deadline = (() => {
    const date = new Date();
    if (normalized.includes('сегодня')) {
      date.setHours(20, 0, 0, 0);
    } else if (normalized.includes('завтра')) {
      date.setDate(date.getDate() + 1);
      date.setHours(18, 0, 0, 0);
    } else {
      date.setDate(date.getDate() + 2);
      date.setHours(18, 0, 0, 0);
    }
    return date.toISOString();
  })();

  return {
    subject,
    title,
    description: 'Структурировано автоматически на backend proxy.',
    deadline,
    priority: normalized.includes('срочно') ? 'high' : 'medium',
    recommendedEstimatedTime: '25 минут',
    source: 'fallback',
  };
}

export default async function handler(request, response) {
  try {
    const body = await readBody(request);
    const input = String(body.input || '').trim();

    if (!input) {
      return sendJson(response, 400, { error: 'Input is required.' });
    }

    const gigachat = await callGigaChat([
      {
        role: 'system',
        content:
          'Ты помощник StudyBuddy. Разбери школьное задание и верни JSON с полями subject,title,description,deadline,priority,recommendedEstimatedTime.',
      },
      {
        role: 'user',
        content: input,
      },
    ]).catch(() => null);

    const content = gigachat?.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return sendJson(response, 200, { ...parsed, source: 'gigachat' });
      } catch {
      }
    }

    return sendJson(response, 200, fallbackParse(input));
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected AI proxy error.',
    });
  }
}
