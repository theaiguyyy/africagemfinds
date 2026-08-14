import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  SITE_URL,
  absoluteUrl,
  breadcrumbJsonLd,
  buildSeoSitemap,
  correctRubelliteSpelling,
  organizationJsonLd,
} from '../src/lib/seo.ts';

test('canonical helpers always use the HTTPS www production domain', () => {
  assert.equal(SITE_URL, 'https://www.africagemfinds.com');
  assert.equal(absoluteUrl('/gallery/example'), 'https://www.africagemfinds.com/gallery/example');
});

test('sitemap includes published CMS records and excludes drafts', () => {
  const image = { id: 'i1', storageKey: 'key', url: '/stone.jpg', width: 1200, height: 900, mimeType: 'image/jpeg', alt: 'Stone', sortOrder: 0, isPrimary: true };
  const entries = buildSeoSitemap(
    [
      { slug: 'published-post', published: true, publishedAt: '2026-08-01', updatedAt: '2026-08-02', coverUrl: '/cover.jpg' },
      { slug: 'draft-post', published: false, publishedAt: '', updatedAt: '', coverUrl: '' },
    ],
    [
      { slug: 'published-stone', publishState: 'published', updatedAt: '2026-08-03', images: [image] },
      { slug: 'draft-stone', publishState: 'draft', updatedAt: '', images: [image] },
    ],
  );
  const urls = entries.map((entry) => entry.url);
  assert.ok(urls.includes(`${SITE_URL}/blog/published-post`));
  assert.ok(urls.includes(`${SITE_URL}/gallery/published-stone`));
  assert.ok(!urls.some((url) => url.includes('draft-post') || url.includes('draft-stone')));
  assert.ok(entries.every((entry) => entry.url.startsWith(`${SITE_URL}/`) || entry.url === `${SITE_URL}/`));
});

test('structured data is valid JSON and uses factual schema types', () => {
  const values = [
    organizationJsonLd(),
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }]),
  ];
  for (const value of values) assert.deepEqual(JSON.parse(JSON.stringify(value)), value);
  assert.equal(values[0]['@type'], 'Organization');
  assert.equal(values[1]['@type'], 'BreadcrumbList');
});

test('public spelling is corrected while the legacy redirect remains permanent', async () => {
  assert.equal(correctRubelliteSpelling('Rubylite and rubylite'), 'Rubellite and rubellite');
  const redirectPage = await readFile(new URL('../src/app/gems/rubylite/page.tsx', import.meta.url), 'utf8');
  assert.match(redirectPage, /permanentRedirect\('\/gems\/rubellite'\)/);
});

test('robots and sitemap metadata routes are present with private paths excluded', async () => {
  const robots = await readFile(new URL('../src/app/robots.ts', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8');
  assert.match(robots, /\/admin/);
  assert.match(robots, /\/api\//);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /getPublishedBlogPosts/);
  assert.match(sitemap, /getGalleryStones/);
});
