import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig, hasSupabaseConfig } from '@/lib/supabase/config';

export interface PublishedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tag: string;
  published: boolean;
  publishedAt: string;
  updatedAt: string;
}

export async function getPublishedBlogPosts(): Promise<PublishedBlogPost[]> {
  if (!hasSupabaseConfig()) return [];
  const { url, key } = getPublicSupabaseConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug,title,excerpt,content,cover_url,tag,published,published_at,updated_at')
    .eq('published', true)
    .order('position');
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('Could not load blog metadata.', error.message);
    return [];
  }
  return (data ?? []).map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content || '',
    coverUrl: post.cover_url || '',
    tag: post.tag || 'Journal',
    published: post.published === true,
    publishedAt: post.published_at || '',
    updatedAt: post.updated_at || post.published_at || '',
  }));
}

export async function getPublishedBlogPost(slug: string) {
  const posts = await getPublishedBlogPosts();
  return posts.find((post) => post.slug === slug && post.published) ?? null;
}

