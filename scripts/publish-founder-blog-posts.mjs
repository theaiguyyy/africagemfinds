import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase production credentials are required in .env.local');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sourceDirectory = '/Users/Mouhameddayecamara/Downloads/files';
const posts = [
  {
    file: 'buying-wholesale-rough-gemstones-guide.md',
    slug: 'buying-wholesale-rough-gemstones-guide',
    tag: 'Sourcing',
    cover_url: '/images/Stone34-559.jpg',
    excerpt: 'A practical guide to parcel buying, inspection, pricing, yield, logistics, and building a reliable wholesale sourcing relationship.',
  },
  {
    file: 'mozambique-rubies-vs-rubylite.md',
    slug: 'mozambique-rubies-vs-rubylite',
    tag: 'Gem Guide',
    cover_url: '/images/Stone3-054.jpg',
    excerpt: 'Ruby and rubylite share a striking red-to-pink range, but their mineral identity, durability, pricing, and rough crystal forms are very different.',
  },
  {
    file: 'spessartite-garnet-guide.md',
    slug: 'spessartite-garnet-guide',
    tag: 'Gem Guide',
    cover_url: '/images/Stone7-105.jpg',
    excerpt: 'What spessartite garnet is, why vivid African material is scarce, and what buyers should inspect when evaluating rough.',
  },
  {
    file: 'where-african-gemstones-come-from.md',
    slug: 'where-african-gemstones-come-from',
    tag: 'Field Notes & Guides',
    cover_url: '/images/Stone4-068.jpg',
    excerpt: 'A region-by-region guide to African gemstone sources and how origin affects color, supply, pricing, treatments, and provenance.',
  },
];

const { data: lastPosts, error: positionError } = await supabase
  .from('blog_posts').select('position').order('position', { ascending: false }).limit(1);
if (positionError) throw positionError;
let position = (lastPosts?.[0]?.position ?? -1) + 1;

function readArticle(file) {
  const raw = fs.readFileSync(path.join(sourceDirectory, file), 'utf8').trim();
  const lines = raw.split(/\r?\n/);
  const title = lines.shift().replace(/^#\s+/, '').trim();
  while (lines[0]?.trim() === '') lines.shift();
  if (/^\*\*Tag:\*\*/.test(lines[0] ?? '')) lines.shift();
  while (lines[0]?.trim() === '') lines.shift();
  return { title, content: lines.join('\n').trim() };
}

const now = new Date();
const rows = posts.map((post, index) => ({
  ...post,
  ...readArticle(post.file),
  published: true,
  published_at: new Date(now.getTime() - index * 60_000).toISOString(),
  position: position++,
})).map(({ file, ...row }) => row);

const { error } = await supabase.from('blog_posts').upsert(rows, { onConflict: 'slug' });
if (error) throw error;

const { data: verified, error: verifyError } = await supabase.from('blog_posts')
  .select('slug,title,tag,cover_url,published,position')
  .in('slug', rows.map(row => row.slug)).order('position');
if (verifyError) throw verifyError;
if (verified.length !== rows.length || verified.some(row => !row.published)) {
  throw new Error('Blog publication verification failed.');
}

console.table(verified);
