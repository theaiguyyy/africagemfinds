-- Repoint byte-identical legacy media uploads to the canonical gallery objects.
-- Storage objects are removed separately after every public reference is verified.

delete from public.listings
where slug = 'media-b0e98779-c554-411b-a659-ceef9d093b66'
  and publish_state = 'draft';

delete from public.media
where id = 'b0e98779-c554-411b-a659-ceef9d093b66';

with objects as (
  select
    name,
    regexp_replace(metadata ->> 'eTag', '["]', '', 'g') as etag,
    'https://rxuznpsffpjboegkdhjz.supabase.co/storage/v1/object/public/gem-photos/' || name as url
  from storage.objects
  where bucket_id = 'gem-photos'
), canonical as (
  select
    etag,
    max(name) filter (where name like 'gallery/%') as canonical_path,
    max(url) filter (where name like 'gallery/%') as canonical_url
  from objects
  group by etag
  having count(*) > 1
     and count(*) filter (where name like 'gallery/%') = 1
), replacements as (
  select duplicate.url as old_url, canonical.canonical_url, canonical.canonical_path
  from canonical
  join objects duplicate on duplicate.etag = canonical.etag and duplicate.name like 'gems/%'
)
update public.media media
set url = replacements.canonical_url,
    storage_path = replacements.canonical_path
from replacements
where media.url = replacements.old_url;

with objects as (
  select
    name,
    regexp_replace(metadata ->> 'eTag', '["]', '', 'g') as etag,
    'https://rxuznpsffpjboegkdhjz.supabase.co/storage/v1/object/public/gem-photos/' || name as url
  from storage.objects
  where bucket_id = 'gem-photos'
), canonical as (
  select
    etag,
    max(url) filter (where name like 'gallery/%') as canonical_url
  from objects
  group by etag
  having count(*) > 1
     and count(*) filter (where name like 'gallery/%') = 1
), replacements as (
  select duplicate.url as old_url, canonical.canonical_url
  from canonical
  join objects duplicate on duplicate.etag = canonical.etag and duplicate.name like 'gems/%'
)
update public.listings listing
set photo_url = replacements.canonical_url,
    updated_at = now()
from replacements
where listing.photo_url = replacements.old_url;
