import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('admin dashboard uses optimized images and visible edit workflows', async () => {
  const source = await readFile(new URL('src/app/admin/page.tsx', root), 'utf8');
  assert.match(source, /import Image from 'next\/image'/);
  assert.match(source, /openListingEditor\(l\)/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /key=\{editingListing\.id \?\? 'new-listing'\}/);
  assert.doesNotMatch(source, /<img\s/);
});

test('admin ordering is atomic, authenticated, and has a compatibility fallback', async () => {
  const [source, migration] = await Promise.all([
    readFile(new URL('src/app/admin/page.tsx', root), 'utf8'),
    readFile(new URL('supabase/migrations/20260816065948_optimize_admin_reordering.sql', root), 'utf8'),
  ]);
  assert.match(source, /reorder_admin_items/);
  assert.match(source, /PGRST202/);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /is_agf_admin\(\)/);
  assert.match(migration, /grant execute .* to authenticated/i);
  assert.match(migration, /revoke all .* from public, anon/i);
});

test('gallery CMS exposes the complete listing and image editing workflow', async () => {
  const source = await readFile(new URL('src/app/admin/page.tsx', root), 'utf8');
  for (const field of ['title', 'slug', 'sku', 'gemstone_family', 'origin', 'origin_locality', 'weight_value', 'weight_unit', 'public_weight_label', 'raw_source_weight_note', 'colour', 'form', 'description', 'educational_note', 'status', 'publish_state']) {
    assert.match(source, new RegExp(`name=["']${field}["']`), `${field} must be editable`);
  }
  assert.match(source, /Gallery Listings/);
  assert.match(source, /replaceListingImage/);
  assert.match(source, /deleteListingImage/);
  assert.match(source, /setPrimaryListingImage/);
  assert.match(source, /moveListingImage/);
  assert.match(source, /This controls the Gallery filter and category assignment/);
  assert.match(source, /Publish \/ edit Gallery listing/);
  assert.match(source, /listing_images'\)\.insert/);
  assert.doesNotMatch(source, /Saved and published under/);
  assert.match(source, /listings_sku_unique/);
  assert.match(source, /readOnly=\{Boolean\(editingListing\.id\)\}/);
  assert.match(source, /linked Gallery listing were saved and published/);
});

test('homepage slideshow uses the verified gemstone labels', async () => {
  const source = await readFile(new URL('src/components/HomePage.tsx', root), 'utf8');
  assert.match(source, /label: 'Green Beryl', img: '\/images\/Stone22-290\.jpg'/);
  assert.match(source, /label: 'Ofiki Aqua', img: '\/images\/Stone11-149\.jpg'/);
  assert.match(source, /label: 'Blue Tourmaline', img: '\/images\/Stone10-137\.jpg'/);
  assert.match(source, /label: 'Tourmaline', img: '\/images\/Stone31-446\.jpg'/);
});

test('storage cleanup is dry-run by default and refuses referenced duplicate objects', async () => {
  const source = await readFile(new URL('scripts/deduplicate-supabase-storage.mjs', root), 'utf8');
  assert.match(source, /process\.argv\.includes\('--write'\)/);
  assert.match(source, /Refusing cleanup/);
  assert.match(source, /if \(!write \|\| duplicates\.length === 0\) process\.exit\(0\)/);
});
