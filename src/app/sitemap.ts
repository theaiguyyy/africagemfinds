import type { MetadataRoute } from 'next';
import { getPublishedBlogPosts } from '@/lib/blog/data';
import { getGalleryStones } from '@/lib/gallery/data';
import { buildSeoSitemap } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, stones] = await Promise.all([getPublishedBlogPosts(), getGalleryStones()]);
  return buildSeoSitemap(posts, stones);
}
