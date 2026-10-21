-- ================================================================
-- telegram_jobs + on-time scheduler for the BossFx Telegram bot
-- Run ONCE in Supabase → SQL Editor → New query.
--
-- Why: GitHub Actions cron fired 5–7 hours late. pg_cron fires on the minute,
-- calling the bot every 5 min; lib/telegram-jobs.js decides what is due
-- (London/NY times follow daylight saving automatically).
--
-- BEFORE RUNNING: replace PASTE_TELEGRAM_WEBHOOK_SECRET_HERE (step 2) with the
-- same value as the Vercel env var TELEGRAM_WEBHOOK_SECRET.
-- ================================================================

-- 1) Job log: one row per scheduled post / founder signal (also stops double-posting)
create table if not exists public.telegram_jobs (
    id              bigserial primary key,
    job_key         text        not null unique,   -- e.g. brief_ny:2026-10-21, signal:<ms>
    kind            text        not null,          -- levels_london | brief_london | levels_ny | brief_ny | review | weekend | signal | review_manual
    status          text        not null default 'pending', -- pending | posting | posted | posted_auto | skipped | expired | failed
    draft           jsonb       not null,          -- the rendered Telegram message
    note            text,                          -- founder's added take
    post_at         timestamptz,                   -- scheduled channel time (null = waits for founder tap)
    founder_msg_id  bigint,                        -- preview message in the founder DM
    channel_msg_id  bigint,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index if not exists idx_tg_jobs_pending on public.telegram_jobs (status, post_at);
create index if not exists idx_tg_jobs_founder_msg on public.telegram_jobs (founder_msg_id);

alter table public.telegram_jobs enable row level security;   -- no public policies: bot-only
grant select, insert, update on public.telegram_jobs to service_role;
grant usage, select on sequence public.telegram_jobs_id_seq to service_role;

-- 2) Store the bot secret in Supabase Vault (encrypted, not in plain SQL later)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select vault.create_secret('PASTE_TELEGRAM_WEBHOOK_SECRET_HERE', 'telegram_webhook_secret');

-- 3) The heartbeat: every 5 minutes, every day
select cron.schedule(
    'bossfx-telegram-tick',
    '*/5 * * * *',
    $$
    select net.http_post(
        url     := 'https://bossfxcademy.com/api/telegram-webhook',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'telegram_webhook_secret')
        ),
        body    := '{"type":"tick"}'::jsonb,
        timeout_milliseconds := 25000
    );
    $$
);

-- Check it's running (after ~5 min):
--   select status, created, content::text from net._http_response order by created desc limit 5;
--   select * from public.telegram_jobs order by created_at desc limit 10;
-- Pause:   select cron.unschedule('bossfx-telegram-tick');
