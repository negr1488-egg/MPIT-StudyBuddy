// api/ai/analytics.js
export const config = { runtime: 'edge' };
import { callMistral } from '../_lib/mistral.js';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { tasks } = await req.json();
    const taskList = Array.isArray(tasks) ? tasks : [];

    const fallback = {
      insight: 'Слабое место сейчас — математика: здесь чаще скапливаются рискованные задачи.',
      riskLevel: 'medium',
      recommendation: 'Смести часть математических задач на более ранний день недели.',
    };

    if (taskList.length === 0) {
      return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await callMistral([
      {
        role: 'system',
        content:
          'Ты аналитик StudyBuddy. Проанализируй список задач и верни JSON: { "insight": "строка", "riskLevel": "low|medium|high", "recommendation": "строка" }',
      },
      { role: 'user', content: JSON.stringify(taskList) },
    ]).catch(() => null);

    if (result) {
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch {}
    }

    return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
