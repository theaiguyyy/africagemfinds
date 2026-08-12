'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './HomePage.module.css';

const heroStops = [
  { label: 'Aquamarine', img: '/images/Stone16-218.jpg' },
  { label: 'Aquamarine', img: '/images/Stone8-114.jpg' },
  { label: 'Tourmaline', img: '/images/Stone22-290.jpg' },
  { label: 'Indicolite Tourmaline', img: '/images/Stone11-149.jpg' },
  { label: 'Aquamarine', img: '/images/Stone10-137.jpg' },
  { label: 'Indicolite Tourmaline', img: '/images/Stone29-420.jpg' },
  { label: 'Rubylite', img: '/images/Stone31-446.jpg' },
  { label: 'Tourmaline', img: '/images/Stone30-424.jpg' },
];

const categories = [
  { name: 'Aquamarine', color: 'var(--blue)', href: '/gems/aquamarine', img: '/images/Stone2-040.jpg' },
  { name: 'Tourmaline', color: 'var(--green)', href: '/gems/tourmaline', img: '/images/Stone4-068.jpg' },
  { name: 'Rubylite', color: 'var(--ruby)', href: '/gems/rubylite', img: '/images/Stone3-054.jpg' },
  { name: 'Morganite', color: 'var(--blush)', href: '/gems/morganite', img: '/images/Stone7-105.jpg' },
  { name: 'Spessartite Garnet', color: 'var(--amber)', href: '/gems/spessartite-garnet', empty: true },
  { name: 'Beryl', color: 'var(--teal)', href: '/gems/beryl', img: '/images/Stone13-175.jpg' },
];

export default function HomePage() {
  const [categoryCards, setCategoryCards] = useState(categories);
  const currentRef = useRef(0);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const heroTagRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trustVisualRef = useRef<HTMLDivElement>(null);
  const trustLensRef = useRef<HTMLDivElement>(null);
  const trustImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let active = true;
    import('@/lib/supabase/config').then(async ({ hasSupabaseConfig }) => {
      if (!hasSupabaseConfig()) return;
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const { data } = await getSupabaseBrowserClient().from('media').select('category,url').eq('featured', true);
      if (!active || !data) return;
      setCategoryCards(current => current.map(card => {
        const cover = data.find((item: { category: string; url: string }) => item.category === card.name);
        return cover ? { ...card, img: cover.url, empty: false } : card;
      }));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let gsap: any, ScrollTrigger: any;

    const init = async () => {
      const gsapMod = await import('gsap');
      const stMod = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap = gsapMod.gsap;
      ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // §6.1 Hero cinematic enter — handled by CSS animations in HomePage.module.css

      // §6.3 Nav scroll shrink
      const nav = document.getElementById('nav');
      if (nav) {
        window.addEventListener('scroll', () => {
          const scrolled = window.scrollY > 60;
          gsap.to('#nav', {
            paddingTop: scrolled ? '10px' : '28px',
            paddingBottom: scrolled ? '10px' : '28px',
            duration: 0.4,
            ease: 'power2.out',
          });
        }, { passive: true });
      }

      // §6.4 Category grid stagger
      const gemCards = gsap.utils.toArray('.cat-card');
      gemCards.forEach((card: any, i: number) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: i * 0.08, scrollTrigger: { trigger: card, start: 'top 88%' } }
        );
      });

      // §6.5 Mission parallax
      gsap.to('.mission-bg', {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '.mission-band', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      // §6.6 Story parallax
      gsap.to('.story-bg', {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.story-bleed', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      // §6.10 CTA band reveal
      gsap.timeline({ scrollTrigger: { trigger: '.contact-band', start: 'top 80%' } })
        .from('.contact-band h2', { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out' });

      // Base reveal
      gsap.utils.toArray('.reveal').forEach((el: any) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
    };

    init();

    // Hero slideshow
    function goTo(next: number) {
      const prev = currentRef.current;
      slidesRef.current[prev]?.classList.remove(styles.active);
      slidesRef.current[next]?.classList.add(styles.active);
      dotsRef.current.forEach(d => d?.classList.remove(styles.dotActive));
      dotsRef.current[next]?.classList.add(styles.dotActive);
      if (heroTagRef.current) {
        heroTagRef.current.textContent = heroStops[next].label + ' · Bangkok';
      }
      currentRef.current = next;
    }

    intervalRef.current = setInterval(() => {
      goTo((currentRef.current + 1) % heroStops.length);
    }, 5000);

    // Trust loupe (§6.9 — plain JS, do not GSAP)
    const lensSize = 170;
    const zoom = 2.2;
    function moveLens(e: MouseEvent) {
      const visual = trustVisualRef.current;
      const lens = trustLensRef.current;
      const img = trustImgRef.current;
      if (!visual || !lens || !img) return;
      const rect = visual.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const relY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      lens.style.left = (relX - lensSize / 2) + 'px';
      lens.style.top = (relY - lensSize / 2) + 'px';
      lens.style.backgroundImage = `url(${img.src})`;
      lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
      lens.style.backgroundPosition = `${-relX * zoom + lensSize / 2}px ${-relY * zoom + lensSize / 2}px`;
    }
    const visual = trustVisualRef.current;
    if (visual) {
      visual.addEventListener('mousemove', moveLens);
      visual.addEventListener('mouseenter', moveLens);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (visual) {
        visual.removeEventListener('mousemove', moveLens);
        visual.removeEventListener('mouseenter', moveLens);
      }
    };
  }, []);

  const handleDotClick = (i: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const slides = slidesRef.current;
    const dots = dotsRef.current;
    const prev = currentRef.current;
    slides[prev]?.classList.remove(styles.active);
    slides[i]?.classList.add(styles.active);
    dots.forEach(d => d?.classList.remove(styles.dotActive));
    dots[i]?.classList.add(styles.dotActive);
    if (heroTagRef.current) heroTagRef.current.textContent = heroStops[i].label + ' · Bangkok';
    currentRef.current = i;
    intervalRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % heroStops.length;
      slides[currentRef.current]?.classList.remove(styles.active);
      slides[next]?.classList.add(styles.active);
      dots.forEach(d => d?.classList.remove(styles.dotActive));
      dots[next]?.classList.add(styles.dotActive);
      if (heroTagRef.current) heroTagRef.current.textContent = heroStops[next].label + ' · Bangkok';
      currentRef.current = next;
    }, 5000);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector<HTMLButtonElement>('#contactSubmitBtn');
    const status = document.getElementById('contactFormStatus');
    const data = new FormData(form);
    const inquiry = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      gemstone: data.get('gemstone'),
      message: data.get('message'),
      source: 'website-contact-form',
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry),
      });
      if (!response.ok) throw new Error('Submission failed');
    } catch {
      if (status) { status.style.display = 'block'; status.textContent = 'We could not send your inquiry. Please try again.'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Send Inquiry'; }
      return;
    }

    form.reset();
    if (btn) { btn.disabled = false; btn.textContent = 'Send Inquiry'; }
    if (status) { status.style.display = 'block'; status.textContent = "Thanks — we've received your inquiry and will reach out directly."; }
  };

  return (
    <>
      {/* HERO */}
      <header className={styles.hero} id="hero">
        <div id="heroSlides">
          {heroStops.map((s, i) => (
            <div
              key={i}
              className={`${styles.heroSlide} ${i === 0 ? styles.active : ''}`}
              ref={el => { if (el) slidesRef.current[i] = el; }}
            >
              <img src={s.img} alt={s.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
        <div className={styles.heroScrim} />
        <div className={styles.heroContent}>
          <div className="hero-eyebrow">
            <span ref={heroTagRef} id="heroTag">Aquamarine · Bangkok</span>
          </div>
          <h1 className={`${styles.heroTitle} hero-headline`}>
            <span className="line"><span>African gemstones,</span></span>
            <span className="line"><span><em>straight from source.</em></span></span>
          </h1>
          <p className={`${styles.heroSub} hero-sub`}>
            <span>Rough stones from across Africa, personally inspected by the family that has traded them for three generations.</span>
          </p>
          <div className={styles.heroActions}>
            <div className={`${styles.heroActionsInner} hero-actions`} id="heroActions">
              <Link href="/gems/aquamarine" className="btn btn-primary">View the Collection</Link>
              <Link href="/contact" className="btn btn-ghost">Inquire Direct</Link>
            </div>
          </div>
        </div>
        <div className={styles.heroDots} id="heroDots">
          {heroStops.map((s, i) => (
            <div
              key={i}
              className={`${styles.heroDot} ${i === 0 ? styles.dotActive : ''}`}
              ref={el => { if (el) dotsRef.current[i] = el; }}
              onClick={() => handleDotClick(i)}
            >
              <span className={styles.bar} />
              <span className={styles.lbl}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.heroScroll}>
          <div className={styles.heroScrollLine} />
        </div>
      </header>

      {/* MISSION */}
      <section className={`${styles.missionBleed} reveal mission-band`}>
        <div className={`${styles.missionBg} mission-bg`} style={{ backgroundImage: "url('/images/Stone10-139.jpg')" }} />
        <div className={styles.missionScrim} />
        <div className={styles.missionInner}>
          <div className={styles.missionMark}>&ldquo;</div>
          <p className={styles.missionVisionText}>
            A trusted bridge between <span className={styles.accent}>Africa&apos;s gemstone-rich regions</span> and a global community of buyers, sharing the beauty, origin, and craft of African gemstones with collectors and trade buyers everywhere.
          </p>
          <div className={styles.missionDivider}>
            <span style={{ background: 'var(--blue)' }} />
            <span style={{ background: 'var(--green)' }} />
            <span style={{ background: 'var(--ruby)' }} />
            <span style={{ background: 'var(--blush)' }} />
            <span style={{ background: 'var(--amber)' }} />
            <span style={{ background: 'var(--teal)' }} />
          </div>
          <p className={styles.missionBody}>
            Africa Gem Finds sources rough gemstones directly from across the continent, sharing the story and origin behind every stone we sell, and building honest, transparent relationships with the buyers and communities we work with.
          </p>
          <div className={styles.missionTags}>
            {[
              { dot: 'var(--blue)', label: 'Direct-Sourced' },
              { dot: 'var(--green)', label: 'Family-Owned' },
              { dot: 'var(--ruby)', label: 'Three Generations' },
              { dot: 'var(--teal)', label: 'Africa → Bangkok' },
            ].map(t => (
              <span key={t.label} className={styles.mTag}>
                <span className={styles.gemDot} style={{ background: t.dot }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className={styles.categories} id="categories">
        <div className={`${styles.catHead} reveal`}>
          <h2>Six gemstone varieties, sourced across the continent and inspected by hand.</h2>
          <p>Every tile links through to full listings, with sizes and weights for each stone.</p>
        </div>
        <div className={styles.catGrid}>
          {categoryCards.map((c) => (
            <Link key={c.name} href={c.href} className={`${styles.catCard} cat-card`}>
              {c.empty
                ? <div className={styles.catEmpty} style={{ background: `linear-gradient(135deg, ${c.color}, #2b241c)` }} />
                : <img src={c.img!} alt={c.name} className={styles.catImg} />
              }
              <div className={styles.catScrim} />
              <div className={styles.catLabel}>
                <span className={styles.catChip} style={{ color: c.color }}>Gem Category</span>
                <div className={styles.catName}>
                  {c.name}<span className={styles.arrow}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST / LOUPE */}
      <section className={styles.trust}>
        <div className={styles.trustGrid}>
          <div className={`${styles.trustVisual} reveal`} ref={trustVisualRef} id="trustVisual">
            <img
              ref={trustImgRef}
              src="/images/Stone34-559.jpg"
              alt="Africa Gem Finds team inspecting rough aquamarine"
              id="trustImg"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.trustLens} ref={trustLensRef} id="trustLens" />
            <div className={styles.trustHint}>Hover to inspect</div>
          </div>
          <div className={`${styles.trustCopy} reveal`}>
            <span className="eyebrow dark-eyebrow c-green">Authentication &amp; Trust</span>
            <h2>Personally inspected, stone by stone.</h2>
            <p>Every stone shown on this site is personally inspected by us before it&apos;s listed, checked for natural origin, consistency, and quality using the same hands-on evaluation our family has relied on for years. We don&apos;t currently issue formal lab certificates, but every piece is genuinely assessed, not passed along unchecked. If a stone doesn&apos;t meet our standard, it doesn&apos;t go up.</p>
            <div className={styles.tradeTags}>
              {[
                { code: 'Lot A · Inspection', codeColor: 'var(--green)', title: 'Personally Inspected', desc: 'Every piece is examined by hand before it\'s ever listed.', rot: '-1.6deg' },
                { code: 'Lot B · Sourcing', codeColor: 'var(--blue)', title: 'Direct From Source', desc: 'Sourced across Africa through our own network, not resold through intermediaries.', rot: '1.1deg' },
                { code: 'Lot C · Legacy', codeColor: 'var(--ruby)', title: 'Family Legacy', desc: 'Knowledge passed down through three generations of gemstone trading.', rot: '-0.8deg' },
              ].map((tag, i) => (
                <div key={i} className={styles.tagCard} style={{ '--rot': tag.rot } as React.CSSProperties}>
                  <span className={styles.tagHole} />
                  <span className={styles.tagCode} style={{ color: tag.codeColor }}>{tag.code}</span>
                  <div className={styles.tagTitle}>{tag.title}</div>
                  <div className={styles.tagDesc}>{tag.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className={`${styles.storyBleed} reveal story-bleed`} id="story">
        <div className={`${styles.storyBg} story-bg`} style={{ backgroundImage: "url('/images/Stone34-619.jpg')" }} />
        <div className={styles.storyScrim} />
        <div className={styles.storyInner}>
          <span className="eyebrow" style={{ color: '#EFE6D2' }}>Our Story</span>
          <p className={styles.storyQuote}>&ldquo;What we noticed is that this knowledge rarely left the room it was learned in. Africa Gem Finds exists to change that.&rdquo;</p>
          <span className={styles.storyAttr}>Africa Gem Finds, Founders</span>
          <Link href="/about" className={styles.storyLink}>Read the full story →</Link>
        </div>
      </section>

      {/* CONTACT */}
      <section className={`${styles.contact} contact-band`} id="contact">
        <div className={styles.contactVisual}>
          <img src="/images/Stone15-205.jpg" alt="Morganite rough gemstones" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className={styles.contactTag}>Morganite, Africa</div>
        </div>
        <div className={styles.contactFormWrap}>
          <span className="eyebrow dark-eyebrow c-blue">Get In Touch</span>
          <h2 style={{ marginTop: '16px' }}>Everything here is for viewing. To buy, you talk to us directly.</h2>
          <p>Message us and we&apos;ll walk through details, pricing, and shipping person to person, same as it&apos;s always been done.</p>
          <p style={{ marginTop: '14px', color: 'var(--ink-soft)', fontSize: '14.5px' }}>
            101, 101/1 99 Saphan Yao Alley, Si Phraya, Bang Rak, Bangkok 10500 ·{' '}
            <a href="mailto:africagemfinds@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>africagemfinds@gmail.com</a>
          </p>
          <div className={styles.connectIcons}>
            {[
              { href: 'https://wa.me/66617472342', hover: 'var(--green)', label: 'WhatsApp', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.1 2.6 5.5L5 21l4.4-1.8c.8.2 1.7.3 2.6.3 5 0 9-3.6 9-8S17 3 12 3Z"/><path d="M9 10.3c0 3 2.4 5.3 5.3 5.3l.6-1.3-1.9-.9-.7.7c-1-.6-1.7-1.3-2.3-2.3l.7-.7-.9-1.9L9 10.3Z" fill="currentColor" stroke="none"/></svg> },
              { href: 'https://www.instagram.com/african_gem_finds', hover: 'var(--blush)', label: 'Instagram', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" stroke="none"/></svg> },
              { href: 'https://line.me/ti/p/~66617472342', hover: 'var(--teal)', label: 'LINE', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.1 2.6 5.5L5 21l4.4-1.8c.8.2 1.7.3 2.6.3 5 0 9-3.6 9-8S17 3 12 3Z"/><circle cx="8.6" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="11" r="1" fill="currentColor" stroke="none"/></svg> },
              { href: 'mailto:africagemfinds@gmail.com', hover: 'var(--amber)', label: 'Email', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg> },
            ].map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={styles.connectIcon} style={{ '--hover': c.hover } as React.CSSProperties} aria-label={c.label}>
                {c.icon}
                <span className={styles.tip}>{c.label}</span>
              </a>
            ))}
          </div>
          <form className={styles.contactForm} id="contactForm" onSubmit={handleContactSubmit}>
            <div className={styles.field}><input type="text" name="name" placeholder=" " required /><label>Full name</label></div>
            <div className={styles.field}><input type="email" name="email" placeholder=" " required /><label>Email address</label></div>
            <div className={styles.field}><input type="tel" name="phone" placeholder=" " required /><label>Phone number</label></div>
            <div className={styles.field}><input type="text" name="gemstone" placeholder=" " required /><label>Which gemstone are you interested in?</label></div>
            <div className={styles.field}><textarea name="message" placeholder=" " required /><label>Tell us what you&apos;re looking for</label></div>
            <button type="submit" className="btn btn-primary" id="contactSubmitBtn">Send Inquiry</button>
            <p id="contactFormStatus" style={{ marginTop: '14px', fontSize: '13.5px', color: 'var(--ink-soft)', display: 'none' }} />
          </form>
        </div>
      </section>
    </>
  );
}
