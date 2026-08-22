-- Keep the exact same image bytes while removing the duplicate local file.
update public.blog_posts
set cover_url = '/images/about-family-inspection.jpg',
    updated_at = now()
where cover_url = '/images/Stone34-559.jpg';
