# Supabase Setup

## 1. Create Project

1. Создай новый проект в Supabase.
2. Открой SQL Editor.
3. Выполни содержимое файла [supabase-schema.sql](./supabase-schema.sql).

## 2. Environment Variables

Добавь в локальный `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3. Profiles and Roles

После регистрации приложение:

- создает пользователя через `auth.signUp`
- сохраняет роль в `profiles`
- использует роль для redirect в нужный кабинет

Роли:

- `student`
- `teacher`
- `parent`

## 4. Tables

В проекте уже подготовлены таблицы:

- `profiles`
- `students`
- `teachers`
- `parents`
- `tasks`
- `task_comments`
- `notifications`
- `goals`
- `achievements`
- `ai_insights`

## 5. RLS

В `supabase-schema.sql` уже заложены базовые Row Level Security policies:

- пользователь видит свои профили;
- пользователь видит связанные задачи;
- уведомления, комментарии, цели и достижения ограничены владельцем.

Перед продом стоит отдельно проверить реальные связи `student-parent` и `teacher-student`.
