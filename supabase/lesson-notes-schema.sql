-- ============================================================
-- BossFx Academy — Student lesson notes / journal (cross-device)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Per-student notes with Row-Level Security so a student can only
-- ever read/write their OWN notes. Browser talks to Supabase directly
-- with the public anon key; RLS enforces access. No service key needed.
-- Until this is run, notes fall back to on-device (browser) storage.
-- ============================================================

create table if not exists lesson_notes (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    course_id     text not null,
    lesson_id     text not null,
    content       text not null default '',
    updated_at    timestamptz not null default now(),
    unique (user_id, course_id, lesson_id)
);

create index if not exists lesson_notes_user_idx on lesson_notes (user_id, course_id);

alter table lesson_notes enable row level security;

-- A student can only see their own notes
create policy "read own notes" on lesson_notes
    for select using (auth.uid() = user_id);

-- A student can only insert notes for themselves
create policy "insert own notes" on lesson_notes
    for insert with check (auth.uid() = user_id);

-- A student can update only their own notes
create policy "update own notes" on lesson_notes
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A student can delete only their own notes
create policy "delete own notes" on lesson_notes
    for delete using (auth.uid() = user_id);
