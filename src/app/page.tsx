import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HomePage from '@/components/HomePage';
import JsonLd from '@/components/JsonLd';
import { organizationJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Rough Gemstones Direct from Africa',
  'Explore personally inspected rough aquamarine, tourmaline, rubellite, morganite, spessartite garnet, and beryl from Africa.',
  '/',
);

export default function Page() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Nav transparent />
      <HomePage />
      <Footer />
    </>
  );
}
