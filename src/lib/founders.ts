const SITE_URL = 'https://www.africagemfinds.com';

export type FounderSlug = 'aly' | 'ibrahim';

export type FounderProfile = {
  slug: FounderSlug;
  givenName: string;
  familyName: string;
  fullName: string;
  role: string;
  phoneDisplay: string;
  phoneE164: string;
  portrait: string;
  portraitAlt: string;
  portraitPosition: string;
};

export const COMPANY_CONTACT = {
  name: 'Africa Gem Finds',
  email: 'africagemfinds@gmail.com',
  instagramHandle: '@african_gem_finds',
  instagramUrl: 'https://www.instagram.com/african_gem_finds',
  website: SITE_URL,
} as const;

export const FOUNDER_PROFILES: Record<FounderSlug, FounderProfile> = {
  aly: {
    slug: 'aly',
    givenName: 'Aly',
    familyName: 'Sylla',
    fullName: 'Aly Sylla',
    role: 'Co-Founder & Operations Manager',
    phoneDisplay: '+66 61 747 2342',
    phoneE164: '+66617472342',
    portrait: '/images/Stone34-592.jpg',
    portraitAlt: 'Aly Sylla inspecting rough gemstones',
    portraitPosition: '50% 30%',
  },
  ibrahim: {
    slug: 'ibrahim',
    givenName: 'Ibrahim',
    familyName: 'Camara',
    fullName: 'Ibrahim Camara',
    role: 'Co-Founder & Sales Manager',
    phoneDisplay: '+66 62 921 4063',
    phoneE164: '+66629214063',
    portrait: '/images/Stone34-534.jpg',
    portraitAlt: 'Ibrahim Camara with inspected rough aquamarine',
    portraitPosition: '52% 50%',
  },
};

export const FOUNDER_SLUGS = Object.keys(FOUNDER_PROFILES) as FounderSlug[];

export function getFounderProfile(slug: string) {
  return FOUNDER_PROFILES[slug as FounderSlug];
}

export function founderProfileUrl(founder: FounderProfile) {
  return `${SITE_URL}/connect/${founder.slug}`;
}

export function founderWhatsAppUrl(founder: FounderProfile) {
  const digits = founder.phoneE164.replace(/\D/g, '');
  const message = `Hello ${founder.givenName}, I scanned your Africa Gem Finds business card and would like to connect.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function founderVCard(founder: FounderProfile) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `N:${escapeVCard(founder.familyName)};${escapeVCard(founder.givenName)};;;`,
    `FN:${escapeVCard(founder.fullName)}`,
    `ORG:${escapeVCard(COMPANY_CONTACT.name)}`,
    `TITLE:${escapeVCard(founder.role)}`,
    `TEL;TYPE=cell,voice;VALUE=uri:tel:${founder.phoneE164}`,
    `EMAIL;TYPE=work:${COMPANY_CONTACT.email}`,
    `URL;TYPE=work:${COMPANY_CONTACT.website}`,
    `URL;TYPE=Instagram:${COMPANY_CONTACT.instagramUrl}`,
    `URL;TYPE=WhatsApp:${founderWhatsAppUrl(founder)}`,
    'END:VCARD',
  ];
  return `${lines.join('\r\n')}\r\n`;
}
