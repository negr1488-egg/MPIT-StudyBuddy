# StudyBuddy

StudyBuddy — production-oriented edtech платформа для школьных задач, прогресса и взаимодействия между учеником, учителем и родителем.

Проект уже поддерживает два режима:

- `Demo mode` — без backend, на localStorage и mock-data;
- `Supabase mode` — если заданы env-переменные, приложение использует Supabase auth и data layer.

## Product Flow

```text
Landing -> Register/Login -> Role Selection -> Dashboard -> Tasks -> Notifications -> AI Insights
```

## Tech Stack

- Vite
- React 18
- Tailwind CSS
- Supabase
- Vercel serverless API
- GigaChat proxy layer

## Architecture

```text
src/
  app/
    layouts/
    providers/
    router/
  shared/
    config/
    constants/
    lib/
  entities/
    user/
    task/
    notification/
    goal/
    achievement/
  services/
    auth/
    gigachat/
    storage/
    supabase/
  widgets/
    navbar/
    sidebar/
    dashboard-header/
    progress-overview/
    notifications-panel/
  pages/
    landing/
    login/
    register/
    student-dashboard/
    teacher-dashboard/
    parent-dashboard/
  features/
    tracker/
      components/
      hooks/
      mocks/
      pages/
      types/
      utils/
```

## Environment Variables

Смотри [.env.example](./.env.example)

### Client

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Server / Vercel

```bash
GIGACHAT_CLIENT_ID=
GIGACHAT_CLIENT_SECRET=
GIGACHAT_SCOPE=
GIGACHAT_AUTH_URL=
GIGACHAT_API_URL=
```

## Run Locally

```bash
npm install
npm run dev
```

Если PowerShell блокирует `npm`:

```bash
npm.cmd run dev
```

Обычно приложение будет доступно по адресу:

```text
http://localhost:5173/
```

## Build

```bash
npm run build
```

## Supabase

### What is implemented

- email/password auth layer;
- session restore;
- role-aware profile storage;
- typed Supabase client;
- services for auth, tasks, notifications, analytics;
- prepared SQL schema and base RLS.

### Setup

1. Создай проект в Supabase.
2. Выполни [supabase-schema.sql](./supabase-schema.sql).
3. Укажи `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.

Подробности: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## GigaChat

AI-вызовы идут не из браузера напрямую, а через backend proxy:

- `/api/ai/task-parse`
- `/api/ai/reminders`
- `/api/ai/analytics`

Это защищает секреты и готовит архитектуру к production deployment.

## Vercel

Для Vercel уже добавлены:

- [vercel.json](./vercel.json)
- serverless API routes в `api/`
- env-driven конфигурация

Подробности: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Demo Accounts

В demo mode доступны:

- `student@studybuddy.local` / `123456`
- `teacher@studybuddy.local` / `123456`
- `parent@studybuddy.local` / `123456`

## Current Product Surface

### Landing

- hero;
- how it works;
- role cards;
- CTA sections.

### Auth

- register;
- login;
- role redirect;
- session restore;
- protected app routing.

### Student dashboard

- today / upcoming / overdue / completed;
- progress;
- notifications;
- AI insights;
- task creation;
- smart task parsing.

### Teacher dashboard

- created tasks;
- review/status overview;
- editable comments;
- AI recommendations.

### Parent dashboard

- child progress;
- overdue alerts;
- notifications;
- AI parent insights.

## Production Notes

Проект специально собран так, чтобы:

- не хранить AI secrets в клиенте;
- иметь fallback, если Supabase или GigaChat недоступны;
- запускаться как demo даже без backend;
- быть готовым к следующему шагу — полноценному SaaS deployment.
