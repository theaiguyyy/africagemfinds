import StickyNav from '@/components/StickyNav';
import Footer from '@/components/Footer';
import GalleryClient from '@/components/GalleryClient';
import { getGalleryStones } from '@/lib/gallery/data';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Rough Gemstone Gallery',
  'Browse available and previously sold rough gemstone parcels, with verified origin and weight details where supplied.',
  '/gallery',
);
export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const stones = await getGalleryStones();
  return <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }])} /><StickyNav /><GalleryClient stones={stones} /><Footer /></>;
}
