-- TaskNama: cloud backup schema.
--
-- Run this once in the Supabase SQL editor (Project -> SQL Editor). It is safe to
-- re-run: tables and policies are only created when missing, and no data is
-- dropped or seeded.
--
-- The app is local-first. These tables hold a copy of what is on the device,
-- written by "Upload to cloud" and read by "Restore from cloud" in Settings.
-- Column names map 1:1 to src/features/sync/row-mappers.ts.
--
-- Every table is prefixed `tm_` so it can live in the same Supabase project as
-- other apps, including the earlier version of this one, which had its own
-- `tasks` and `categories` tables. Nothing here touches those.
--
-- Ids are `text`, not `uuid`: the app generates them with nanoid on the device.
-- Timestamps are written by the client, so there is deliberately no
-- `updated_at` trigger; a restore must give back exactly what was uploaded.
-- Settings (theme, defaults) are per-device and are not stored here.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists tm_projects (
  id         text primary key,
  name       text not null,
  color      text not null default 'teal',
  archived   boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists tm_tags (
  id         text primary key,
  name       text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists tm_tasks (
  id           text primary key,
  title        text not null,
  description  text not null default '',
  completed    boolean not null default false,
  completed_at timestamptz,
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  -- Calendar date and wall-clock time exactly as the app stores them
  -- ("2026-09-21" and "14:30"); not instants, so no time-zone shifting.
  due_date     date,
  due_time     text,
  -- Deleting a project moves its tasks to Inbox, hence `set null`, not `cascade`.
  project_id   text references tm_projects(id) on delete set null,
  tag_ids      text[] not null default '{}',
  -- Nested structures the app reads and writes whole.
  subtasks     jsonb not null default '[]',
  reminder     jsonb,
  recurrence   jsonb,
  created_at   timestamptz not null,
  updated_at   timestamptz not null
);

create table if not exists tm_focus_sessions (
  id           text primary key,
  -- A session has no meaning without its task.
  task_id      text not null references tm_tasks(id) on delete cascade,
  duration_ms  bigint not null check (duration_ms > 0),
  status       text not null check (status in ('running', 'paused', 'completed', 'stopped')),
  started_at   timestamptz not null,
  -- Epoch milliseconds, exactly as the app keeps them.
  ends_at      bigint,
  remaining_ms bigint,
  finished_at  timestamptz,
  acknowledged boolean not null default true
);

create index if not exists tm_tasks_project_id_idx on tm_tasks (project_id);
create index if not exists tm_focus_sessions_task_id_idx on tm_focus_sessions (task_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
--
-- The app has no accounts, so it talks to Postgres as the `anon` role. RLS is
-- still enabled: leaving it off exposes the tables with no policy to point at.
-- These policies give `anon` full access, which makes this an open single-user
-- backend: anyone holding your project URL and anon key can read and overwrite
-- it. Use a dedicated Supabase project for it, and do not put anything
-- sensitive in your tasks.
--
-- Before adding accounts, add a `user_id uuid default auth.uid()` column to every
-- table and replace these with `using (auth.uid() = user_id)` policies.

alter table tm_projects       enable row level security;
alter table tm_tags           enable row level security;
alter table tm_tasks          enable row level security;
alter table tm_focus_sessions enable row level security;

drop policy if exists "anon full access to tm_projects" on tm_projects;
create policy "anon full access to tm_projects"
  on tm_projects for all to anon using (true) with check (true);

drop policy if exists "anon full access to tm_tags" on tm_tags;
create policy "anon full access to tm_tags"
  on tm_tags for all to anon using (true) with check (true);

drop policy if exists "anon full access to tm_tasks" on tm_tasks;
create policy "anon full access to tm_tasks"
  on tm_tasks for all to anon using (true) with check (true);

drop policy if exists "anon full access to tm_focus_sessions" on tm_focus_sessions;
create policy "anon full access to tm_focus_sessions"
  on tm_focus_sessions for all to anon using (true) with check (true);
