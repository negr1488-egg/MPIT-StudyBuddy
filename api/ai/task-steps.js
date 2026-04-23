import { callGigaChat } from '../_lib/gigachat.js';
import { readBody, sendJson } from '../_lib/json.js';

function buildFallbackSteps(payload) {
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
        {
          title: 'Прочитать условие и выделить, что нужно найти',
          minutes: 10,
        },
        {
          title: 'Выписать формулы или правила, которые понадобятся',
          minutes: 10,
        },
        {
          title: 'Решить задания по порядку',
          minutes: 25,
        },
        {
          title: 'Проверить ответы и оформить решение аккуратно',
          minutes: 10,
        },
      ],
      source: 'fallback',
    };
  }

  if (isEssay) {
    return {
      steps: [
        {
          title: 'Прочитать тему и определить основную мысль',
          minutes: 10,
        },
        {
          title: 'Составить короткий план текста',
          minutes: 10,
        },
        {
          title: 'Написать черновик',
          minutes: 25,
        },
        {
          title: 'Проверить ошибки и переписать чистовой вариант',
          minutes: 15,
        },
      ],
      source: 'fallback',
    };
  }

  return {
    steps: [
      {
        title: `Понять, что требуется по задаче "${title}"`,
        minutes: 10,
      },
      {
        title: 'Подготовить материалы и нужные источники',
        minutes: 10,
      },
      {
        title: 'Выполнить основную часть задания',
        minutes: 25,
      },
      {
        title: 'Проверить результат перед сдачей',
        minutes: 10,
      },
    ],
    source: 'fallback',
  };
}

export default async function handler(request, response) {
  try {
    const body = await readBody(request);

    const payload = {
      title: String(body.title || '').trim(),
      subject: String(body.subject || '').trim(),
      description: String(body.description || '').trim(),
      deadline: String(body.deadline || '').trim(),
    };

    if (!payload.title && !payload.description) {
      return sendJson(response, 400, {
        error: 'Нужно передать title или description.',
      });
    }

    const systemPrompt = `
Ты — умный помощник школьного трекера.
Твоя задача — разбить школьное задание на 3-6 понятных этапов.

Верни ТОЛЬКО JSON без пояснений в формате:
{
  "steps": [
    { "title": "string", "minutes": 10 }
  ]
}

Правила:
- Пиши по-русски.
- Этапы должны быть короткими, понятными школьнику.
- Каждый этап должен быть конкретным действием.
- minutes — примерная длительность этапа в минутах.
- Не добавляй ничего вне JSON.
`.trim();

    const userPrompt = JSON.stringify(payload);

    const gigachat = await callGigaChat([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ]).catch(() => null);

    const content = gigachat?.choices?.[0]?.message?.content;

    if (content) {
      try {
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.steps)) {
          const normalized = parsed.steps
            .filter((step) => step && typeof step.title === 'string')
            .map((step) => ({
              title: String(step.title).trim(),
              minutes: Number.isFinite(Number(step.minutes))
                ? Math.max(5, Number(step.minutes))
                : 10,
            }))
            .slice(0, 6);

          if (normalized.length > 0) {
            return sendJson(response, 200, {
              steps: normalized,
              source: 'gigachat',
            });
          }
        }
      } catch {
        // если ИИ прислал невалидный JSON — падаем в fallback
      }
    }

    return sendJson(response, 200, buildFallbackSteps(payload));
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected AI proxy error.',
    });
  }
}