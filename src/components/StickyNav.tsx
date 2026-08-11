'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './StickyNav.module.css';

export default function StickyNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <span className={styles.dots}>
          <span style={{ background: 'var(--blue)' }} />
          <span style={{ background: 'var(--green)' }} />
          <span style={{ background: 'var(--ruby)' }} />
        </span>
        African Gem Finds
      </Link>
      <ul className={styles.navLinks}>
        <li><Link href="/" className={pathname === '/' ? styles.current : ''}>Home</Link></li>
        <li>
          <Link
            href="/gems/aquamarine"
            className={pathname?.startsWith('/gems') ? styles.current : ''}
          >
            Gem Categories
          </Link>
        </li>
        <li><Link href="/about" className={pathname === '/about' ? styles.current : ''}>About</Link></li>
        <li>
          <Link href="/blog" className={pathname?.startsWith('/blog') ? styles.current : ''}>
            Blog
          </Link>
        </li>
        <li><Link href="/contact" className={styles.navCta}>Inquire</Link></li>
      </ul>
    </nav>
  );
}
