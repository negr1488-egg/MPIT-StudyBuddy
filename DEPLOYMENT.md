# Deployment Guide

## Vercel

Проект готовится под Vercel как SPA + serverless API.

### 1. Import project

1. Подключи GitHub repository в Vercel.
2. Framework preset: `Vite`.

### 2. Environment Variables

Добавь в Vercel:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GIGACHAT_CLIENT_ID=
GIGACHAT_CLIENT_SECRET=
GIGACHAT_SCOPE=
GIGACHAT_AUTH_URL=
GIGACHAT_API_URL=
```

Важно:

- `VITE_*` доступны клиенту;
- `GIGACHAT_*` должны жить только на сервере;
- клиент не должен видеть `CLIENT_SECRET`.

### 3. API proxy

В проекте уже есть serverless endpoints:

- `/api/ai/task-parse`
- `/api/ai/reminders`
- `/api/ai/analytics`

Они используют:

- `api/_lib/gigachat.js`
- token caching
- fallback на mock response, если GigaChat недоступен

### 4. SPA fallback

Для SPA fallback добавлен [vercel.json](./vercel.json).

### 5. Build

```bash
npm install
npm run build
```

### 6. Preview Deployments

После подключения GitHub Vercel автоматически создаст:

- production deployment для main branch
- preview deployment для pull requests
