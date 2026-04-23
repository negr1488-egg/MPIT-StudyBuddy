// api/_lib/mistral.ts
export async function callMistral(messages: { role: string; content: string }[], options?: {
  temperature?: number;
  responseFormat?: { type: string };
}): Promise<string | null> {
  const API_KEY = process.env.MISTRAL_API_KEY;
  if (!API_KEY) throw new Error('MISTRAL_API_KEY not set');

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages,
      temperature: options?.temperature ?? 0.3,
      response_format: options?.responseFormat ?? { type: 'json_object' },
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Mistral API error:', response.status, text);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}
