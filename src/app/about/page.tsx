import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AboutPage from '@/components/AboutPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('About Africa Gem Finds', 'Learn how Africa Gem Finds draws on three generations in the gemstone trade to personally inspect and source rough gemstones.', '/about');

export default function Page() {
  return (
    <>
      <Nav transparent />
      <AboutPage />
      <Footer />
    </>
  );
}
