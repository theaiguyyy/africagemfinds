'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StickyNav from '@/components/StickyNav';
import Footer from '@/components/Footer';
import styles from './blog.module.css';

type BlogCard = { slug:string; tag:string; title:string; img:string; date:string; read:string; excerpt?:string };
const fallbackFeatured: BlogCard = { slug:'how-to-evaluate-rough-gemstones', tag:'Education', title:"How to Evaluate Rough Gemstones: A Buyer's Guide", img:'/images/Stone9-129.jpg', date:'Aug 2026', read:'7 min read', excerpt:'What actually separates a good rough stone from an ordinary one, and how to look at color, clarity, and crystal shape before you buy.' };

export default function BlogListPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [visiblePosts, setVisiblePosts] = useState<BlogCard[]>([fallbackFeatured]);

  useEffect(() => {
    let active = true;
    import('@/lib/supabase/config').then(async ({ hasSupabaseConfig }) => {
      if (!hasSupabaseConfig()) return;
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const { data } = await getSupabaseBrowserClient().from('blog_posts').select('*').eq('published', true).order('position');
      if (active && data?.length) setVisiblePosts(data.map((post: Record<string, any>) => ({ slug: post.slug, tag: post.tag, title: post.title, img: post.cover_url || '/images/Stone9-129.jpg', excerpt: post.excerpt, date: post.published_at ? new Date(post.published_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '', read: `${Math.max(1, Math.ceil((post.content?.split(/\s+/).length || 0) / 200))} min read` })));
    });
    return () => { active = false; };
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
            duration: 1.1,
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
      <StickyNav />

      <div className="container">
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link><span>/</span><span className={styles.current}>Blog</span>
        </div>
        <section className={`${styles.head} reveal`}>
          <span className="eyebrow dark-eyebrow c-blue">Journal</span>
          <h1>Notes on African gemstones, sourcing, and the trade.</h1>
          <p>Straightforward writing on rough gemstones, from how to evaluate them to what makes African material distinct. Published from Bangkok, written by the people doing the sourcing.</p>
        </section>
      </div>

      <Link href={`/blog/${visiblePosts[0]?.slug ?? fallbackFeatured.slug}`} className={`${styles.featured} reveal`}>
        <Image src={visiblePosts[0]?.img ?? fallbackFeatured.img} alt={visiblePosts[0]?.title ?? fallbackFeatured.title} fill sizes="100vw" quality={95} preload style={{ objectFit: 'cover' }} />
        <div className={styles.featuredScrim} />
        <div className={styles.featuredCopy}>
          <span className={styles.featuredTag}>{visiblePosts[0]?.tag ?? fallbackFeatured.tag}</span>
          <h2>{visiblePosts[0]?.title ?? fallbackFeatured.title}</h2>
          <p>{visiblePosts[0]?.excerpt ?? fallbackFeatured.excerpt}</p>
          <div className={styles.featuredMeta}><span>{visiblePosts[0]?.date ?? fallbackFeatured.date}</span><span>{visiblePosts[0]?.read ?? fallbackFeatured.read}</span></div>
        </div>
      </Link>

      <div className="container">
        <section className={styles.posts}>
          <div className={`${styles.postsHead} reveal`}>
            <h3>More from the journal</h3>
            <div className={styles.filterRow}><span className={styles.active}>All</span><span>Gem Guides</span><span>Sourcing</span><span>Market</span></div>
          </div>
        </section>
      </div>

      <div className={styles.postGrid}>
        {visiblePosts.slice(1).map((post) => (
          <Link href={`/blog/${post.slug}`} className={styles.postCard} key={post.slug}>
            <Image src={post.img} alt={post.title} fill sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" quality={95} loading="lazy" />
            <div className={styles.postScrim} />
            <div className={styles.postLabel}>
              <span className={styles.postTag}>{post.tag}</span>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postMeta}><span>{post.date}</span><span>{post.read}</span></div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.ctaBand}>
        <div className={`${styles.catCta} reveal`}>
          <div>
            <h3>Want to know when new listings drop?</h3>
            <p>Follow us on WhatsApp or Instagram for newly available rough gemstones.</p>
          </div>
          <Link href="/contact" className="btn btn-primary">Get In Touch</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
