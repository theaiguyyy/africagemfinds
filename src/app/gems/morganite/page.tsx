import GemCategoryPage from '@/components/GemCategoryPage';

export const metadata = { title: 'Morganite — Africa Gem Finds' };

const specimens = [
  { id: 'MG-01', weight: '5.7 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone7-105.jpg' },
];

export default function Page() {
  return (
    <GemCategoryPage
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
    />
  );
}
