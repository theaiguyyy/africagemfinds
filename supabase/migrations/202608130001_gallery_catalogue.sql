-- Local review migration only. Do not apply to production without explicit approval.
alter table public.listings
  add column if not exists sku text,
  add column if not exists gemstone_family text not null default '',
  add column if not exists origin_locality text not null default '',
  add column if not exists weight_value numeric,
  add column if not exists weight_unit text check (weight_unit is null or weight_unit in ('g','kg','ct')),
  add column if not exists public_weight_label text not null default 'Weight on request',
  add column if not exists raw_source_weight_note text not null default '',
  add column if not exists educational_note text not null default '',
  add column if not exists form text not null default '',
  add column if not exists colour text not null default '',
  add column if not exists publish_state text not null default 'draft' check (publish_state in ('draft','published')),
  add column if not exists import_key text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists listings_sku_unique on public.listings(sku) where sku is not null;
create unique index if not exists listings_import_key_unique on public.listings(import_key) where import_key is not null;
create index if not exists listings_gallery_public_idx on public.listings(publish_state, status, position);
update public.listings set publish_state = 'published' where publish_state = 'draft' and sku is null;

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_key text not null,
  source_filename text not null default '',
  url text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  mime_type text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_id, storage_key)
);
create unique index if not exists listing_images_one_primary on public.listing_images(listing_id) where is_primary;
create index if not exists listing_images_order_idx on public.listing_images(listing_id, sort_order);
alter table public.listing_images enable row level security;
drop policy if exists "public read published listing images" on public.listing_images;
drop policy if exists "admin manage listing images" on public.listing_images;
create policy "public read published listing images" on public.listing_images for select
  using (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.publish_state = 'published'));
create policy "admin manage listing images" on public.listing_images for all to authenticated
  using ((select public.is_agf_admin())) with check ((select public.is_agf_admin()));
grant select on public.listing_images to anon, authenticated;
grant insert, update, delete on public.listing_images to authenticated;

-- Gallery shows sold work as past inventory; draft rows remain private.
drop policy if exists "public read listings" on public.listings;
create policy "public read listings" on public.listings for select
  using (publish_state = 'published' and status in ('available','reserved','sold'));
