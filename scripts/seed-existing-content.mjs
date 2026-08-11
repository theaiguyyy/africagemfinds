/** Idempotently migrate the approved static website content into Supabase. */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(line => line && !line.startsWith('#') && line.includes('='))
  .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const categories = [
  ['aquamarine','Aquamarine','A blue to blue-green variety of beryl, prized for its clarity and calm color.',0,'/images/Stone2-040.jpg'],
  ['tourmaline','Tourmaline',"One of Africa's most prolific and varied gem minerals, ranging from deep greens to vivid pinks and rare indicolite blues.",1,'/images/Stone5-080.jpg'],
  ['rubylite','Rubylite','A vivid red to deep pink tourmaline, prized for its ruby-like color and strong saturation.',2,'/images/Stone3-054.jpg'],
  ['morganite','Morganite','A pink to peach-pink variety of beryl, favored for its delicate color and strong transparency.',3,'/images/Stone15-205.jpg'],
  ['spessartite-garnet','Spessartite Garnet','A vivid orange to reddish-orange garnet. Inventory photography is coming soon.',4,null],
  ['beryl','Beryl','African heliodor, goshenite, green beryl, and related rough varieties.',5,'/images/Stone13-175.jpg'],
];

const listings = [
  ['AQ-01','Aquamarine','4.8 ct','Eye clean','/images/Stone2-040.jpg'],
  ['AQ-02','Aquamarine','7.2 ct','Lightly included','/images/Stone1-029.jpg'],
  ['AQ-03','Aquamarine','3.1 ct','Eye clean','/images/Stone6-095.jpg'],
  ['AQ-04','Aquamarine','9.6 ct','Included','/images/Stone8-117.jpg'],
  ['AQ-05','Aquamarine','5.4 ct','Eye clean','/images/Stone9-129.jpg'],
  ['AQ-06','Aquamarine','2.9 ct','Eye clean','/images/Stone2-040.jpg'],
  ['TM-01','Tourmaline','6.1 ct','Eye clean','/images/Stone4-068.jpg'],
  ['TM-02','Tourmaline','4.3 ct','Lightly included','/images/Stone14-187.jpg'],
  ['MG-01','Morganite','5.7 ct','Eye clean','/images/Stone7-105.jpg'],
  ['BY-01','Beryl','8.2 ct','Eye clean','/images/Stone10-139.jpg'],
  ['BY-02','Beryl','5.5 ct','Lightly included','/images/Stone11-149.jpg'],
  ['BY-03','Beryl','11.3 ct','Eye clean','/images/Stone12-161.jpg'],
];

const featuredArticle = `Most people who message us about rough gemstones for the first time ask some version of the same question: how do you actually know if a stone is good? There is no shortcut that replaces years in the trade, but there are a handful of things worth learning to look at.

Color is usually the first thing anyone notices, and it is still the biggest driver of value in most gemstone varieties. Look at saturation and tone rather than just hue.

Rough stones almost always carry internal characteristics called inclusions. That is normal. What matters is whether they affect durability, transparency, or the finished piece once it is cut.

For anyone buying rough with cutting in mind, crystal shape matters as much as color or clarity. A well-formed crystal with clean faces will generally yield more finished carat weight.

Weight alone does not tell you much without factoring in color, clarity, and expected yield. Above all, ask where the material was sourced and whether it has been personally inspected.`;

const posts = [
  ['how-to-evaluate-rough-gemstones','Education',"How to Evaluate Rough Gemstones: A Buyer's Guide",'What actually separates a good rough stone from an ordinary one, and how to look at color, clarity, and crystal shape before you buy.','/images/Stone9-129.jpg',featuredArticle],
  ['why-african-gemstones-are-having-a-moment','Market','Why African Gemstones Are Having a Moment','A field note on demand, provenance, and the growing attention around African rough.','/images/Stone2-040.jpg','Draft article copy will be added from the approved editorial document.'],
  ['aquamarine-vs-beryl','Gem Guide',"Aquamarine vs. Beryl: What's Actually the Difference?",'A straightforward guide to the beryl family and where aquamarine fits.','/images/Stone34-559.jpg','Draft article copy will be added from the approved editorial document.'],
  ['sourcing-direct','Sourcing','Sourcing Direct: What Buying Rough Actually Looks Like','What direct sourcing changes for provenance, communication, and pricing.','/images/Stone5-080.jpg','Draft article copy will be added from the approved editorial document.'],
  ['tourmaline-color-range','Gem Guide',"Tourmaline's Color Range, Explained",'From green and pink material to rare indicolite blues.','/images/Stone7-105.jpg','Draft article copy will be added from the approved editorial document.'],
  ['rough-vs-cut','Market','Rough vs. Cut: Why Some Buyers Prefer It Unprocessed','Why collectors, cutters, and trade buyers may choose material in its natural state.','/images/Stone3-054.jpg','Draft article copy will be added from the approved editorial document.'],
  ['reading-a-gemstone-parcel','Education','Reading a Gemstone Parcel Like a Trader Does','A practical introduction to comparing rough material across a parcel.','/images/Stone34-536.jpg','Draft article copy will be added from the approved editorial document.'],
];

async function check(result, label) { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; }

await check(await supabase.from('categories').upsert(categories.map(([slug,name,description,position]) => ({ slug,name,description,position })), { onConflict: 'slug' }), 'categories');
await check(await supabase.from('media').update({ featured: false }).eq('featured', true), 'reset covers');
const mediaRows = categories.filter(row => row[4]).map(([slug,name,,,url], position) => ({ name:`${name} cover`, url, storage_path:`seed/category-covers/${slug}`, category:name, featured:true, position }));
await check(await supabase.from('media').upsert(mediaRows, { onConflict: 'storage_path' }), 'media covers');
await check(await supabase.from('listings').upsert(listings.map(([title,category,weight,description,photo_url], position) => ({ title, slug:title.toLowerCase(), category, weight, origin:'Africa', description, photo_url, status:'available', position })), { onConflict: 'slug' }), 'listings');
await check(await supabase.from('blog_posts').upsert(posts.map(([slug,tag,title,excerpt,cover_url,content], position) => ({ slug,tag,title,excerpt,cover_url,content,published:true,published_at:new Date(Date.UTC(2026,7,1-position)).toISOString(),position })), { onConflict: 'slug' }), 'blog posts');

const counts = await Promise.all(['categories','media','listings','blog_posts'].map(async table => ({ table, count: (await supabase.from(table).select('*', { count:'exact', head:true })).count })));
console.log(counts.map(item => `${item.table}=${item.count}`).join(' '));
