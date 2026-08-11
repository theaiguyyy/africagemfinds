import GemCategoryPage from '@/components/GemCategoryPage';

export const metadata = { title: 'Tourmaline — Africa Gem Finds' };

const specimens = [
  { id: 'TM-01', weight: '6.1 ct', origin: 'Africa', clarity: 'Eye clean', img: '/images/Stone4-068.jpg' },
  { id: 'TM-02', weight: '4.3 ct', origin: 'Africa', clarity: 'Lightly included', img: '/images/Stone14-187.jpg' },
];

export default function Page() {
  return (
    <GemCategoryPage
      name="Tourmaline"
      accent="green"
      accentVar="var(--green)"
      species="Tourmaline"
      color="Green, Pink, Multi-Color"
      hardness="7–7.5 Mohs"
      description="One of Africa's most prolific and varied gem minerals. Tourmaline from the continent ranges from deep greens to vivid pinks and rare indicolite blues, personally sourced and inspected."
      slug="tourmaline"
      heroImg="/images/Stone5-080.jpg"
      specimens={specimens}
    />
  );
}
