create or replace function public.reorder_admin_items(resource_name text, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  if not public.is_agf_admin() then
    raise exception 'Administrator access required';
  end if;

  if resource_name = 'listings' then
    update public.listings as item set position = ordering.ordinality - 1
    from unnest(ordered_ids) with ordinality as ordering(id, ordinality) where item.id = ordering.id;
  elsif resource_name = 'media' then
    update public.media as item set position = ordering.ordinality - 1
    from unnest(ordered_ids) with ordinality as ordering(id, ordinality) where item.id = ordering.id;
  elsif resource_name = 'blog_posts' then
    update public.blog_posts as item set position = ordering.ordinality - 1
    from unnest(ordered_ids) with ordinality as ordering(id, ordinality) where item.id = ordering.id;
  elsif resource_name = 'listing_images' then
    update public.listing_images as item set sort_order = ordering.ordinality - 1
    from unnest(ordered_ids) with ordinality as ordering(id, ordinality) where item.id = ordering.id;
  else
    raise exception 'Unsupported resource: %', resource_name;
  end if;
end;
$$;

revoke all on function public.reorder_admin_items(text, uuid[]) from public, anon;
grant execute on function public.reorder_admin_items(text, uuid[]) to authenticated;
