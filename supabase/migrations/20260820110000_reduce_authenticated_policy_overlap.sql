-- Public visitors retain read access while authenticated admins use the single
-- management policy. This avoids evaluating two permissive SELECT policies for
-- every dashboard row.
alter policy "public read categories" on public.categories to anon;
alter policy "public read media" on public.media to anon;
alter policy "public read listings" on public.listings to anon;
alter policy "public read published posts" on public.blog_posts to anon;
alter policy "public read published listing images" on public.listing_images to anon;
