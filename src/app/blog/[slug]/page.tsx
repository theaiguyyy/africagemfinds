'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import StickyNav from '@/components/StickyNav';
import Footer from '@/components/Footer';
import styles from './post.module.css';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const pageRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [cmsPost, setCmsPost] = useState<{ title:string; tag:string; content:string; cover_url:string; published_at:string | null } | null>(null);

  useEffect(() => {
    let active = true;
    import('@/lib/supabase/config').then(async ({ hasSupabaseConfig }) => {
      if (!hasSupabaseConfig()) return;
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const { data } = await getSupabaseBrowserClient().from('blog_posts').select('title,tag,content,cover_url,published_at').eq('slug', params.slug).eq('published', true).maybeSingle();
      if (active && data) setCmsPost(data);
    });
    return () => { active = false; };
  }, [params.slug]);

  useEffect(() => {
    function updateProgress() {
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const distance = article.offsetHeight - window.innerHeight;
      setProgress(distance > 0 ? Math.max(0, Math.min(1, -rect.top / distance)) : 0);
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let context: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled || !pageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          });
        });
      }, pageRef);
    }

    init();
    return () => {
      cancelled = true;
      context?.revert();
    };
  }, []);

  return (
    <div ref={pageRef}>
      <div className={styles.progressBar} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <StickyNav />

      <div className="container">
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span className={styles.current}>{cmsPost?.title ?? 'How to Evaluate Rough Gemstones'}</span>
        </div>

        <section className={`${styles.artHead} ${styles.narrow} reveal`}>
          <span className="eyebrow dark-eyebrow c-blue">{cmsPost?.tag ?? 'Education'}</span>
          <h1>{cmsPost?.title ?? <>How to Evaluate Rough Gemstones: A Buyer&apos;s Guide</>}</h1>
          <div className={styles.artMeta}><span>African Gem Finds</span><span>{cmsPost?.published_at ? new Date(cmsPost.published_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'Aug 2026'}</span><span>{cmsPost ? `${Math.max(1, Math.ceil(cmsPost.content.split(/\s+/).length / 200))} min read` : '7 min read'}</span></div>
        </section>
      </div>

      <div className={`${styles.artHero} reveal`}>
        <Image src={cmsPost?.cover_url || '/images/Stone34-536.jpg'} alt={cmsPost?.title || 'Gemologist inspecting rough aquamarine under a loupe'} fill sizes="100vw" priority />
      </div>

      <div className="container">
        <article ref={articleRef} className={`${styles.artBody} ${styles.narrow} reveal`}>
          {cmsPost ? cmsPost.content.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <>
          <p>Most people who message us about rough gemstones for the first time ask some version of the same question: how do you actually know if a stone is good? There&apos;s no shortcut that replaces years in the trade, but there are a handful of things worth learning to look at, whether you&apos;re buying your first specimen or sourcing a parcel for resale.</p>

          <h2><span className={styles.num}>01</span>Color</h2>
          <p>Color is usually the first thing anyone notices, and it&apos;s still the biggest driver of value in most gemstone varieties. Look at saturation and tone rather than just hue. A stone with rich, even color reads as more valuable than one that&apos;s pale or patchy, even within the same species. Hold the stone in natural daylight rather than under artificial light, since color can shift noticeably between the two.</p>

          <h2><span className={styles.num}>02</span>Clarity &amp; Inclusions</h2>
          <p>Rough stones almost always carry some internal characteristics, called inclusions. That&apos;s normal and doesn&apos;t automatically mean a stone is low quality. What matters is whether the inclusions are visible to the naked eye and whether they sit somewhere that will affect the finished piece once it&apos;s cut. A loupe (typically 10x magnification) is the standard tool for this.</p>

          <ul>
            <li>Eye clean: no visible inclusions without magnification</li>
            <li>Lightly included: minor inclusions, generally not obvious at a glance</li>
            <li>Included: visible inclusions that may affect durability or cutting yield</li>
          </ul>

          <div className={styles.pull}>&ldquo;The sourcing, the grading, what separates a good stone from an ordinary one, that knowledge didn&apos;t come from a course or a catalog. It came from years inside the trade itself.&rdquo;</div>

          <h2><span className={styles.num}>03</span>Crystal Shape &amp; Yield</h2>
          <p>For anyone buying rough with cutting in mind, shape matters as much as color or clarity. A well-formed crystal with clean, even faces will generally yield more finished carat weight than a fractured or oddly shaped piece of the same rough weight.</p>

          <figure className={styles.inlinePhoto}>
            <Image src="/images/Stone2-040.jpg" alt="Rough aquamarine crystals" width={1600} height={1000} sizes="(max-width: 900px) 100vw, 760px" />
            <figcaption>Aquamarine rough showing typical elongated crystal habit</figcaption>
          </figure>

          <h2><span className={styles.num}>04</span>Weight &amp; Scale</h2>
          <p>Rough gemstones are typically weighed and sold in carats, same as cut stones, though rough material is priced differently since a portion of the weight is lost during cutting. When you&apos;re comparing two parcels, weight alone doesn&apos;t tell you much without also factoring in color, clarity, and expected yield.</p>

          <h2><span className={styles.num}>05</span>Trust Your Source</h2>
          <p>All of the above matters less if you can&apos;t trust who you&apos;re buying from. Ask where the material was sourced, whether it&apos;s been personally inspected, and how the seller grades what they sell.</p>
          </>}
        </article>
      </div>

      <div className="container">
        <div className={`${styles.artCta} ${styles.narrow}`}>
          <h3>Have a specific stone in mind?</h3>
          <p>Browse our current categories, or message us directly and we&apos;ll help you find what you&apos;re after.</p>
          <Link href="/contact" className="btn btn-primary">Get In Touch</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
