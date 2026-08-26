-- ================================================================
-- enrollments — paid course access (Forex 101 "full" unlock)
-- Run once in the Supabase SQL Editor (project: bossfxcademy-prod,
-- ref kklwvzpwgpcwxjmgikfq).
--
-- Model: modules 1-3 of Forex 101 are free to any signed-in student;
-- modules 4-12 unlock when a row exists here for their email.
-- Rows are written ONLY by the server (Flutterwave webhook, service
-- role) or manually by the owner — students can READ their own but
-- never insert/update, so no one can self-grant paid access.
-- ================================================================

create table if not exists enrollments (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    course_id text not null,
    status text not null default 'active',   -- 'active' | 'revoked'
    source text,                             -- 'flutterwave' | 'manual' | ...
    tx_ref text,                             -- payment reference, for audit
    granted_at timestamptz not null default now(),
    unique (email, course_id)
);

create index if not exists enrollments_email_idx on enrollments (lower(email), course_id);

alter table enrollments enable row level security;

-- Students may read only their own enrollment rows (matched by the
-- email claim in their JWT, case-insensitive).
drop policy if exists "read own enrollments" on enrollments;
create policy "read own enrollments" on enrollments for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Read-only for logged-in users. No insert/update/delete grants:
-- writes happen through the service role, which bypasses RLS.
grant select on table public.enrollments to authenticated;

-- ---------------------------------------------------------------
-- Manual grant helper (owner use): give someone full access by email.
--   insert into enrollments (email, course_id, source)
--   values ('buyer@example.com', 'forex-101', 'manual')
--   on conflict (email, course_id) do update set status = 'active';
-- ---------------------------------------------------------------
