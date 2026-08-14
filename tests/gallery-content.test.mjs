import test from 'node:test';
import assert from 'node:assert/strict';

const source = await import('../src/lib/gallery/content.ts');
const images = await import('../src/lib/gallery/images.ts');

test('status copy and inquiry messages distinguish available and sold stones', () => {
  assert.equal(source.statusContent('available').cta, 'Inquire about this stone');
  assert.equal(source.statusContent('sold').cta, 'Ask about similar stones');
  assert.match(source.inquiryMessage('available', 'Test Stone', 'AGF-1'), /I’m interested in Test Stone/);
  assert.match(source.inquiryMessage('sold', 'Test Stone', 'AGF-1'), /stones similar to Test Stone/);
});

test('educational facts use custom CMS copy and safe family fallbacks', () => {
  assert.equal(source.educationalFact({ family: 'Aquamarine', educationalNote: 'Custom fact' }), 'Custom fact');
  assert.match(source.educationalFact({ family: 'Tourmaline', educationalNote: '' }), /colour ranges/i);
  assert.match(source.educationalFact({ family: 'Unknown', educationalNote: '' }), /natural crystal surfaces/i);
});

test('responsive image helper transforms only Supabase public storage URLs', () => {
  const url = 'https://demo.supabase.co/storage/v1/object/public/gem-photos/gallery/a.jpg';
  assert.match(images.storageVariant(url, 720), /render\/image\/public/);
  assert.match(images.storageVariant(url, 720), /width=720/);
  assert.equal(images.storageVariant('/AGF/Stone1-028.jpg', 720), '/AGF/Stone1-028.jpg');
});
