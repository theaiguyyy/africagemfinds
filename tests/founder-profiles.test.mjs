import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import jsQR from 'jsqr';
import sharp from 'sharp';
import {
  COMPANY_CONTACT,
  FOUNDER_PROFILES,
  founderProfileUrl,
  founderVCard,
  founderWhatsAppUrl,
} from '../src/lib/founders.ts';

test('founder profiles contain the approved identity and contact information', () => {
  assert.deepEqual(
    Object.values(FOUNDER_PROFILES).map(({ fullName, role, phoneE164 }) => ({ fullName, role, phoneE164 })),
    [
      { fullName: 'Aly Sylla', role: 'Co-Founder & Operations Manager', phoneE164: '+66617472342' },
      { fullName: 'Ibrahim Camara', role: 'Co-Founder & Sales Manager', phoneE164: '+66629214063' },
    ],
  );
  assert.equal(COMPANY_CONTACT.email, 'africagemfinds@gmail.com');
  assert.equal(COMPANY_CONTACT.instagramHandle, '@african_gem_finds');
});

test('WhatsApp links use normalized founder numbers and a business-card introduction', () => {
  for (const founder of Object.values(FOUNDER_PROFILES)) {
    const url = new URL(founderWhatsAppUrl(founder));
    assert.equal(url.hostname, 'wa.me');
    assert.equal(url.pathname, `/${founder.phoneE164.replace(/\D/g, '')}`);
    assert.match(url.searchParams.get('text') ?? '', /business card/i);
    assert.match(url.searchParams.get('text') ?? '', new RegExp(founder.givenName));
  }
});

test('vCards contain only approved founder and company contact fields', () => {
  for (const founder of Object.values(FOUNDER_PROFILES)) {
    const card = founderVCard(founder);
    assert.match(card, /^BEGIN:VCARD\r\nVERSION:4\.0\r\n/);
    assert.match(card, new RegExp(`FN:${founder.fullName}`));
    assert.match(card, new RegExp(`TITLE:${founder.role.replace('&', '\\&')}`));
    assert.match(card, new RegExp(`tel:${founder.phoneE164.replace('+', '\\+')}`));
    assert.match(card, new RegExp(COMPANY_CONTACT.email));
    assert.match(card, /END:VCARD\r\n$/);
  }
});

test('generated QR PNG and SVG assets decode to their canonical profile URLs', async () => {
  for (const founder of Object.values(FOUNDER_PROFILES)) {
    const expected = founderProfileUrl(founder);
    for (const extension of ['png', 'svg']) {
      const source = fileURLToPath(new URL(`../public/qr/${founder.slug}-contact-qr.${extension}`, import.meta.url));
      for (const width of [1200, 300]) {
        const { data, info } = await sharp(source).resize(width, width, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
        assert.equal(decoded?.data, expected, `${founder.slug} ${extension} should decode correctly at ${width}px`);
      }
    }
  }
});

test('founder pages are noindex, excluded from sitemap constants, and legacy spelling redirects', async () => {
  const [profilePage, sitemapSource, seoSource, redirectPage] = await Promise.all([
    readFile(new URL('../src/app/connect/[founder]/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/seo.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/connect/ali/page.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(profilePage, /index: false/);
  assert.doesNotMatch(sitemapSource, /connect/);
  assert.doesNotMatch(seoSource.match(/PUBLIC_STATIC_PATHS[\s\S]*?\];/)?.[0] ?? '', /connect/);
  assert.match(redirectPage, /permanentRedirect\('\/connect\/aly'\)/);
});
