create extension if not exists pgcrypto;

create table if not exists public.support_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'support' check (role = 'support'),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_by_uid text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('firm_create', 'firm_update', 'brand_assets', 'offer', 'content', 'cms_update')),
  target_collection text not null check (target_collection in ('firms', 'offers', 'reviews', 'firmReviews', 'firmReviewProfiles', 'firmRatingStats', 'giveaways', 'upcomingEvents', 'purchases', 'bonusOffers', 'propNewsPosts', 'propNewsVideos', 'tradingGuidesPosts', 'tradingGuidesVideos', 'fundingStrategiesPosts', 'fundingStrategiesVideos', 'tradingPsychologyPosts', 'tradingPsychologyVideos', 'beginnerTutorialsPosts', 'beginnerTutorialsVideos', 'pageHeadingsParagraphs', 'pageCopy', 'pageSeoContent', 'pageFaqs')),
  target_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'approved', 'rejected')),
  submitted_by_role text not null default 'support' check (submitted_by_role = 'support'),
  created_by_uid uuid not null references auth.users(id),
  created_by_name text not null,
  proposed_changes jsonb not null default '{}'::jsonb,
  rejection_reason text,
  reviewed_by_uid text,
  reviewed_by_name text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_uid text not null,
  actor_role text not null check (actor_role in ('support', 'ceo')),
  actor_name text,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.support_submissions drop constraint if exists support_submissions_submission_type_check;
alter table public.support_submissions add constraint support_submissions_submission_type_check
  check (submission_type in ('firm_create', 'firm_update', 'brand_assets', 'offer', 'content', 'cms_update'));

alter table public.support_submissions drop constraint if exists support_submissions_target_collection_check;
alter table public.support_submissions add constraint support_submissions_target_collection_check
  check (target_collection in ('firms', 'offers', 'reviews', 'firmReviews', 'firmReviewProfiles', 'firmRatingStats', 'giveaways', 'upcomingEvents', 'purchases', 'bonusOffers', 'propNewsPosts', 'propNewsVideos', 'tradingGuidesPosts', 'tradingGuidesVideos', 'fundingStrategiesPosts', 'fundingStrategiesVideos', 'tradingPsychologyPosts', 'tradingPsychologyVideos', 'beginnerTutorialsPosts', 'beginnerTutorialsVideos', 'pageHeadingsParagraphs', 'pageCopy', 'pageSeoContent', 'pageFaqs'));

create index if not exists support_profiles_status_idx on public.support_profiles (role, status);
create index if not exists support_submissions_queue_idx on public.support_submissions (status, created_at desc);
create index if not exists support_submissions_author_idx on public.support_submissions (created_by_uid, created_at desc);
create index if not exists support_audit_logs_actor_idx on public.support_audit_logs (actor_uid, created_at desc);

alter table public.support_profiles enable row level security;
alter table public.support_submissions enable row level security;
alter table public.support_audit_logs enable row level security;

drop policy if exists "No direct client access to support profiles" on public.support_profiles;
create policy "No direct client access to support profiles"
on public.support_profiles for all using (false) with check (false);

drop policy if exists "No direct client access to support submissions" on public.support_submissions;
create policy "No direct client access to support submissions"
on public.support_submissions for all using (false) with check (false);

drop policy if exists "No direct client access to support audit logs" on public.support_audit_logs;
create policy "No direct client access to support audit logs"
on public.support_audit_logs for all using (false) with check (false);

revoke all on public.support_profiles from anon, authenticated;
revoke all on public.support_submissions from anon, authenticated;
revoke all on public.support_audit_logs from anon, authenticated;
