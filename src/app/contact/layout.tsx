import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'Contact and Gemstone Inquiries',
  'Contact Africa Gem Finds in Bangkok about rough gemstones, current availability, wholesale parcels, or a specific material you are seeking.',
  '/contact',
);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

