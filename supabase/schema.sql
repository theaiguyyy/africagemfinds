-- Africa Gem Finds CMS schema. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  storage_path text not null unique,
  category text not null default 'Unassigned',
  weight text not null default '',
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists media_one_featured_per_category
  on public.media(category) where featured;
create index if not exists media_category_position_idx on public.media(category, position);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  weight text not null default '',
  origin text not null default '',
  description text not null default '',
  photo_url text not null default '',
  status text not null default 'available' check (status in ('available','reserved','sold')),
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_category_position_idx on public.listings(category, position);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  tag text not null default 'Field Notes',
  excerpt text not null default '',
  content text not null default '',
  cover_url text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_public_idx on public.blog_posts(published, published_at desc);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  gemstone text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);

alter table public.categories enable row level security;
alter table public.media enable row level security;
alter table public.listings enable row level security;
alter table public.blog_posts enable row level security;
alter table public.inquiries enable row level security;

-- app_metadata is only writable with a server-side admin key and is safe for roles.
create or replace function public.is_agf_admin()
returns boolean language sql stable
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role', '') in ('owner','staff') $$;
create or replace function public.is_agf_owner()
returns boolean language sql stable
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'owner' $$;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "admin manage categories" on public.categories;
create policy "admin manage categories" on public.categories for all to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));

drop policy if exists "public read media" on public.media;
create policy "public read media" on public.media for select using (true);
drop policy if exists "admin manage media" on public.media;
create policy "admin manage media" on public.media for all to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));

drop policy if exists "public read listings" on public.listings;
create policy "public read listings" on public.listings for select using (status in ('available','reserved'));
drop policy if exists "admin manage listings" on public.listings;
create policy "admin manage listings" on public.listings for all to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));

drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts" on public.blog_posts for select using (published);
drop policy if exists "admin manage posts" on public.blog_posts;
create policy "admin manage posts" on public.blog_posts for all to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));

drop policy if exists "public submit inquiries" on public.inquiries;
create policy "public submit inquiries" on public.inquiries for insert to anon, authenticated with check (true);
drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries" on public.inquiries for select to authenticated using ((select public.is_agf_admin()));
drop policy if exists "admin update inquiries" on public.inquiries;
create policy "admin update inquiries" on public.inquiries for update to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));
drop policy if exists "owner delete inquiries" on public.inquiries;
create policy "owner delete inquiries" on public.inquiries for delete to authenticated using ((select public.is_agf_owner()));

insert into public.categories (slug, name, position) values
  ('aquamarine','Aquamarine',0), ('tourmaline','Tourmaline',1),
  ('rubylite','Rubylite',2), ('morganite','Morganite',3),
  ('spessartite-garnet','Spessartite Garnet',4), ('beryl','Beryl',5)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public) values ('gem-photos','gem-photos',true)
on conflict (id) do update set public = true;

drop policy if exists "public read gem photos" on storage.objects;
create policy "public read gem photos" on storage.objects for select using (bucket_id = 'gem-photos');
drop policy if exists "admin upload gem photos" on storage.objects;
create policy "admin upload gem photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'gem-photos' and (select public.is_agf_admin()));
drop policy if exists "admin update gem photos" on storage.objects;
create policy "admin update gem photos" on storage.objects for update to authenticated
  using (bucket_id = 'gem-photos' and (select public.is_agf_admin()))
  with check (bucket_id = 'gem-photos' and (select public.is_agf_admin()));
drop policy if exists "admin delete gem photos" on storage.objects;
create policy "admin delete gem photos" on storage.objects for delete to authenticated
  using (bucket_id = 'gem-photos' and (select public.is_agf_admin()));

do $$ begin
  alter publication supabase_realtime add table public.inquiries;
exception when duplicate_object then null; end $$;
