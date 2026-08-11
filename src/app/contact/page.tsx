'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StickyNav from '@/components/StickyNav';
import Footer from '@/components/Footer';
import styles from './contact.module.css';

const SOCIAL = [
  { label: 'WhatsApp', href: 'https://wa.me/66617472342', icon: 'whatsapp' },
  { label: 'Instagram', href: 'https://instagram.com/african_gem_finds', icon: 'instagram' },
  { label: 'Email', href: 'mailto:africagemfinds@gmail.com', icon: 'email' },
];

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', category: '', message: '' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // §6.13 Contact form fields cascade — handled by CSS animation in contact.module.css

      gsap.utils.toArray('.reveal').forEach((el: any) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
    };

    init();

    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, gemstone: form.category }) });
      if (!response.ok) throw new Error('Submission failed');

      setStatus('sent');
      setForm({ name: '', email: '', category: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <StickyNav />

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link><span>/</span><span>Contact</span>
          </div>
          <h1>Let&apos;s talk <span className={styles.accent}>stones.</span></h1>
          <p>Everything on this site is for browsing. If something catches your eye, or you have a specific brief, reach out directly and we&apos;ll take it from there.</p>
        </div>
      </header>

      {/* MAIN GRID */}
      <section className={styles.main}>
        <div className={`container ${styles.grid}`}>

          {/* FORM */}
          <div className={styles.formCol}>
            <span className="eyebrow dark-eyebrow c-blue">Send a Message</span>
            <h2 className={styles.formTitle}>Tell us what you&apos;re after.</h2>

            {status === 'sent' ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h3>Message received.</h3>
                <p>We&apos;ll get back to you directly, usually within a day or two. If it&apos;s urgent, WhatsApp is faster.</p>
                <button className={`btn btn-outline`} onClick={() => setStatus('idle')}>Send another message</button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={`${styles.fieldWrap} field-cascade`}>
                  <label htmlFor="name">Your Name</label>
                  <input id="name" name="name" type="text" placeholder="Full name" required value={form.name} onChange={handleChange} />
                </div>
                <div className={`${styles.fieldWrap} field-cascade`}>
                  <label htmlFor="email">Email Address</label>
                  <input id="email" name="email" type="email" placeholder="you@example.com" required value={form.email} onChange={handleChange} />
                </div>
                <div className={`${styles.fieldWrap} field-cascade`}>
                  <label htmlFor="category">Gem Category (optional)</label>
                  <select id="category" name="category" value={form.category} onChange={handleChange}>
                    <option value="">Select a category...</option>
                    <option value="aquamarine">Aquamarine</option>
                    <option value="tourmaline">Tourmaline</option>
                    <option value="rubylite">Rubylite</option>
                    <option value="morganite">Morganite</option>
                    <option value="spessartite-garnet">Spessartite Garnet</option>
                    <option value="beryl">Beryl</option>
                    <option value="other">Other / General Inquiry</option>
                  </select>
                </div>
                <div className={`${styles.fieldWrap} field-cascade`}>
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows={5} placeholder="Tell us what you're looking for, any size or quality requirements, or just say hello." required value={form.message} onChange={handleChange} />
                </div>
                <div className={`${styles.fieldWrap} field-cascade`}>
                  <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>
                  {status === 'error' && <p className={styles.errorMsg}>Something went wrong. Try WhatsApp instead.</p>}
                </div>
              </form>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={`${styles.contactCard} reveal`}>
              <span className="eyebrow dark-eyebrow c-blue">Direct Contact</span>
              <h3>Prefer to reach out directly?</h3>
              <p>WhatsApp is the fastest way to get a response, especially for time-sensitive inquiries.</p>
              <div className={styles.socialLinks}>
                {SOCIAL.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    <SocialIcon icon={s.icon} />
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className={`${styles.contactCard} reveal`}>
              <span className="eyebrow dark-eyebrow c-green">Location</span>
              <h3>Visit Us</h3>
              <address className={styles.address}>
                101 Saphan Yao Alley<br />
                Bang Rak<br />
                Bangkok 10500<br />
                Thailand
              </address>
              <a
                href="https://maps.google.com/?q=101+Saphan+Yao+Alley+Bang+Rak+Bangkok"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                Open in Google Maps →
              </a>
            </div>

            <div className={`${styles.contactCard} ${styles.emailCard} reveal`}>
              <span className="eyebrow dark-eyebrow c-ruby">Email</span>
              <a href="mailto:africagemfinds@gmail.com" className={styles.emailLink}>
                africagemfinds@gmail.com
              </a>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </>
  );
}

function SocialIcon({ icon }: { icon: string }) {
  if (icon === 'whatsapp') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
  if (icon === 'instagram') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
