import StickyNav from '@/components/StickyNav';
import Footer from '@/components/Footer';
import GalleryClient from '@/components/GalleryClient';
import { getGalleryStones } from '@/lib/gallery/data';

export const metadata = { title: 'Gallery — Africa Gem Finds', description: 'Explore available and previously sold African rough gemstone parcels.' };
export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const stones = await getGalleryStones();
  return <><StickyNav /><GalleryClient stones={stones} /><Footer /></>;
}
