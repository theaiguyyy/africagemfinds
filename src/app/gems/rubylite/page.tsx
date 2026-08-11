import GemCategoryPage from '@/components/GemCategoryPage';

export const metadata = { title: 'Rubylite — Africa Gem Finds' };

export default function Page() {
  return (
    <GemCategoryPage
      name="Rubylite"
      accent="ruby"
      accentVar="var(--ruby)"
      species="Tourmaline (Rubellite)"
      color="Red, Deep Pink"
      hardness="7–7.5 Mohs"
      description="A vivid red to deep pink tourmaline, prized for its ruby-like color and strong saturation. African rubylite is among the most sought-after material in the rough gemstone trade."
      slug="rubylite"
      heroImg="/images/Stone3-054.jpg"
    />
  );
}
