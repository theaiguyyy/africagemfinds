import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

export const catalogue = [
  ['Madagascar Aquamarine Rough Parcel', 'Aquamarine', 'Madagascar', '2467kg', null, null, 'Weight to be confirmed'],
  ['Congo Tourmaline Parcel', 'Tourmaline', 'Congo', '1400kg', null, null, 'Weight to be confirmed'],
  ['Nigerian Aquamarine Rough Parcel', 'Aquamarine', 'Nigeria', '2642kg', null, null, 'Weight to be confirmed'],
  ['Nigerian Beryl Parcel I', 'Beryl', 'Nigeria', '', null, null, 'Weight on request'],
  ['Nigerian Beryl Parcel II', 'Beryl', 'Nigeria', '', null, null, 'Weight on request'],
  ['Mozambique Aquamarine Rough Parcel', 'Aquamarine', 'Mozambique', '2015kg', null, null, 'Weight to be confirmed'],
  ['Pink Morganite Parcel', 'Morganite', '', '1620kg', null, null, 'Weight to be confirmed'],
  ['New Mine Ofiki Aquamarine', 'Aquamarine', 'Nigeria', '596g', 596, 'g', '596 g'],
  ['Ofiki Aquamarine, Top Quality Small Size', 'Aquamarine', 'Nigeria', '468g', 468, 'g', '468 g'],
  ['Ofiki Aquamarine, Top Quality Big Size', 'Aquamarine', 'Nigeria', '731g', 731, 'g', '731 g'],
  ['Nigerian Aquamarine, Medium Quality', 'Aquamarine', 'Nigeria', '2789kg', null, null, 'Weight to be confirmed'],
  ['Mozambique Aquamarine Parcel', 'Aquamarine', 'Mozambique', '1526kg', null, null, 'Weight to be confirmed'],
  ['Madagascar Aquamarine Parcel', 'Aquamarine', 'Madagascar', '2216.00, unit not supplied', null, null, 'Weight to be confirmed'],
  ['Nigerian Beryl Parcel III', 'Beryl', 'Nigeria', '2118kg', null, null, 'Weight to be confirmed'],
  ['Nigerian Aquamarine Parcel I', 'Aquamarine', 'Nigeria', '1233kg', null, null, 'Weight to be confirmed'],
  ['Nigerian Aquamarine Parcel II', 'Aquamarine', 'Nigeria', '1296kg', null, null, 'Weight to be confirmed'],
  ['Madagascar Aquamarine Parcel II', 'Aquamarine', 'Madagascar', '1600kg', null, null, 'Weight to be confirmed'],
  ['Madagascar Aquamarine Parcel III', 'Aquamarine', 'Madagascar', '', null, null, 'Weight on request'],
  ['Yellow Aquamarine, Madagascar I', 'Aquamarine', 'Madagascar', '', null, null, 'Weight on request'],
  ['Yellow Aquamarine, Madagascar II', 'Aquamarine', 'Madagascar', '', null, null, 'Weight on request'],
  ['Afghanistan Tourmaline Parcel', 'Tourmaline', 'Afghanistan', '2497kg', null, null, 'Weight to be confirmed'],
  ['Nigerian Agate Parcel', 'Agate', 'Nigeria', '', null, null, 'Weight on request'],
  ['Rose Cut Gemstone Parcel', 'Gemstone', '', '2655kg', null, null, 'Weight to be confirmed'],
  ['Black Tourmaline Parcel', 'Tourmaline', '', '', null, null, 'Weight on request'],
  ['Nigerian Goshenite Parcel', 'Goshenite', 'Nigeria', '', null, null, 'Weight on request'],
  ['Mixed Green, Blue and Multicolour Tourmaline', 'Tourmaline', '', '', null, null, 'Weight on request'],
  ['Nigerian Rubellite Parcel', 'Rubellite', 'Nigeria', '393g', 393, 'g', '393 g'],
  ['Nigerian Potato Tourmaline Parcel', 'Tourmaline', 'Nigeria', '520g', 520, 'g', '520 g'],
].map((row, index) => ({
  number: index + 1, title: row[0], family: row[1], origin: row[2], rawWeight: row[3],
  weightValue: row[4], weightUnit: row[5], publicWeight: row[6], sku: `AGF-GAL-${String(index + 1).padStart(3, '0')}`,
}));

export function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function groupAssets(root) {
  const groups = new Map();
  const unmatched = [];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    if (entry.name.startsWith('.') || ['thumbs.db', 'desktop.ini'].includes(entry.name.toLowerCase())) return;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    if (!SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return;
    const relative = path.relative(root, absolute);
    const match = path.parse(entry.name).name.match(/^(Stone\d+)(?:[-_ ].*)?$/i);
    if (!match) return unmatched.push(relative);
    const key = match[1].toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), { absolute, relative }]);
  });
  walk(root);
  for (const files of groups.values()) files.sort((a, b) => naturalCompare(a.relative, b.relative));
  return { groups, unmatched: unmatched.sort(naturalCompare) };
}

export function buildImportPlan(groups) {
  return catalogue.map(record => {
    const files = groups.get(`stone${record.number}`) ?? [];
    const chosen = files.slice(0, 3);
    const warnings = [];
    if (!files.length) warnings.push('No source images found; record cannot be imported.');
    if (!record.origin) warnings.push('Origin not supplied.');
    if (!record.weightValue) warnings.push(record.rawWeight ? `Weight unit requires review: ${record.rawWeight}.` : 'Weight not supplied.');
    if (files.length > 3) warnings.push(`${files.length - 3} additional source image(s) retained but not imported.`);
    return { ...record, slug: `gallery-${record.sku.toLowerCase()}`, status: 'available', publishState: 'published', sourceFiles: files.map(f => f.relative), primaryImage: chosen[0]?.relative ?? null, alternateImages: chosen.slice(1).map(f => f.relative), warnings };
  });
}

async function imageMetadata(file) {
  const meta = await sharp(file.absolute).metadata();
  return { width: meta.width, height: meta.height, mimeType: `image/${meta.format === 'jpg' ? 'jpeg' : meta.format}` };
}

export function planUpserts(existingSkus, manifest) {
  return manifest.map(record => ({ action: existingSkus.has(record.sku) ? 'update' : 'insert', sku: record.sku }));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const writeDevelopment = args.has('--write-development');
  const writeProduction = args.has('--write-approved-production');
  const write = writeDevelopment || writeProduction;
  const rootArg = process.argv.find(arg => arg.startsWith('--source='))?.slice(9);
  const source = path.resolve(rootArg || path.join(process.cwd(), 'agf'));
  if (!fs.existsSync(source)) throw new Error(`Gallery source folder not found: ${source}. Pass --source=/absolute/path when reviewing an external source.`);
  const { groups, unmatched } = groupAssets(source);
  const manifest = buildImportPlan(groups);
  const extraGroups = [...groups.keys()].filter(key => Number(key.replace(/\D/g, '')) > 28).sort(naturalCompare).map(key => ({ group: key, files: groups.get(key).map(file => file.relative), warning: 'Outside the approved first 28 catalogue records; not imported.' }));
  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'gallery-import-manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), source: path.basename(source), records: manifest }, null, 2));
  fs.writeFileSync(path.join(dataDir, 'gallery-unmatched-assets.json'), JSON.stringify({ generatedAt: new Date().toISOString(), unmatched, extraGroups }, null, 2));
  console.log(`Dry-run manifest: ${manifest.length} records; ${groups.size} groups; ${unmatched.length} unmatched files; ${extraGroups.length} extra groups.`);
  if (!write) return;
  if (writeDevelopment && process.env.ALLOW_GALLERY_DEVELOPMENT_WRITE !== 'true') throw new Error('Development write blocked. Set ALLOW_GALLERY_DEVELOPMENT_WRITE=true.');
  if (writeProduction && process.env.ALLOW_GALLERY_PRODUCTION_WRITE !== 'true') throw new Error('Production write blocked. Explicit approval requires ALLOW_GALLERY_PRODUCTION_WRITE=true.');
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = Object.fromEntries(envFile.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: existing, error: existingError } = await supabase.from('listings').select('sku').in('sku', manifest.map(r => r.sku));
  if (existingError) throw existingError;
  console.table(planUpserts(new Set(existing.map(row => row.sku)), manifest));
  for (const record of manifest) {
    if (!record.primaryImage) continue;
    const listing = { sku: record.sku, title: record.title, slug: record.slug, category: record.family, gemstone_family: record.family, origin: record.origin, weight_value: record.weightValue, weight_unit: record.weightUnit, public_weight_label: record.publicWeight, raw_source_weight_note: record.rawWeight, status: record.status, publish_state: record.publishState, position: record.number - 1, import_key: `gallery-stone-${record.number}` };
    const { data: current, error: lookupError } = await supabase.from('listings').select('id').eq('sku', record.sku).maybeSingle();
    if (lookupError) throw lookupError;
    const saveQuery = current
      ? supabase.from('listings').update(listing).eq('id', current.id)
      : supabase.from('listings').insert(listing);
    const { data: saved, error } = await saveQuery.select('id').single();
    if (error) throw error;
    const selected = (groups.get(`stone${record.number}`) ?? []).slice(0, 3);
    const rows = await Promise.all(selected.map(async (file, index) => {
      const metadata = await imageMetadata(file);
      const storageKey = `gallery/${record.sku}/${path.basename(file.relative)}`;
      const { error: uploadError } = await supabase.storage.from('gem-photos').upload(storageKey, fs.readFileSync(file.absolute), { contentType: metadata.mimeType, cacheControl: '31536000', upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('gem-photos').getPublicUrl(storageKey);
      return { listing_id: saved.id, storage_key: storageKey, source_filename: file.relative, url: publicData.publicUrl, width: metadata.width, height: metadata.height, mime_type: metadata.mimeType, alt_text: `${record.title}, view ${index + 1}`, sort_order: index, is_primary: index === 0 };
    }));
    await supabase.from('listing_images').update({ is_primary: false }).eq('listing_id', saved.id);
    const { error: imageError } = await supabase.from('listing_images').upsert(rows, { onConflict: 'listing_id,storage_key' });
    if (imageError) throw imageError;
    const { error: coverError } = await supabase.from('listings').update({ photo_url: rows[0].url }).eq('id', saved.id);
    if (coverError) throw coverError;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
