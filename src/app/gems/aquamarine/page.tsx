import GemCategoryPage from '@/components/GemCategoryPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Rough Aquamarine', 'Explore rough aquamarine, the blue to blue-green variety of beryl, with available African gemstone parcels for direct inquiry.', '/gems/aquamarine');

const specimens = [
  { id: 'AQ-01', weight: '4.8 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone2-040.jpg' },
  { id: 'AQ-02', weight: '7.2 ct', origin: 'Africa', clarity: 'Lightly included', img: '/images/Stone1-029.jpg' },
  { id: 'AQ-03', weight: '3.1 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone6-095.jpg' },
  { id: 'AQ-04', weight: '9.6 ct', origin: 'Africa', clarity: 'Included', img: '/images/Stone8-117.jpg' },
  { id: 'AQ-05', weight: '5.4 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone9-129.jpg' },
  { id: 'AQ-06', weight: '2.9 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone2-040.jpg' },
];

export default function Page() {
  return (
    <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gem Categories', path: '/gems/aquamarine' }, { name: 'Aquamarine', path: '/gems/aquamarine' }])} /><GemCategoryPage
      name="Aquamarine"
      accent="blue"
      accentVar="var(--blue)"
      species="Beryl"
      color="Blue, Blue–Green"
      hardness="7.5–8 Mohs"
      description="A blue to blue-green variety of beryl, prized for its clarity and calm color. Every piece here is rough and unprocessed, personally inspected before it's listed, sourced directly from across Africa."
      slug="aquamarine"
      heroImg="/images/Stone2-040.jpg"
      specimens={specimens}
    /></>
  );
}
