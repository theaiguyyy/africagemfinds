/**
 * Idempotently imports the founder-supplied Stone1–Stone28 inventory.
 *
 * Each numbered folder is treated as one parcel. Every clean photograph is
 * added to Media, while the first photograph becomes the public listing image.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const records = [
  { number: 1,  name: 'Aquamarine', origin: 'Madagascar', weight: '2467kg', category: 'Aquamarine' },
  { number: 2,  name: 'Tourmaline', origin: 'Congo', weight: '1400kg', category: 'Tourmaline', review: 'The uploaded parcel appears pale blue; confirm whether this is indicolite tourmaline.' },
  { number: 3,  name: 'Rubylite', origin: 'Nigeria', weight: '2642kg', category: 'Rubylite', review: 'Classified from the uploaded red/pink tourmaline parcel.' },
  { number: 4,  name: 'Blue-Green Tourmaline', origin: 'Nigeria', weight: '', category: 'Tourmaline', review: 'Classified from the uploaded striated blue-green tourmaline parcel.' },
  { number: 5,  name: 'Green Tourmaline', origin: 'Nigeria', weight: '', category: 'Tourmaline', review: 'Classified from the uploaded green tourmaline parcel.' },
  { number: 6,  name: 'Aquamarine', origin: 'Mozambique', weight: '2015kg', category: 'Aquamarine' },
  { number: 7,  name: 'Pink Morganite', origin: '', weight: '1620kg', category: 'Morganite' },
  { number: 8,  name: 'New Mine Ofiki Aquamarine', origin: 'Nigeria', weight: '596g', category: 'Aquamarine' },
  { number: 9,  name: 'Ofiki Aquamarine — Top Quality, Small Size', origin: 'Nigeria', weight: '468g', category: 'Aquamarine' },
  { number: 10, name: 'Ofiki Aquamarine — Top Quality, Big Size', origin: 'Nigeria', weight: '731g', category: 'Aquamarine' },
  { number: 11, name: 'Aquamarine — Medium Quality', origin: 'Nigeria', weight: '2789kg', category: 'Aquamarine' },
  { number: 12, name: 'Aquamarine', origin: 'Mozambique', weight: '1526kg', category: 'Aquamarine' },
  { number: 13, name: 'Aquamarine', origin: 'Madagascar', weight: '2216.00', category: 'Aquamarine' },
  { number: 14, name: 'Aquamarine', origin: 'Nigeria', weight: '2118kg', category: 'Aquamarine', review: 'Classified from the uploaded blue aquamarine parcel.' },
  { number: 15, name: 'Aquamarine', origin: 'Nigeria', weight: '1233kg', category: 'Aquamarine' },
  { number: 16, name: 'Aquamarine', origin: 'Nigeria', weight: '1296kg', category: 'Aquamarine' },
  { number: 17, name: 'Aquamarine', origin: 'Madagascar', weight: '1600kg', category: 'Aquamarine' },
  { number: 18, name: 'Aquamarine', origin: 'Madagascar', weight: '', category: 'Aquamarine' },
  { number: 19, name: 'Yellow Aquamarine', origin: 'Madagascar', weight: '', category: 'Aquamarine' },
  { number: 20, name: 'Yellow Aquamarine', origin: 'Madagascar', weight: '', category: 'Aquamarine' },
  { number: 21, name: 'Tourmaline', origin: 'Afghanistan', weight: '2497kg', category: 'Tourmaline' },
  { number: 22, name: 'Agate', origin: 'Nigeria', weight: '', category: 'Unassigned', review: 'Agate is outside the six current public categories.' },
  { number: 23, name: 'Rose Cut Gemstone', origin: '', weight: '2655kg', category: 'Unassigned', review: 'Material was not specified; keep unassigned until confirmed.' },
  { number: 24, name: 'Black Tourmaline', origin: '', weight: '', category: 'Tourmaline' },
  { number: 25, name: 'Pink Morganite', origin: 'Nigeria', weight: '', category: 'Morganite', review: 'Classified from the uploaded pale-pink beryl parcel.' },
  { number: 26, name: 'Green, Blue & Mixed Tourmaline', origin: '', weight: '', category: 'Tourmaline' },
  { number: 27, name: 'Rubylite', origin: 'Nigeria', weight: '393g', category: 'Rubylite' },
  { number: 28, name: 'Potato Tourmaline', origin: 'Nigeria', weight: '520g', category: 'Tourmaline' },
];

const imageDirectory = path.join(process.cwd(), 'public', 'images');
const allImages = fs.readdirSync(imageDirectory).filter(file => /^Stone\d+-.*\.jpe?g$/i.test(file));

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function imagesFor(number) {
  return allImages
    .filter(file => new RegExp(`^Stone${number}-`, 'i').test(file))
    .sort(naturalCompare);
}

async function assert(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const { data: existingMedia } = await supabase.from('media').select('position').order('position', { ascending: false }).limit(1);
const mediaStart = (existingMedia?.[0]?.position ?? -1) + 1;
let mediaPosition = mediaStart;
const mediaRows = [];
const listingRows = [];

for (const record of records) {
  const images = imagesFor(record.number);
  if (images.length === 0) throw new Error(`No clean photographs found for Stone${record.number}`);

  images.forEach((file, photoIndex) => {
    mediaRows.push({
      name: images.length > 1 ? `${record.name} — Photo ${photoIndex + 1}` : record.name,
      url: `/images/${file}`,
      storage_path: `catalog/stone-${String(record.number).padStart(2, '0')}/${file}`,
      category: record.category,
      weight: record.weight,
      featured: false,
      position: mediaPosition++,
    });
  });

  if (record.category !== 'Unassigned') {
    listingRows.push({
      title: record.name,
      slug: `catalog-stone-${String(record.number).padStart(2, '0')}`,
      category: record.category,
      weight: record.weight,
      origin: record.origin,
      description: record.review ?? '',
      photo_url: `/images/${images[0]}`,
      status: 'available',
      featured: false,
      position: record.number - 1,
    });
  }
}

await assert(
  await supabase.from('media').upsert(mediaRows, { onConflict: 'storage_path' }),
  'import media',
);
await assert(
  await supabase.from('listings').upsert(listingRows, { onConflict: 'slug' }),
  'import listings',
);

// Retain the original placeholder rows for audit/history, but remove them from
// the public catalogue now that the founder-supplied inventory is available.
await assert(
  await supabase.from('listings').update({ status: 'sold' }).in('slug', [
    'aq-01', 'aq-02', 'aq-03', 'aq-04', 'aq-05', 'aq-06',
    'tm-01', 'tm-02', 'mg-01', 'by-01', 'by-02', 'by-03',
  ]),
  'archive placeholder listings',
);

const [mediaCount, listingCount, importedListings] = await Promise.all([
  supabase.from('media').select('*', { count: 'exact', head: true }),
  supabase.from('listings').select('*', { count: 'exact', head: true }),
  supabase.from('listings').select('slug,title,category,origin,weight,status').like('slug', 'catalog-stone-%').order('position'),
]);

await assert(mediaCount, 'verify media count');
await assert(listingCount, 'verify listing count');
const verified = await assert(importedListings, 'verify imported listings');
if (verified.length !== listingRows.length) {
  throw new Error(`Verification failed: expected ${listingRows.length} imported listings, found ${verified.length}`);
}

console.log(`Imported ${mediaRows.length} clean photographs and ${listingRows.length} public listings.`);
console.log(`Supabase totals: media=${mediaCount.count}, listings=${listingCount.count}.`);
console.table(verified);
