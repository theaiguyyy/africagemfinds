import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'African Gemstone Blog',
  'Read practical guides on evaluating rough gemstones, African gemstone origins, wholesale buying, rubellite, and spessartite garnet.',
  '/blog',
);

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

