-- ================================================================
-- bootcamp_registrations — free bootcamp signups (WhatsApp-first)
-- Run once in Supabase → SQL Editor → New query → Run.
-- Export anytime: Table Editor → bootcamp_registrations → Export → CSV.
-- ================================================================
create table if not exists public.bootcamp_registrations (
    id          bigserial primary key,
    cohort      text        not null,              -- e.g. oshodi-nov-2026
    name        text        not null,
    whatsapp    text        not null,              -- normalised, +234…
    email       text,
    age_range   text,
    area        text,
    experience  text,
    ref         text,                              -- who sent them (oshodi, telegram, ig…)
    created_at  timestamptz not null default now(),
    unique (cohort, whatsapp)
);
create index if not exists idx_bootcamp_cohort on public.bootcamp_registrations (cohort, created_at desc);

alter table public.bootcamp_registrations enable row level security;   -- server-only
grant select, insert on public.bootcamp_registrations to service_role;
grant usage, select on sequence public.bootcamp_registrations_id_seq to service_role;
