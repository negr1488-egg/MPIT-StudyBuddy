// src/services/gigachat/client.ts

const FETCH_TIMEOUT = 15000;

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

export async function sendChatMessage(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Chat API error:', response.status, errText);
      return 'Ошибка соединения с ИИ. Попробуй позже.';
    }

    const reader = response.body?.getReader();
    if (!reader) return 'Ошибка: ответ не содержит поток.';

    const decoder = new TextDecoder();
    let fullReply = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const token = JSON.parse(data);
            if (typeof token === 'string') fullReply += token;
          } catch {
            // игнорируем битые чанки
          }
        }
      }
    }

    return fullReply || 'ИИ вернул пустой ответ.';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'Истекло время ожидания ответа. Попробуй позже.';
    }
    return 'Извини, ИИ‑помощник сейчас недоступен. Попробуй позже.';
  }
}
