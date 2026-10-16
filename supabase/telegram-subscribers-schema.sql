-- ================================================================
-- telegram_subscribers — DM funnel state for the BossFx Telegram bot
-- Run once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Server-only table (written by the bot via the service role).
-- ================================================================

create table if not exists public.telegram_subscribers (
    chat_id       bigint primary key,            -- Telegram private chat id
    first_name    text,
    username      text,
    step          integer     not null default 0,       -- promo steps sent
    status        text        not null default 'active', -- active | done | stopped
    start_at      timestamptz not null default now(),
    last_sent_at  timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists idx_tg_sub_status on public.telegram_subscribers (status);

-- Lock it down: RLS on, no public policies. Only the service role (the bot)
-- touches it. The service role bypasses RLS but still needs table grants.
alter table public.telegram_subscribers enable row level security;
grant select, insert, update on public.telegram_subscribers to service_role;
