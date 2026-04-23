let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

async function requestToken() {
  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
  const authUrl = process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

  if (!clientId || !clientSecret) {
    return null;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      RqUID: crypto.randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      scope,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain GigaChat token: ${response.status}`);
  }

  const payload = await response.json();
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in ?? 0) - 60, 0) * 1000,
  };

  return tokenCache.accessToken;
}

export async function getGigaChatToken() {
  if (tokenCache.accessToken && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  return requestToken();
}

export async function callGigaChat(messages) {
  const apiUrl = process.env.GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
  const token = await getGigaChatToken();

  if (!token) {
    return null;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'GigaChat',
      temperature: 0.3,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`GigaChat request failed: ${response.status}`);
  }

  return response.json();
}
