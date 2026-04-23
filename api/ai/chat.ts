// api/ai/chat.ts
const GIGACHAT_TOKEN = process.env.GIGACHAT_API_TOKEN;
const GIGACHAT_API = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400 });
    }

    const response = await fetch(GIGACHAT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GIGACHAT_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: [
          {
            role: 'system',
            content: 'Ты — дружелюбный помощник StudyBuddy. Отвечай кратко, по делу, на русском языке. Помогай с учёбой.',
          },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('GigaChat chat error:', response.status, errText);
      return new Response(JSON.stringify({ error: errText }), { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return new Response(JSON.stringify({ error: 'No reply from GigaChat' }), { status: 500 });
    }

    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error('Chat handler error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }), { status: 500 });
  }
}
