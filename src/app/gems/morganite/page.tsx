import GemCategoryPage from '@/components/GemCategoryPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Rough Morganite', 'Explore rough morganite, the pink to peach variety of beryl, with African parcels presented for direct inquiry.', '/gems/morganite');

const specimens = [
  { id: 'MG-01', weight: '5.7 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone7-105.jpg' },
];

export default function Page() {
  return (
    <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gem Categories', path: '/gems/aquamarine' }, { name: 'Morganite', path: '/gems/morganite' }])} /><GemCategoryPage
      name="Morganite"
      accent="blush"
      accentVar="var(--blush)"
      species="Beryl"
      color="Pink, Peach, Rose"
      hardness="7.5–8 Mohs"
      description="A pink to peach-pink variety of beryl, favored for its delicate color and strong transparency. African morganite is sourced directly at origin and offered in rough, unprocessed form."
      slug="morganite"
      heroImg="/images/Stone15-205.jpg"
      specimens={specimens}
    /></>
  );
}
