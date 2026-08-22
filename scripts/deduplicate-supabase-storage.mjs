import { createClient } from '@supabase/supabase-js';

const write = process.argv.includes('--write');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const bucket = supabase.storage.from('gem-photos');

async function listTree(prefix) {
  const output = [];
  let offset = 0;
  while (true) {
    const { data, error } = await bucket.list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) output.push({ ...item, path });
      else output.push(...await listTree(path));
    }
    if ((data ?? []).length < 100) break;
    offset += 100;
  }
  return output;
}

const files = [...await listTree('gallery'), ...await listTree('gems')];
const groups = new Map();
for (const file of files) {
  const etag = String(file.metadata?.eTag || file.metadata?.etag || '').replaceAll('"', '');
  if (!etag) continue;
  groups.set(etag, [...(groups.get(etag) ?? []), file]);
}

const duplicates = [];
for (const filesWithSameBytes of groups.values()) {
  const canonical = filesWithSameBytes.find(file => file.path.startsWith('gallery/'));
  if (!canonical) continue;
  for (const duplicate of filesWithSameBytes.filter(file => file.path.startsWith('gems/'))) {
    duplicates.push({ canonical: canonical.path, duplicate: duplicate.path, bytes: Number(duplicate.metadata?.size || 0) });
  }
}

const duplicateUrls = duplicates.map(item => `${url}/storage/v1/object/public/gem-photos/${item.duplicate}`);
const referenceChecks = duplicateUrls.length ? await Promise.all([
  supabase.from('media').select('id,url').in('url', duplicateUrls),
  supabase.from('listings').select('id,photo_url').in('photo_url', duplicateUrls),
  supabase.from('listing_images').select('id,url').in('url', duplicateUrls),
]) : [];
const errors = referenceChecks.map(result => result.error).filter(Boolean);
if (errors.length) throw errors[0];
const references = referenceChecks.flatMap(result => result.data ?? []);
if (references.length) throw new Error(`Refusing cleanup: ${references.length} database references still use duplicate objects.`);

const totalBytes = duplicates.reduce((sum, item) => sum + item.bytes, 0);
console.log(JSON.stringify({ mode: write ? 'write' : 'dry-run', duplicateObjects: duplicates.length, reclaimBytes: totalBytes, duplicates }, null, 2));
if (!write || duplicates.length === 0) process.exit(0);

for (let index = 0; index < duplicates.length; index += 100) {
  const batch = duplicates.slice(index, index + 100).map(item => item.duplicate);
  const { error } = await bucket.remove(batch);
  if (error) throw error;
}
console.log(`Removed ${duplicates.length} verified duplicate objects (${totalBytes} bytes).`);
