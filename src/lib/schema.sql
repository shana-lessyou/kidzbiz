-- ================================================================
-- KidzBiz schema
-- Run this once in your Supabase SQL editor (Database > SQL Editor)
-- ================================================================

-- ── Families ──────────────────────────────────────────────────
-- One row per parent account; id = Supabase Auth user id
create table if not exists families (
  id                     uuid primary key references auth.users on delete cascade,
  email                  text not null,
  plan_tier              text not null default 'free'
                           check (plan_tier in ('free','family','class')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

-- Migration: run this if you created families before this update
-- alter table families add column if not exists stripe_customer_id text;
-- alter table families add column if not exists stripe_subscription_id text;

alter table families enable row level security;

create policy "family: own row only"
  on families for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Children ──────────────────────────────────────────────────
create table if not exists children (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  name        text not null,
  age         int,
  pin         text,                   -- plain 4-digit; hash in v2
  coach_name  text not null default 'Claude',
  created_at  timestamptz not null default now()
);

alter table children enable row level security;

create policy "children: family only"
  on children for all
  using (family_id = auth.uid())
  with check (family_id = auth.uid());

-- ── Businesses ────────────────────────────────────────────────
create table if not exists businesses (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children on delete cascade,
  family_id   uuid not null references families on delete cascade,
  name        text not null,
  description text,
  budget      integer,          -- startup budget in dollars
  launch_date date,             -- target launch / first sale date
  created_at  timestamptz not null default now()
);

alter table businesses enable row level security;

create policy "businesses: family only"
  on businesses for all
  using (family_id = auth.uid())
  with check (family_id = auth.uid());

-- ── Task states ───────────────────────────────────────────────
-- One row per task per business; upserted on drag/complete
create table if not exists task_states (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses on delete cascade,
  family_id    uuid not null references families on delete cascade,
  task_id      text not null,
  phase_key    text not null,
  status       text not null default 'todo'
                 check (status in ('todo','inprogress','done')),
  updated_at   timestamptz not null default now(),
  unique (business_id, task_id)
);

alter table task_states enable row level security;

create policy "task_states: family only"
  on task_states for all
  using (family_id = auth.uid())
  with check (family_id = auth.uid());

-- ── Chat messages ─────────────────────────────────────────────
-- task_id = null means the general coach chat sidebar
create table if not exists chat_messages (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses on delete cascade,
  family_id    uuid not null references families on delete cascade,
  task_id      text,
  role         text not null check (role in ('user','assistant')),
  content      text not null,
  created_at   timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "chat_messages: family only"
  on chat_messages for all
  using (family_id = auth.uid())
  with check (family_id = auth.uid());

-- ── Notifications (kid → parent requests) ─────────────────────
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families on delete cascade,
  child_id      uuid not null references children on delete cascade,
  child_name    text not null,
  business_id   uuid references businesses on delete set null,
  business_name text,
  message       text not null,
  status        text not null default 'pending'
                  check (status in ('pending','approved','denied')),
  created_at    timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications: family only"
  on notifications for all
  using (family_id = auth.uid())
  with check (family_id = auth.uid());

-- ── Usage logs (AI cost tracking) ────────────────────────────────────────
-- One row per claude-chat API call. Used to track cost-per-user and enforce
-- rate limits. call_type: 'chat' | 'artifact' | 'vision'
create table if not exists usage_logs (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families on delete cascade,
  child_id      uuid references children on delete set null,
  business_id   uuid references businesses on delete set null,
  task_id       text,
  call_type     text not null default 'chat'
                  check (call_type in ('chat','artifact','vision')),
  input_tokens  int  not null default 0,
  cached_tokens int  not null default 0,
  output_tokens int  not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  created_at    timestamptz not null default now()
);

alter table usage_logs enable row level security;

-- Families can read their own usage (for showing stats in parent console)
create policy "usage_logs: family read own"
  on usage_logs for select
  using (family_id = auth.uid());

-- Only service role can insert (edge function uses service key)

-- ── Family stats view (cost vs revenue per family) ────────────────────────
-- Run: SELECT * FROM family_stats ORDER BY net_contribution_usd ASC
-- to find families costing more than they're paying.
create or replace view family_stats as
select
  f.id                                                    as family_id,
  f.email,
  f.plan_tier,
  f.created_at,
  case f.plan_tier
    when 'family' then 12.00
    when 'class'  then 29.00
    else 0
  end                                                     as monthly_revenue_usd,
  coalesce(u.total_cost,     0)                           as lifetime_cost_usd,
  coalesce(u.month_cost,     0)                           as month_cost_usd,
  coalesce(u.total_messages, 0)                           as total_messages,
  coalesce(u.month_messages, 0)                           as month_messages,
  case f.plan_tier
    when 'family' then 12.00 - coalesce(u.month_cost, 0)
    when 'class'  then 29.00 - coalesce(u.month_cost, 0)
    else               0     - coalesce(u.month_cost, 0)
  end                                                     as net_contribution_usd
from families f
left join (
  select
    family_id,
    sum(cost_usd)                                         as total_cost,
    sum(case when created_at >= date_trunc('month', now()) then cost_usd  else 0 end) as month_cost,
    count(*)                                              as total_messages,
    count(case when created_at >= date_trunc('month', now()) then 1 end)              as month_messages
  from usage_logs
  group by family_id
) u on u.family_id = f.id;

-- ── Migration: add budget/launch_date to existing businesses ───
-- Run this if you created the businesses table before this update:
-- alter table businesses add column if not exists budget integer;
-- alter table businesses add column if not exists launch_date date;
