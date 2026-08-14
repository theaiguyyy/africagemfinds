import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { getPublishedBlogPost } from '@/lib/blog/data';
import { absoluteUrl, breadcrumbJsonLd, correctRubelliteSpelling } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) return { title: 'Article Not Found', robots: { index: false, follow: false } };
  const title = correctRubelliteSpelling(post.title);
  const description = correctRubelliteSpelling(post.excerpt || post.content.slice(0, 155));
  const canonical = absoluteUrl(`/blog/${slug}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: post.coverUrl ? [post.coverUrl] : undefined, publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
    twitter: { card: 'summary_large_image', title, description, images: post.coverUrl ? [post.coverUrl] : undefined },
  };
}

export default async function BlogPostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) notFound();
  return <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: correctRubelliteSpelling(post.title), path: `/blog/${slug}` }])} />{children}</>;
}
