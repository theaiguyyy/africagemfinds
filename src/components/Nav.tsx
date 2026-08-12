'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

export default function Nav({ transparent = false }: { transparent?: boolean }) {
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!transparent) return;
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle(styles.scrolled, window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      ref={navRef}
      className={`${styles.nav} ${!transparent ? styles.scrolled : ''}`}
      id="nav"
    >
      <Link href="/" className={styles.navLogo}>
        <img src="/africa-gem-finds-logo-transparent.png" alt="Africa Gem Finds" />
      </Link>
      <ul className={styles.navLinks}>
        <li><Link href="/" className={isActive('/') ? styles.current : ''}>Home</Link></li>
        <li>
          <Link
            href="/gems/aquamarine"
            className={pathname?.startsWith('/gems') ? styles.current : ''}
          >
            Gem Categories
          </Link>
        </li>
        <li><Link href="/about" className={isActive('/about') ? styles.current : ''}>About</Link></li>
        <li><Link href="/blog" className={pathname?.startsWith('/blog') ? styles.current : ''}>Blog</Link></li>
        <li>
          <Link href="/contact" className={styles.navCta}>Inquire</Link>
        </li>
      </ul>
    </nav>
  );
}
