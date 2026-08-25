-- ============================================================
-- BossFx Academy — Student Learning (PoC) schema
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Adds per-student lesson progress with Row-Level Security so a
-- student can only ever read/write their OWN rows. No service key,
-- no serverless function — the browser talks to Supabase directly
-- with the public anon key, and RLS enforces access.
-- ============================================================

create table if not exists lesson_progress (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    course_id     text not null,
    lesson_id     text not null,
    completed     boolean not null default true,
    completed_at  timestamptz not null default now(),
    unique (user_id, course_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on lesson_progress (user_id, course_id);

alter table lesson_progress enable row level security;

-- A student can only see their own progress
create policy "read own progress" on lesson_progress
    for select using (auth.uid() = user_id);

-- A student can only insert progress rows for themselves
create policy "insert own progress" on lesson_progress
    for insert with check (auth.uid() = user_id);

-- A student can update/delete only their own rows (e.g. un-mark complete)
create policy "update own progress" on lesson_progress
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own progress" on lesson_progress
    for delete using (auth.uid() = user_id);
