// api/ai/parse.js
export const config = { runtime: 'edge' };
import { callMistral } from '../_lib/mistral.js';

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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const input = String(body.input || '').trim();

    if (!input) {
      return new Response(JSON.stringify({ error: 'Input is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await callMistral([
      {
        role: 'system',
        content:
          'Ты помощник StudyBuddy. Разбери школьное задание и верни JSON с полями subject,title,description,deadline,priority,recommendedEstimatedTime.',
      },
      { role: 'user', content: input },
    ]).catch(() => null);

    if (result) {
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ ...parsed, source: 'mistral' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {}
    }

    const fallbackResult = fallbackParse(input);
    return new Response(JSON.stringify(fallbackResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Parse error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
