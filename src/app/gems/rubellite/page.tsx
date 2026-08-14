import GemCategoryPage from '@/components/GemCategoryPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Rough Rubellite', 'Explore rough rubellite, the richly pink to red variety of tourmaline, with African material presented for direct inquiry.', '/gems/rubellite');

export default function Page() {
  return (
    <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gem Categories', path: '/gems/aquamarine' }, { name: 'Rubellite', path: '/gems/rubellite' }])} /><GemCategoryPage
      name="Rubellite"
      accent="ruby"
      accentVar="var(--ruby)"
      species="Tourmaline (Rubellite)"
      color="Red, Deep Pink"
      hardness="7–7.5 Mohs"
      description="A vivid red to deep pink tourmaline, prized for its ruby-like color and strong saturation. African rubellite is among the most sought-after material in the rough gemstone trade."
      slug="rubellite"
      heroImg="/images/Stone3-054.jpg"
    /></>
  );
}
