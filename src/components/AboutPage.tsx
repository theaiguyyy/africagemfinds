'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  const pageRef = useRef<HTMLElement>(null);
  const processPathRef = useRef<HTMLDivElement>(null);
  const storyFrameRef = useRef<HTMLDivElement>(null);
  const storyLensRef = useRef<HTMLDivElement>(null);
  const storyImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
        });

        // A restrained light courier follows the buying path and energises each stage.
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1001px)', () => {
          const path = processPathRef.current;
          if (!path) return;
          const pulse = path.querySelector<HTMLElement>('.process-pulse');
          const rail = path.querySelector<HTMLElement>('.process-rail');
          const nodes = path.querySelectorAll<HTMLElement>('.process-node');
          if (!pulse || !rail || !nodes.length) return;

          const travel = () => Math.max(0, path.clientWidth - 33);
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: path, start: 'top 78%', once: true },
          });
          timeline
            .fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: 'power2.inOut' })
            .fromTo(pulse,
              { x: 0, autoAlpha: 0, scale: 0.65 },
              { x: travel, autoAlpha: 1, scale: 1, duration: 2.25, ease: 'power1.inOut' },
              '-=0.55',
            )
            .fromTo(nodes,
              { boxShadow: '0 0 0 rgba(255,255,255,0)' },
              { boxShadow: '0 0 0 8px rgba(30,111,160,.12)', duration: 0.24, stagger: 0.55, yoyo: true, repeat: 1 },
              '<',
            )
            .to(pulse, { autoAlpha: 0, duration: 0.3 });
        });
      }, pageRef);

      return () => context.revert();
    };

    let disposeAnimations: (() => void) | undefined;
    init().then(dispose => { disposeAnimations = dispose; });

    // Story loupe
    const lensSize = 170, zoom = 2.2;
    function moveLens(e: MouseEvent) {
      const frame = storyFrameRef.current;
      const lens = storyLensRef.current;
      const img = storyImgRef.current;
      if (!frame || !lens || !img) return;
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const relY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      lens.style.left = (relX - lensSize / 2) + 'px';
      lens.style.top = (relY - lensSize / 2) + 'px';
      lens.style.backgroundImage = `url(${img.src})`;
      lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
      lens.style.backgroundPosition = `${-relX * zoom + lensSize / 2}px ${-relY * zoom + lensSize / 2}px`;
    }
    const frame = storyFrameRef.current;
    if (frame) {
      frame.addEventListener('mousemove', moveLens);
      frame.addEventListener('mouseenter', moveLens);
    }
    return () => {
      cancelled = true;
      disposeAnimations?.();
      if (frame) {
        frame.removeEventListener('mousemove', moveLens);
        frame.removeEventListener('mouseenter', moveLens);
      }
    };
  }, []);

  return (
    <main ref={pageRef}>
      {/* HERO */}
      <header className={styles.hero}>
        <img
          src="/images/Stone34-621.jpg"
          alt="Founders of African Gem Finds"
          className={`${styles.heroImg} about-photo`}
        />
        <div className={styles.heroScrim} />
        <div className={styles.heroContent}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link><span>/</span><span>About</span>
          </div>
          <h1>This trade runs <span className={styles.accent}>in our family.</span></h1>
          <p>Long before this website existed, our fathers were already in it, sourcing rough gemstones and selling them the way it&apos;s always been done: directly, person to person.</p>
        </div>
      </header>

      {/* STORY */}
      <section className={styles.story}>
        <div className={`container ${styles.storyGrid}`}>
          <div className={`${styles.storyFrame} reveal`} ref={storyFrameRef}>
            <img
              ref={storyImgRef}
              src="/images/Stone34-536.jpg"
              alt="Founder inspecting rough aquamarine"
              className={styles.storyFrameImg}
            />
            <div className={styles.storyLens} ref={storyLensRef} />
            <div className={styles.storyHint}>Hover to inspect</div>
          </div>
          <div className={`${styles.storyCopy} reveal`}>
            <span className="eyebrow dark-eyebrow c-blue">How It Started</span>
            <h2>We grew up watching that world, and we learned it.</h2>
            <p>The sourcing, the grading, what separates a good stone from an ordinary one, that knowledge didn&apos;t come from a course or a catalog. It came from years inside the trade itself.</p>
            <p>What we noticed is that this knowledge rarely left the room it was learned in. African Gem Finds exists to change that, so anyone, anywhere, can find their way to that conversation.</p>
          </div>
        </div>
      </section>

      {/* SPLIT — WHAT WE SELL / BROWSE THEN ASK */}
      <section className={styles.split}>
        <div className={`container ${styles.splitGrid}`}>
          <div className={`${styles.splitCard} reveal`}>
            <div className={styles.splitMark} style={{ color: 'var(--blue)' }}>01</div>
            <span className="eyebrow dark-eyebrow c-blue">What We Sell</span>
            <h3>Rough, unprocessed gemstones. Nothing cut, nothing altered.</h3>
            <p>We deal exclusively in rough gemstones sourced from across Africa. Every piece shown on this site is sold as-is, in its natural state, whether you&apos;re buying for cutting, collecting, or wholesale resale.</p>
          </div>
          <div className={`${styles.splitRule} reveal`} />
          <div className={`${styles.splitCard} reveal`}>
            <div className={styles.splitMark} style={{ color: 'var(--ruby)' }}>02</div>
            <span className="eyebrow dark-eyebrow c-ruby">Browse, Then Ask</span>
            <h3>Everything here is for viewing. Buying happens person to person.</h3>
            <p>We don&apos;t process purchases through the website. If something catches your eye, message us directly and we&apos;ll talk through the details, answer your questions, and handle the sale and shipping directly with you.</p>
          </div>
        </div>
      </section>

      {/* AUTHENTICATION — full bleed */}
      <section className={styles.authBleed}>
        <div className={styles.authBg} style={{ backgroundImage: "url('/images/Stone34-592.jpg')" }} />
        <div className={styles.authScrim} />
        <div className={styles.authInner}>
          <span className="eyebrow" style={{ color: '#EFE6D2' }}>Authentication &amp; Quality</span>
          <h2>Personally inspected, not passed along unchecked.</h2>
          <p>We&apos;re not a marketplace listing stones we&apos;ve never seen. We come from a family already inside this trade, which means direct sourcing, fair pricing, and a real understanding of what we&apos;re selling.</p>
          <div className={styles.authTags}>
            {[
              { code: 'Lot A · Sourcing', codeColor: 'var(--blue)', title: 'Direct Sourcing', desc: 'Sourced across Africa through our own network, not resold through intermediaries.', rot: '-1.4deg' },
              { code: 'Lot B · Inspection', codeColor: 'var(--green)', title: 'Hands-On Inspection', desc: 'Every stone is checked for natural origin, consistency, and quality before it\'s listed.', rot: '1deg' },
              { code: 'Lot C · Pricing', codeColor: 'var(--ruby)', title: 'Fair, Direct Pricing', desc: 'You\'re talking to the people who sourced and inspected the stone, not a storefront.', rot: '-0.7deg' },
            ].map((tag, i) => (
              <div key={i} className={styles.ptag} style={{ '--rot': tag.rot } as React.CSSProperties}>
                <span className={styles.ptagHole} />
                <span className={styles.ptagCode} style={{ color: tag.codeColor }}>{tag.code}</span>
                <div className={styles.ptagTitle}>{tag.title}</div>
                <div className={styles.ptagDesc}>{tag.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className={styles.process}>
        <div className="container">
          <div className={`${styles.processHead} reveal`}>
            <span className="eyebrow dark-eyebrow c-blue" style={{ justifyContent: 'center' }}>How Buying Works</span>
            <h2>Four steps, same as it&apos;s always been done.</h2>
            <p>Everything here is for viewing only. To actually buy, you deal with us directly.</p>
          </div>
          <div className={`${styles.path} reveal`} ref={processPathRef}>
            <span className={`${styles.pathRail} process-rail`} aria-hidden="true" />
            <span className={`${styles.pathPulse} process-pulse`} aria-hidden="true"><i /></span>
            {[
              { num: '01', color: 'var(--blue)', title: 'Browse', desc: 'Look through categories and specimens to find stones that match what you need.' },
              { num: '02', color: 'var(--green)', title: 'Message Us', desc: 'Reach out via WhatsApp, LINE, or social media about a specific stone or a general brief.' },
              { num: '03', color: 'var(--ruby)', title: 'Talk It Through', desc: 'We answer your questions and confirm details, pricing, and availability directly with you.' },
              { num: '04', color: 'var(--teal)', title: 'Buy & Ship', desc: 'We handle the sale and shipping directly, person to person, same as always.' },
            ].map(step => (
              <div key={step.num} className={styles.pathStep}>
                <div className={`${styles.pathNode} process-node`} style={{ background: step.color }}>{step.num}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVE BLEED */}
      <section className={styles.serveBleed}>
        <div className={styles.serveBg} style={{ backgroundImage: "url('/images/Stone34-630.jpg')" }} />
        <div className={styles.serveScrim} />
        <div className={`${styles.serveInner} reveal`}>
          <span className="eyebrow" style={{ color: '#EFE6D2', justifyContent: 'center' }}>Who We Serve</span>
          <h2>From first-time collectors to wholesale buyers.</h2>
          <p>From first-time collectors curious about rough stones, to jewellers and cutters who need consistent wholesale supply, we work with anyone who wants real, direct access to African rough gemstones.</p>
        </div>
      </section>

      {/* TRUST QUOTE */}
      <section className={styles.trustQuote}>
        <div className={`container reveal`}>
          <div className={styles.tqMark}>&ldquo;</div>
          <p className={styles.tqText}>We&apos;d rather under-promise and over-deliver than oversell a stone. If we&apos;re not sure about something, we&apos;ll tell you.</p>
          <div className={styles.tqAttr}>Trust &amp; Transparency, African Gem Finds</div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 110px' }}>
        <div className="container">
          <div className={`${styles.catCta} reveal`}>
            <div>
              <h3>Ready to see what&apos;s available?</h3>
              <p>Browse our current gem categories, or message us directly if you already know what you&apos;re after.</p>
            </div>
            <Link href="/gems/aquamarine" className="btn btn-primary">Browse Gem Categories</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
