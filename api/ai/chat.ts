// api/ai/chat.ts
import https from 'https';

// Агент для OAuth-запроса на порт 9443 (сертификат может быть самоподписным)
const authAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

// Кэш токена доступа в памяти (живёт между вызовами функции)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Делает POST-запрос к /api/v2/oauth с Basic-авторизацией
 * и возвращает Access Token.
 */
function fetchAccessToken(): Promise<string> {
  const authUrl = process.env.GIGACHAT_AUTH_URL; // https://ngw.devices.sberbank.ru:9443/api/v2/oauth
  const authorizationKey = process.env.GIGACHAT_AUTHORIZATION_KEY; // Basic-ключ
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

  if (!authUrl || !authorizationKey) {
    throw new Error('GIGACHAT_AUTH_URL and GIGACHAT_AUTHORIZATION_KEY must be set');
  }

  const body = new URLSearchParams({ scope }).toString();

  // Разбираем URL, чтобы использовать https.request
  const url = new URL(authUrl);
  const options: https.RequestOptions = {
    hostname: url.hostname,
    port: url.port || 9443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${authorizationKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
    agent: authAgent,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`OAuth error: ${res.statusCode} ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.access_token);
        } catch (e) {
          reject(new Error('Failed to parse OAuth response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken(): Promise<string> {
  // Если токен ещё не истёк (с запасом 60 секунд), возвращаем его
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // Получаем новый токен
  const token = await fetchAccessToken();
  cachedToken = token;
  // GigaChat даёт expires_in в секундах (обычно 1800 = 30 мин)
  // Запоминаем время истечения с запасом в 60 секунд
  // Предполагаем, что срок жизни 30 мин, но лучше парсить из ответа, если возможно.
  // Мы не парсим expires_in в этом упрощённом варианте, поэтому ставим 29 минут.
  tokenExpiresAt = Date.now() + 29 * 60 * 1000;
  return token;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiUrl =
      process.env.GIGACHAT_API_URL ||
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Получаем свежий токен доступа
    const accessToken = await getAccessToken();

    // 2. Отправляем запрос к GigaChat с включённым потоком (stream: true)
    const gigaResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: [
          {
            role: 'system',
            content:
              'Ты — дружелюбный помощник StudyBuddy. Отвечай кратко, по делу, на русском языке. Помогай с учёбой.',
          },
          ...messages,
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!gigaResponse.ok) {
      const errText = await gigaResponse.text();
      console.error('GigaChat API error:', gigaResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `GigaChat API error: ${gigaResponse.status}` }),
        { status: gigaResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Проксируем поток ответа клиенту как Server-Sent Events
    const reader = gigaResponse.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response body' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(token)}\n\n`)
                    );
                  }
                } catch {
                  // игнорируем невалидные чанки
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream read error:', err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Handler error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
