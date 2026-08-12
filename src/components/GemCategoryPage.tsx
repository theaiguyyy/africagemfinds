'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StickyNav from './StickyNav';
import Footer from './Footer';
import styles from './GemCategoryPage.module.css';

export interface GemFact { label: string; value: string; }
export interface GemSpec {
  key?: string;
  id: string;
  weight: string;
  origin: string;
  clarity: string;
  img?: string;
}

interface Props {
  name: string;
  accent: string;
  accentVar: string;
  species: string;
  color: string;
  hardness: string;
  description: string;
  slug: string;
  heroImg?: string;
  specimens?: GemSpec[];
  emptyMessage?: string;
}

const gemCategories = [
  { name: 'Aquamarine', href: '/gems/aquamarine', color: 'var(--blue)' },
  { name: 'Tourmaline', href: '/gems/tourmaline', color: 'var(--green)' },
  { name: 'Rubylite', href: '/gems/rubylite', color: 'var(--ruby)' },
  { name: 'Morganite', href: '/gems/morganite', color: 'var(--blush)' },
  { name: 'Spessartite Garnet', href: '/gems/spessartite-garnet', color: 'var(--amber)' },
  { name: 'Beryl', href: '/gems/beryl', color: 'var(--teal)' },
];

export default function GemCategoryPage({
  name, accent, accentVar, species, color, hardness, description, slug, heroImg, specimens = [], emptyMessage,
}: Props) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const [cmsHero, setCmsHero] = useState(heroImg);
  const [cmsSpecimens, setCmsSpecimens] = useState(specimens);

  useEffect(() => {
    let active = true;
    import('@/lib/supabase/config').then(async ({ hasSupabaseConfig }) => {
      if (!hasSupabaseConfig()) return;
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const [{ data: cover }, { data: rows }] = await Promise.all([
        supabase.from('media').select('url').eq('category', name).eq('featured', true).maybeSingle(),
        supabase.from('listings').select('*').eq('category', name).in('status', ['available', 'reserved']).not('title', 'ilike', '% cover').order('position'),
      ]);
      if (!active) return;
      if (cover?.url) setCmsHero(cover.url);
      if (rows) setCmsSpecimens(rows.map((row: Record<string, any>) => ({ key: row.id, id: row.title, weight: row.weight || 'Weight on request', origin: row.origin || 'Africa', clarity: row.status === 'reserved' ? 'Reserved' : 'Available', img: row.photo_url })));
    });
    return () => { active = false; };
  }, [name]);

  useEffect(() => {
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      // §6.7 category hero parallax
      gsap.to('.cat-hero-bg-img', {
        yPercent: 20, ease: 'none',
        scrollTrigger: { trigger: '.cat-hero', start: 'top top', end: 'bottom top', scrub: true },
      });

      // §6.8 specimen card hover lift
      gsap.utils.toArray<HTMLElement>('.specimen-card').forEach(card => {
        card.addEventListener('mouseenter', () =>
          gsap.to(card, { y: -6, boxShadow: '0 16px 40px rgba(23,20,15,0.14)', duration: 0.3, ease: 'power2.out' })
        );
        card.addEventListener('mouseleave', () =>
          gsap.to(card, { y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.35, ease: 'power2.inOut' })
        );
      });

      gsap.utils.toArray('.reveal').forEach((el: any) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
    };

    init();

    // Banner loupe
    const lensSize = 190, zoom = 2.0;
    function moveLens(e: MouseEvent) {
      const banner = bannerRef.current;
      const lens = lensRef.current;
      const img = bannerImgRef.current;
      if (!banner || !lens || !img) return;
      const rect = banner.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const relY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      lens.style.left = (relX - lensSize / 2) + 'px';
      lens.style.top = (relY - lensSize / 2) + 'px';
      lens.style.backgroundImage = `url(${img.src})`;
      lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
      lens.style.backgroundPosition = `${-relX * zoom + lensSize / 2}px ${-relY * zoom + lensSize / 2}px`;
    }
    const banner = bannerRef.current;
    if (banner) {
      banner.addEventListener('mousemove', moveLens);
      banner.addEventListener('mouseenter', moveLens);
    }
    return () => {
      if (banner) {
        banner.removeEventListener('mousemove', moveLens);
        banner.removeEventListener('mouseenter', moveLens);
      }
    };
  }, []);

  return (
    <>
      <StickyNav />

      {/* Hero banner */}
      <header className={`${styles.catHero} cat-hero`}>
        {cmsHero
          ? <img ref={bannerImgRef} src={cmsHero} alt={name} className={`${styles.catHeroBg} cat-hero-bg-img`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className={`${styles.catHeroBg} cat-hero-bg-img`} style={{ background: `linear-gradient(135deg, ${accentVar}, #2b241c)` }} />
        }
        <div className={styles.catHeroScrim} />
        <div className={styles.catHeroContent}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link><span>/</span>
            <Link href="/gems/aquamarine">Gem Categories</Link><span>/</span>
            <span className={styles.current}>{name}</span>
          </div>
          <h1>{name}</h1>
          <p className={styles.catHeroDesc}>{description}</p>
          <div className={styles.facts}>
            <div className={styles.fact}><span className={styles.factLabel}>Species</span><span className={styles.factValue}>{species}</span></div>
            <div className={styles.fact}><span className={styles.factLabel}>Color</span><span className={styles.factValue}>{color}</span></div>
            <div className={styles.fact}><span className={styles.factLabel}>Hardness</span><span className={styles.factValue}>{hardness}</span></div>
            <div className={styles.fact}><span className={styles.factLabel}>Origin</span><span className={styles.factValue}>Africa</span></div>
          </div>
        </div>
      </header>

      {/* Gem category chips */}
      <div className={styles.gemNav}>
        {gemCategories.map(cat => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`${styles.gemChip} ${`/gems/${slug}` === cat.href ? styles.gemChipActive : ''}`}
            style={{ '--chip-color': cat.color } as React.CSSProperties}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Specimens */}
      <section className={styles.specimens}>
        <div className={styles.specHead + ' reveal'}>
          <h2>Available specimens</h2>
          <p>Explore rough gemstone parcels currently available for direct inquiry.</p>
        </div>

        {cmsSpecimens.length > 0 ? (
          <div className={styles.specGrid}>
            {cmsSpecimens.map(s => (
              <div key={s.key ?? `${s.id}-${s.img ?? ''}`} className={`${styles.specCard} specimen-card`}>
                {s.img
                  ? <img src={s.img} alt={s.id} className={styles.specPhotoImg} />
                  : <div className={styles.specPhotoPlaceholder} style={{ background: `linear-gradient(135deg, ${accentVar}44, #2b241c)` }} />
                }
                <div className={styles.specScrim} />
                <span className={styles.specId}>{s.id}</span>
                <div className={styles.specLabel}>
                  <div className={styles.specWeight}>{s.weight || 'Weight on request'}</div>
                  <div className={styles.specDetails}><span>{s.origin}</span><span>{name}</span></div>
                  <Link href="/contact" className={styles.specInquire}>Inquire →</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={`eyebrow dark-eyebrow c-accent`} style={{ color: accentVar, justifyContent: 'center', display: 'inline-flex' }}>
              No Specimens Listed Yet
            </span>
            <p>{emptyMessage || `For current ${name} availability, message us directly and we will help with your request.`}</p>
          </div>
        )}

        <div className={`${styles.catCta} reveal`}>
          <div>
            <h3>Don&apos;t see the size or clarity you need?</h3>
            <p>Message us directly. New rough comes in regularly, and we can flag you when something matching your brief arrives.</p>
          </div>
          <Link href="/contact" className="btn btn-primary">Inquire About {name}</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
