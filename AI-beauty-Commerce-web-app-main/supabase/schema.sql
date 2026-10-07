-- DEPRECATED PROTOTYPE — DO NOT USE FOR PRODUCTION.
-- Source of truth is backend/ (Drizzle + Postgres modular monolith).
-- This file is frozen for local Vite mocks only and will not receive
-- reservations/idempotency/outbox/variants fixes. See backend/README.md.
-- Desla!™ Backend — Supabase Postgres Schema (prototype, frozen)
-- Project: Desla Beauty and Lifestyle Limited (Lagos, Nigeria)
-- Stack: Supabase Postgres + Auth + Storage + Realtime | Redis (Upstash) for cache
-- How to apply: Supabase Dashboard > SQL Editor > paste this file > Run.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where possible.
--
-- Architecture:
--   Postgres (source of truth): profiles, categories, products, distributors,
--     inventory, creators, orders, order_items, tracking_steps, reviews,
--     community_posts, community_messages, vouchers, points_activity,
--     carts, cart_items, authenticity_codes
--   Redis (Upstash, cache only — never source of truth):
--     products:list, product:{id}, distributors:city:{city}, creator_code:{code},
--     categories:list, reviews:product:{id}, feed:community:latest
--     TTLs: catalog 3600s, city stock 300s, creator codes 600s, feed 120s

-- ============ EXTENSIONS ============
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============ PROFILES (linked to auth.users) ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null default '',
  phone text not null default '',
  avatar_url text not null default '',
  tier text not null default 'Bronze'
    check (tier in ('Bronze','Silver','Gold','Platinum','Obsidian')),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ CATEGORIES ============
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  item_count integer not null default 0,
  image_url text not null default '',
  is_featured boolean not null default false,
  description text not null default ''
);

-- ============ PRODUCTS ============
create table if not exists public.products (
  id text primary key,
  sku text unique,
  name text not null,
  brand text not null default 'DESLA!™',
  tagline text not null default '',
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  price integer not null,
  original_price integer,
  discount_percentage integer,
  image_url text not null default '',
  gallery_images text[] not null default '{}',
  category_id text not null default 'body-care' references public.categories(id),
  sub_category text not null default '',
  sizes text[] not null default '{}',
  in_stock boolean not null default true,
  stock_count integer not null default 0,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  is_flash_sale boolean not null default false,
  hashtag text,
  description text not null default '',
  what_it_does text[] not null default '{}',
  key_ingredients jsonb not null default '[]',
  how_to_use jsonb not null default '{}',
  who_its_for jsonb not null default '{}',
  brand_info jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_hashtag on public.products(hashtag);
create index if not exists idx_products_bestseller on public.products(is_bestseller) where is_bestseller = true;

-- ============ DISTRIBUTORS ============
create table if not exists public.distributors (
  id text primary key,
  name text not null,
  business_name text not null default '',
  city text not null,
  state text not null default '',
  address text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  verified boolean not null default true,
  tier text not null default 'Silver' check (tier in ('Bronze','Silver','Gold')),
  is_online_only boolean not null default false,
  pickup_available boolean not null default true,
  operating_hours text not null default '',
  rating numeric not null default 5.0,
  reviews_count integer not null default 0,
  stocked_skus text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_distributors_city on public.distributors(city);

-- ============ INVENTORY (normalized per-city stock) ============
-- Mirrors Product.distributorStock[] from the frontend mock.
create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  distributor_id text not null references public.distributors(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  city text not null,
  quantity integer not null default 0,
  available boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(distributor_id, product_id)
);
create index if not exists idx_inventory_city_product on public.inventory(city, product_id);
create index if not exists idx_inventory_product on public.inventory(product_id);

-- ============ CREATORS / AFFILIATES ============
create table if not exists public.creators (
  id text primary key,
  name text not null,
  handle text not null default '',
  platform text not null default 'Instagram'
    check (platform in ('Instagram','TikTok','YouTube')),
  niche text not null default '',
  avatar_url text not null default '',
  promo_code text unique not null,
  discount_percent integer not null default 10,
  commission_rate integer not null default 12,
  total_sales_ngn bigint not null default 0,
  commission_earned_ngn bigint not null default 0,
  clicks integer not null default 0,
  orders_count integer not null default 0,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_creators_promo on public.creators(promo_code);

-- ============ ORDERS ============
create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'Processing'
    check (status in ('Processing','Shipped','Delivered','Cancelled')),
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  fulfillment_type text not null default 'local' check (fulfillment_type in ('local','central')),
  distributor_city text,
  distributor_id text references public.distributors(id) on delete set null,
  creator_code text references public.creators(promo_code) on delete set null,
  payment_method text not null default '',
  payment_reference text,
  shipping_address jsonb not null default '{}',
  reviewed boolean not null default false
);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_city on public.orders(distributor_city);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null default '',
  brand text not null default '',
  size text not null default 'Standard',
  price integer not null default 0,
  quantity integer not null default 1,
  image_url text not null default ''
);
create index if not exists idx_order_items_order on public.order_items(order_id);

create table if not exists public.tracking_steps (
  id uuid primary key default uuid_generate_v4(),
  order_id text not null references public.orders(id) on delete cascade,
  position integer not null default 0,
  title text not null default '',
  timestamp text not null default '',
  status text not null default 'upcoming'
    check (status in ('completed','current','upcoming')),
  description text not null default ''
);
create index if not exists idx_tracking_order on public.tracking_steps(order_id);

-- ============ REVIEWS ============
create table if not exists public.reviews (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  product_sku text,
  author_name text not null default '',
  author_avatar text not null default '',
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  comment text not null default '',
  verified_purchase boolean not null default false,
  city text,
  skin_type text,
  photo_url text,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_product on public.reviews(product_id);

create table if not exists public.review_helpful (
  review_id text not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ============ COMMUNITY POSTS & MESSAGES ============
create table if not exists public.community_posts (
  id text primary key,
  author_name text not null default '',
  author_handle text not null default '',
  author_avatar text not null default '',
  author_role text not null default 'Verified Buyer'
    check (author_role in ('Verified Buyer','Creator / MUA','Dermatologist','Distributor')),
  skin_type text,
  content text not null default '',
  media_type text check (media_type in ('image','video')),
  media_url text,
  video_duration text,
  tagged_product_id text references public.products(id) on delete set null,
  tagged_product_sku text,
  tagged_product_hashtag text,
  tagged_product_name text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  is_transformation boolean not null default false,
  before_after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_tagged_product on public.community_posts(tagged_product_id);
create index if not exists idx_posts_hashtag on public.community_posts(tagged_product_hashtag);
create index if not exists idx_posts_created on public.community_posts(created_at desc);

create table if not exists public.post_likes (
  post_id text not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_messages (
  id text primary key,
  sender_name text not null default '',
  sender_avatar text not null default '',
  channel text not null default 'routine',
  message text not null default '',
  likes integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_community_channel on public.community_messages(channel);

-- ============ LOYALTY: VOUCHERS + POINTS ============
create table if not exists public.vouchers (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  code text unique not null,
  title text not null default '',
  discount_amount integer,
  min_spend integer,
  points_cost integer not null default 0,
  expires_at timestamptz,
  is_redeemed boolean not null default false,
  category text,
  created_at timestamptz not null default now()
);
create index if not exists idx_vouchers_user on public.vouchers(user_id);

create table if not exists public.points_activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  points integer not null default 0,
  type text check (type in ('earn','redeem')),
  order_id text references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_user on public.points_activity(user_id);

-- ============ CARTS (persistent; guests use session_id) ============
create table if not exists public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id),
  size text not null default 'Standard',
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null default 0,
  fulfillment_type text not null default 'local' check (fulfillment_type in ('local','central')),
  distributor_id text references public.distributors(id) on delete set null,
  unique(cart_id, product_id, size)
);

-- ============ AUTHENTICITY CODES (batch verification) ============
create table if not exists public.authenticity_codes (
  code text primary key,
  product_id text not null references public.products(id),
  batch text not null default '',
  manufactured_at date,
  verified_count integer not null default 0,
  is_valid boolean not null default true
);

-- ============ UPDATED_AT TRIGGER ============
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_carts_updated on public.carts;
create trigger trg_carts_updated before update on public.carts
  for each row execute function public.handle_updated_at();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.distributors enable row level security;
alter table public.inventory enable row level security;
alter table public.creators enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tracking_steps enable row level security;
alter table public.reviews enable row level security;
alter table public.review_helpful enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.community_messages enable row level security;
alter table public.vouchers enable row level security;
alter table public.points_activity enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.authenticity_codes enable row level security;

-- Public catalog reads (anon + authenticated)
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);
drop policy if exists "public read distributors" on public.distributors;
create policy "public read distributors" on public.distributors for select using (true);
drop policy if exists "public read inventory" on public.inventory;
create policy "public read inventory" on public.inventory for select using (true);
drop policy if exists "public read creators" on public.creators;
create policy "public read creators" on public.creators for select using (true);
drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);
drop policy if exists "public read posts" on public.community_posts;
create policy "public read posts" on public.community_posts for select using (true);
drop policy if exists "public read messages" on public.community_messages;
create policy "public read messages" on public.community_messages for select using (true);
drop policy if exists "public read tracking" on public.tracking_steps;
create policy "public read tracking" on public.tracking_steps for select using (true);
drop policy if exists "public read order items" on public.order_items;
create policy "public read order items" on public.order_items for select using (true);
drop policy if exists "public verify authenticity" on public.authenticity_codes;
create policy "public verify authenticity" on public.authenticity_codes for select using (true);

-- Authenticated writes: users manage their own rows; community content open to members
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "auth write reviews" on public.reviews;
create policy "auth write reviews" on public.reviews for insert with check (auth.role() = 'authenticated');
drop policy if exists "auth write posts" on public.community_posts;
create policy "auth write posts" on public.community_posts for insert with check (auth.role() = 'authenticated');
drop policy if exists "auth write messages" on public.community_messages;
create policy "auth write messages" on public.community_messages for insert with check (auth.role() = 'authenticated');
drop policy if exists "auth write helpful" on public.review_helpful;
create policy "auth write helpful" on public.review_helpful for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "auth write likes" on public.post_likes;
create policy "auth write likes" on public.post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own vouchers" on public.vouchers;
create policy "own vouchers" on public.vouchers for select using (auth.uid() = user_id or user_id is null);
drop policy if exists "own points" on public.points_activity;
create policy "own points" on public.points_activity for select using (auth.uid() = user_id);
drop policy if exists "own carts" on public.carts;
create policy "own carts" on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own cart items" on public.cart_items;
create policy "own cart items" on public.cart_items for all using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
);

-- Storage buckets (run once; guarded): product + community media (public read)
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;
