import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HomePage from '@/components/HomePage';

export const metadata = {
  title: 'Africa Gem Finds — Rough Gemstones Direct from Africa',
  description: 'Rough gemstones sourced directly across Africa. Aquamarine, tourmaline, rubylite, morganite, spessartite garnet, and beryl. Based in Bangkok.',
};

export default function Page() {
  return (
    <>
      <Nav transparent />
      <HomePage />
      <Footer />
    </>
  );
}
