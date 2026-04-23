import https from 'https';

// Агент для обхода проверок сертификата (как в вашем server.js)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

// Кэш токена в памяти
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const authUrl = process.env.GIGACHAT_AUTH_URL; // https://ngw.devices.sberbank.ru:9443/api/v2/oauth
  const authorizationKey = process.env.GIGACHAT_AUTHORIZATION_KEY; // Basic-ключ
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

  if (!authUrl || !authorizationKey) {
    throw new Error('GIGACHAT_AUTH_URL and GIGACHAT_AUTHORIZATION_KEY are required');
  }

  // Используем кэшированный токен, если он ещё жив (с запасом 60 с)
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(), // Генерируем уникальный UUID
      Authorization: `Basic ${authorizationKey}`,
    },
    body: new URLSearchParams({ scope }),
    // @ts-ignore - передаём агент в fetch (работает в Node.js 18+)
    agent: httpsAgent,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth error: ${response.status} ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
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

    // 1. Получаем токен (быстро, если закэширован)
    const accessToken = await getAccessToken();

    // 2. Запрос к GigaChat с потоком
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
      return new Response(JSON.stringify({ error: errText }), {
        status: gigaResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Проксируем SSE-поток клиенту
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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));
                  }
                } catch {}
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
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
