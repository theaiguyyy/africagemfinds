import GemCategoryPage from '@/components/GemCategoryPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Rough Beryl', 'Explore rough African beryl, including green beryl, goshenite, and related varieties, with parcels available for direct inquiry.', '/gems/beryl');

const specimens = [
  { id: 'BY-01', weight: '8.2 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone10-139.jpg' },
  { id: 'BY-02', weight: '5.5 ct', origin: 'Africa', clarity: 'Lightly included', img: '/images/Stone11-149.jpg' },
  { id: 'BY-03', weight: '11.3 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone12-161.jpg' },
];

export default function Page() {
  return (
    <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gem Categories', path: '/gems/aquamarine' }, { name: 'Beryl', path: '/gems/beryl' }])} /><GemCategoryPage
      name="Beryl"
      accent="teal"
      accentVar="var(--teal)"
      species="Beryl"
      color="Yellow, Green, White"
      hardness="7.5–8 Mohs"
      description="Beyond aquamarine and morganite, Africa produces a wide range of beryl varieties — heliodor, goshenite, and green beryl among them. Rough and unprocessed, inspected directly at source."
      slug="beryl"
      heroImg="/images/Stone13-175.jpg"
      specimens={specimens}
    /></>
  );
}
