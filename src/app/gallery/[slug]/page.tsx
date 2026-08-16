import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import StickyNav from '@/components/StickyNav';
import { educationalFact, statusContent } from '@/lib/gallery/content';
import { getGalleryStoneBySlug } from '@/lib/gallery/data';
import { gallerySizes, storageVariant } from '@/lib/gallery/images';
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from '@/lib/seo';
import styles from './stone.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stone = await getGalleryStoneBySlug(slug);
  if (!stone) return { title: 'Stone Not Found', robots: { index: false, follow: false } };
  const primary = stone.images.find((image) => image.isPrimary) ?? stone.images[0];
  const description = stone.description || `${stone.title}, reference ${stone.sku}. ${stone.publicWeight}; origin ${stone.origin}; status ${stone.status}.`;
  const canonical = absoluteUrl(`/gallery/${stone.slug}`);
  return {
    title: stone.title,
    description,
    alternates: { canonical },
    openGraph: { title: stone.title, description, url: canonical, type: 'website', images: [{ url: primary.url, width: primary.width, height: primary.height, alt: primary.alt }] },
    twitter: { card: 'summary_large_image', title: stone.title, description, images: [primary.url] },
  };
}

export default async function GalleryStonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stone = await getGalleryStoneBySlug(slug);
  if (!stone) notFound();
  const primary = stone.images.find((image) => image.isPrimary) ?? stone.images[0];
  const ordered = [primary, ...stone.images.filter((image) => image.id !== primary.id)].slice(0, 3);
  const status = statusContent(stone.status);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }, { name: stone.title, path: `/gallery/${stone.slug}` }])} />
      <JsonLd data={productJsonLd(stone)} />
      <StickyNav />
      <main className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/gallery">Gallery</Link><span>/</span><span>{stone.title}</span></nav>
        <article className={styles.stone}>
          <div className={styles.viewer}>
            <div className={styles.primary}>
              <Image src={storageVariant(primary.url, 1600)} alt={primary.alt} fill sizes={gallerySizes.detail} quality={95} preload />
            </div>
            {ordered.length > 1 && <div className={styles.alternates}>{ordered.map((image) => <div key={image.id}><Image src={storageVariant(image.url, 640)} alt={image.alt} fill sizes="(max-width: 800px) 33vw, 180px" quality={95} loading="lazy" /></div>)}</div>}
          </div>
          <div className={styles.details}>
            <span>{stone.family} · {stone.sku}</span>
            <h1>{stone.title}</h1>
            <dl>
              <div><dt>Reference</dt><dd>{stone.sku}</dd></div>
              <div><dt>Gemstone</dt><dd>{stone.family}</dd></div>
              <div><dt>Origin</dt><dd>{stone.origin}</dd></div>
              <div><dt>Weight</dt><dd>{stone.publicWeight}</dd></div>
              <div><dt>Availability</dt><dd className={stone.status === 'sold' ? styles.statusSold : styles.statusAvailable}>{stone.status === 'sold' ? 'Sold' : 'Available'}</dd></div>
            </dl>
            {stone.description && <p>{stone.description}</p>}
            <aside><strong>Gemstone note</strong><p>{educationalFact(stone)}</p></aside>
            <p className={styles.supporting}>{status.supporting}</p>
            <Link className={styles.cta} href={`/gallery?stone=${encodeURIComponent(stone.id)}`}>{status.cta}</Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
