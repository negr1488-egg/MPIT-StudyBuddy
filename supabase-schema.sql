create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('student', 'teacher', 'parent')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  class_name text,
  parent_profile_id uuid references public.profiles(id) on delete set null
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject text
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text,
  deadline timestamptz not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('todo', 'in_progress', 'done', 'overdue')),
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_student_profile_id uuid not null references public.profiles(id) on delete cascade,
  teacher_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_value integer not null,
  current_value integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  unlocked_at timestamptz
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.parents enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.goals enable row level security;
alter table public.achievements enable row level security;
alter table public.ai_insights enable row level security;

create policy "profiles can read themselves"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles can update themselves"
on public.profiles for update
using (auth.uid() = id);

create policy "students can read their tasks"
on public.tasks for select
using (
  auth.uid() = assigned_student_profile_id
  or auth.uid() = created_by_profile_id
  or auth.uid() = teacher_profile_id
);

create policy "task owners can insert tasks"
on public.tasks for insert
with check (
  auth.uid() = created_by_profile_id
);

create policy "task owners can update tasks"
on public.tasks for update
using (
  auth.uid() = created_by_profile_id
  or auth.uid() = teacher_profile_id
  or auth.uid() = assigned_student_profile_id
);

create policy "task comments visible to related profiles"
on public.task_comments for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_comments.task_id
      and (
        tasks.assigned_student_profile_id = auth.uid()
        or tasks.created_by_profile_id = auth.uid()
        or tasks.teacher_profile_id = auth.uid()
      )
  )
);

create policy "notifications visible to owner"
on public.notifications for select
using (auth.uid() = profile_id);

create policy "goals visible to owner"
on public.goals for select
using (auth.uid() = profile_id);

create policy "achievements visible to owner"
on public.achievements for select
using (auth.uid() = profile_id);

create policy "ai insights visible to owner"
on public.ai_insights for select
using (auth.uid() = profile_id);
