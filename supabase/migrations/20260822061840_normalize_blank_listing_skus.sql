-- Empty strings participate in the partial unique index because they are not
-- NULL. Normalize the legacy row so new Gallery references cannot collide with
-- an invisible blank reference.
update public.listings
set sku = null,
    updated_at = now()
where sku is not null
  and btrim(sku) = '';

alter table public.listings
  drop constraint if exists listings_sku_not_blank;

alter table public.listings
  add constraint listings_sku_not_blank
  check (sku is null or btrim(sku) <> '');
