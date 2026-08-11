import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AboutPage from '@/components/AboutPage';

export const metadata = {
  title: 'About — Africa Gem Finds',
  description: 'Three generations of gemstone trading. A trusted bridge between Africa\'s gemstone-rich regions and a global community of collectors and trade buyers.',
};

export default function Page() {
  return (
    <>
      <Nav transparent />
      <AboutPage />
      <Footer />
    </>
  );
}
