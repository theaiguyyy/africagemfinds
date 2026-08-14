import GemCategoryPage from '@/components/GemCategoryPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Rough Spessartite Garnet', 'Learn about vivid orange to reddish-orange spessartite garnet and inquire about rough African material and current availability.', '/gems/spessartite-garnet');

export default function Page() {
  return (
    <><JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gem Categories', path: '/gems/aquamarine' }, { name: 'Spessartite Garnet', path: '/gems/spessartite-garnet' }])} /><GemCategoryPage
      name="Spessartite Garnet"
      accent="amber"
      accentVar="var(--amber)"
      species="Garnet (Spessartine)"
      color="Orange to Reddish–Orange"
      hardness="7–7.5 Mohs"
      description="A vivid orange to reddish-orange garnet, named for the Spessart region where it was first described. We are still building out our Spessartite Garnet inventory. Check back soon, or message us directly to ask what is available."
      slug="spessartite-garnet"
      emptyMessage="For current Spessartite Garnet availability, message us directly and we will help with your request."
    /></>
  );
}
