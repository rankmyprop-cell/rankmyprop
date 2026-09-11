create extension if not exists pgcrypto;

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  uid text,
  user_email text not null,
  status text,
  amount numeric(12, 2),
  points integer,
  reason text,
  review_id text,
  firm text,
  method text,
  source_collection text,
  dedupe_key text,
  raw_payload jsonb not null default '{}'::jsonb,
  state text not null default 'queued',
  resend_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_notifications_event_idx on public.email_notifications (event_type, created_at desc);
create index if not exists email_notifications_user_idx on public.email_notifications (user_email, created_at desc);
create unique index if not exists email_notifications_dedupe_uq on public.email_notifications (dedupe_key) where dedupe_key is not null;

alter table public.email_notifications enable row level security;

drop policy if exists "No direct client access to email notifications" on public.email_notifications;
create policy "No direct client access to email notifications"
on public.email_notifications
for all
using (false)
with check (false);
