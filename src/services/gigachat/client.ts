// src/services/gigachat/client.ts

const FETCH_TIMEOUT = 15000; // 15 секунд

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function sendChatMessage(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const response = await fetchWithTimeout(
      '/api/ai/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      },
      FETCH_TIMEOUT
    );
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data.reply as string;
    }
  } catch (err) {
    // Тайм-аут или сетевая ошибка
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'Истекло время ожидания ответа. Попробуй позже.';
    }
  }
  return 'Извини, ИИ‑помощник сейчас недоступен. Попробуй позже.';
}
