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
