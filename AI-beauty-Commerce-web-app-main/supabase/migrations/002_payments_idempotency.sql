-- Migration 002 — payments ledger with idempotency (proposal §4: secure webhook + idempotency).
-- Apply in order after supabase/schema.sql. Idempotent (IF NOT EXISTS / ON CONFLICT-safe).
-- Why: the browser must NEVER confirm a payment. Only the verified webhook writes here.

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null default 'paystack' check (provider in ('paystack','flutterwave')),
  reference text unique not null,
  amount_ngn integer not null check (amount_ngn > 0),
  status text not null default 'pending'
    check (status in ('pending','success','failed','abandoned')),
  idempotency_key text unique,
  raw_event jsonb not null default '{}',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_reference on public.payments(reference);

-- Automation dedupe log (proposal §7: one reminder max, recorded to prevent duplicates).
create table if not exists public.automation_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  order_id text references public.orders(id) on delete set null,
  automation_type text not null
    check (automation_type in ('abandoned_cart','inactivity','post_purchase','review_request')),
  channel text not null default 'email' check (channel in ('email','whatsapp','sms')),
  sent_at timestamptz not null default now(),
  unique(cart_id, automation_type),
  unique(order_id, automation_type)
);

-- Behaviour event stream foundation (Phase 2 personalization; proposal §6).
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  event_type text not null,
  product_id text references public.products(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_events_user_time on public.events(user_id, created_at desc);
create index if not exists idx_events_type_time on public.events(event_type, created_at desc);

alter table public.payments enable row level security;
alter table public.automation_log enable row level security;
alter table public.events enable row level security;

-- No public policies: browser has zero access. Service_role (Edge Functions) bypasses RLS.
-- Owner read-back of own payments via their orders:
drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists "own events" on public.events;
create policy "own events" on public.events for select using (auth.uid() = user_id);
