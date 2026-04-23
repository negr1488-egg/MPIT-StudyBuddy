// /src/services/gigachat/client.ts

/**
 * Отправляет сообщения в чат-эндпоинт GigaChat.
 * На Vercel эндпоинт /api/ai/chat обрабатывается серверной функцией.
 * Локально, если эндпоинта нет, возвращает fallback-сообщение.
 */
export async function sendChatMessage(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data.reply as string;
    }
  } catch {
    // если сеть недоступна или на localhost нет /api/ai/chat
  }
  return 'Извини, ИИ‑помощник сейчас недоступен. Попробуй позже.';
}
