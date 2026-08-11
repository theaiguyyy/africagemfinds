import GemCategoryPage from '@/components/GemCategoryPage';

export const metadata = { title: 'Spessartite Garnet — Africa Gem Finds' };

export default function Page() {
  return (
    <GemCategoryPage
      name="Spessartite Garnet"
      accent="amber"
      accentVar="var(--amber)"
      species="Garnet (Spessartine)"
      color="Orange to Reddish–Orange"
      hardness="7–7.5 Mohs"
      description="A vivid orange to reddish-orange garnet, named for the Spessart region where it was first described. We are still building out our Spessartite Garnet inventory. Check back soon, or message us directly to ask what is available."
      slug="spessartite-garnet"
      emptyMessage="For current Spessartite Garnet availability, message us directly and we will help with your request."
    />
  );
}
