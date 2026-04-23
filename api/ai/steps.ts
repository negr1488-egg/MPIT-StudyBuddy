// api/ai/steps.ts
export const config = { runtime: 'edge' };
import { callMistral } from '../_lib/mistral.js';

function buildFallbackSteps(payload: any) {
  const title = String(payload.title || 'Задание').trim();
  const subject = String(payload.subject || '').trim().toLowerCase();
  const description = String(payload.description || '').trim().toLowerCase();

  const isMath =
    subject.includes('мат') ||
    subject.includes('алгеб') ||
    subject.includes('геом') ||
    description.includes('реш') ||
    description.includes('пример');

  const isEssay =
    subject.includes('лит') ||
    subject.includes('рус') ||
    description.includes('сочинен') ||
    description.includes('эссе');

  if (isMath) {
    return {
      steps: [
        { title: 'Прочитать условие и выделить, что нужно найти', minutes: 10 },
        { title: 'Выписать формулы или правила, которые понадобятся', minutes: 10 },
        { title: 'Решить задания по порядку', minutes: 25 },
        { title: 'Проверить ответы и оформить решение аккуратно', minutes: 10 },
      ],
      source: 'fallback',
    };
  }

  if (isEssay) {
    return {
      steps: [
        { title: 'Прочитать тему и определить основную мысль', minutes: 10 },
        { title: 'Составить короткий план текста', minutes: 10 },
        { title: 'Написать черновик', minutes: 25 },
        { title: 'Проверить ошибки и переписать чистовой вариант', minutes: 15 },
      ],
      source: 'fallback',
    };
  }

  return {
    steps: [
      { title: `Понять, что требуется по задаче "${title}"`, minutes: 10 },
      { title: 'Подготовить материалы и нужные источники', minutes: 10 },
      { title: 'Выполнить основную часть задания', minutes: 25 },
      { title: 'Проверить результат перед сдачей', minutes: 10 },
    ],
    source: 'fallback',
  };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const payload = {
      title: String(body.title || '').trim(),
      subject: String(body.subject || '').trim(),
      description: String(body.description || '').trim(),
      deadline: String(body.deadline || '').trim(),
    };

    if (!payload.title && !payload.description) {
      return new Response(JSON.stringify({ error: 'Нужно передать title или description.' }), { status: 400 });
    }

    const result = await callMistral([
      {
        role: 'system',
        content:
          'Ты — умный помощник школьного трекера. Разбей задание на 3-6 понятных этапов. Верни ТОЛЬКО JSON без пояснений: { "steps": [ { "title": "string", "minutes": integer } ] }',
      },
      { role: 'user', content: JSON.stringify(payload) },
    ]).catch(() => null);

    if (result) {
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed.steps)) {
          const normalized = parsed.steps
            .filter((s: any) => s && typeof s.title === 'string')
            .map((s: any) => ({
              title: String(s.title).trim(),
              minutes: Math.max(5, Number(s.minutes) || 10),
            }))
            .slice(0, 6);
          if (normalized.length > 0) {
            return new Response(JSON.stringify({ steps: normalized, source: 'mistral' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      } catch {}
    }

    const fallback = buildFallbackSteps(payload);
    return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Steps error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
