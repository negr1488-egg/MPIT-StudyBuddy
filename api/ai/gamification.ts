// api/ai/gamification.ts
export const config = { runtime: 'edge' };
import { callMistral } from '../_lib/mistral.js';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const stats = await req.json();

    const systemPrompt = `Ты — геймификатор StudyBuddy. На основе статистики ученика предложи:
- 3 достижения (achievements): каждое с названием, описанием и иконкой-эмодзи,
- 2 еженедельные цели (goals): конкретные, измеримые,
- 1 персональный челлендж (challenge): интересное задание на неделю.
Верни JSON: { "achievements": [ { "title", "description", "icon" } ], "goals": [ { "title", "description", "target", "reward" } ], "challenge": { "title", "description", "reward" } }`;

    const result = await callMistral([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(stats) },
    ]).catch(() => null);

    if (result) {
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch {}
    }

    const fallback = {
      achievements: [
        { title: 'Начинающий', description: 'Выполни 5 задач', icon: '🌟' },
        { title: 'Упорный', description: 'Неделя без просрочек', icon: '🔥' },
        { title: 'Знаток', description: 'Получи 100 баллов', icon: '🧠' },
      ],
      goals: [
        { title: 'Выполнить 10 задач', description: 'До конца недели', target: 10, reward: '50 баллов' },
        { title: 'Не допустить просрочек', description: 'Все задачи вовремя', target: 0, reward: '30 баллов' },
      ],
      challenge: {
        title: 'Решить дополнительную задачу по любимому предмету',
        description: 'Выбери самый сложный предмет и сделай одно дополнительное задание',
        reward: '20 баллов',
      },
    };
    return new Response(JSON.stringify(fallback), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Gamification error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
