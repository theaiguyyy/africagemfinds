/**
 * Upload clean local images to Supabase Storage and update lib/asset-map.json.
 *
 * Usage:
 *   1. Fill .env.local with your Supabase config
 *   2. Place images in public/images/
 *   3. Run: node scripts/upload-assets.mjs
 *
 * The script uploads every .jpg/.jpeg/.png/.webp in public/images/ and
 * writes the resulting Storage URL into lib/asset-map.json using the
 * filename (without extension) as the key.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Load env
const dotenv = await import('dotenv');
dotenv.config({ path: join(__dirname, '../.env.local') });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Supabase URL/service-role key is not set in .env.local');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const IMAGES_DIR = join(__dirname, '../public/images');
const ASSET_MAP_PATH = join(__dirname, '../lib/asset-map.json');
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const assetMap = JSON.parse(await readFile(ASSET_MAP_PATH, 'utf8'));

const files = (await readdir(IMAGES_DIR)).filter(f => EXTS.has(extname(f).toLowerCase()));

console.log(`Found ${files.length} image(s) in public/images/`);

for (const file of files) {
  const key = basename(file, extname(file));
  const filePath = join(IMAGES_DIR, file);
  const buffer = await readFile(filePath);
  const contentType = extname(file).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

  console.log(`Uploading ${file}…`);
  const storagePath = `site-assets/${file}`;
  const { error } = await supabase.storage.from('gem-photos').upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('gem-photos').getPublicUrl(storagePath);
  const url = data.publicUrl;

  assetMap[key] = url;
  console.log(`  → ${url}`);
}

await writeFile(ASSET_MAP_PATH, JSON.stringify(assetMap, null, 2), 'utf8');
console.log('\nDone. lib/asset-map.json updated.');
