import type { Metadata } from 'next';
import type { GalleryStone } from '@/lib/gallery/types';

export const SITE_URL = 'https://www.africagemfinds.com';
export const SITE_NAME = 'Africa Gem Finds';
export const PUBLIC_STATIC_PATHS = [
  '/', '/about', '/gallery', '/contact', '/blog',
  '/gems/aquamarine', '/gems/tourmaline', '/gems/rubellite',
  '/gems/morganite', '/gems/spessartite-garnet', '/gems/beryl',
];

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function correctRubelliteSpelling(value: string) {
  return value.replace(/Rubylite/g, 'Rubellite').replace(/rubylite/g, 'rubellite');
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/africa-gem-finds-logo-transparent.png'),
  };
}

export function productJsonLd(stone: GalleryStone) {
  const primary = stone.images.find((image) => image.isPrimary) ?? stone.images[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: stone.title,
    sku: stone.sku,
    category: stone.family,
    description: stone.description || stone.educationalNote || undefined,
    image: stone.images.map((image) => absoluteUrl(image.url)),
    url: absoluteUrl(`/gallery/${stone.slug}`),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Origin', value: stone.origin },
      { '@type': 'PropertyValue', name: 'Weight', value: stone.publicWeight },
      { '@type': 'PropertyValue', name: 'Availability', value: stone.status === 'sold' ? 'Sold' : 'Available' },
      primary ? { '@type': 'PropertyValue', name: 'Primary image', value: absoluteUrl(primary.url) } : null,
    ].filter(Boolean),
  };
}

type SitemapPost = { slug: string; published: boolean; publishedAt: string; updatedAt: string; coverUrl: string };
type SitemapStone = Pick<GalleryStone, 'slug' | 'publishState' | 'updatedAt' | 'images'>;

export function buildSeoSitemap(posts: SitemapPost[], stones: SitemapStone[]) {
  const staticEntries = PUBLIC_STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) }));
  const blogEntries = posts
    .filter((post) => post.published && post.slug)
    .map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      ...(post.updatedAt || post.publishedAt ? { lastModified: new Date(post.updatedAt || post.publishedAt) } : {}),
      ...(post.coverUrl ? { images: [absoluteUrl(post.coverUrl)] } : {}),
    }));
  const stoneEntries = stones
    .filter((stone) => stone.publishState === 'published' && stone.slug && stone.images.length > 0)
    .map((stone) => {
      const primary = stone.images.find((image) => image.isPrimary) ?? stone.images[0];
      return {
        url: absoluteUrl(`/gallery/${stone.slug}`),
        ...(stone.updatedAt ? { lastModified: new Date(stone.updatedAt) } : {}),
        images: [absoluteUrl(primary.url)],
      };
    });
  return [...staticEntries, ...blogEntries, ...stoneEntries];
}
