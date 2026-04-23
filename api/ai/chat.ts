// api/ai/chat.ts
export const config = {
  runtime: 'edge',
};

// Кэш токена
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  const authUrl = process.env.GIGACHAT_AUTH_URL;
  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
  const scope = process.env.GIGACHAT_SCOPE;

  if (!authUrl || !clientId || !clientSecret) {
    throw new Error(
      'Missing OAuth credentials. Ensure GIGACHAT_AUTH_URL, GIGACHAT_CLIENT_ID, GIGACHAT_CLIENT_SECRET are set in Vercel.'
    );
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  if (scope) params.append('scope', scope);

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
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

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Явно проверяем GIGACHAT_API_URL
    const GIGACHAT_API_URL = process.env.GIGACHAT_API_URL;
    if (!GIGACHAT_API_URL) {
      console.error('GIGACHAT_API_URL is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: GIGACHAT_API_URL missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken();

    const gigaResponse = await fetch(GIGACHAT_API_URL, {
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

    const reader = gigaResponse.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response stream from GigaChat' }), {
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
                } catch {
                  // невалидный JSON – пропускаем
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
    // Логируем реальную ошибку, чтобы увидеть в логах Vercel
    console.error('Chat handler error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
