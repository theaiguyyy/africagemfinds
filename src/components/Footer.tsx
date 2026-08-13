import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="footer-logo" aria-label="Africa Gem Finds home">
              <Image src="/africa-gem-finds-logo-nav.png" alt="Africa Gem Finds" width={359} height={216} quality={95} />
            </Link>
            <p className="footer-tag">
              A trusted bridge between Africa&apos;s gemstone-rich regions and a global community of collectors and trade buyers.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href="/gems/aquamarine">Gem Categories</Link>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/gallery">Gallery</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://wa.me/66617472342" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://www.instagram.com/african_gem_finds" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://line.me/ti/p/~66617472342" target="_blank" rel="noopener noreferrer">LINE</a>
            <a href="mailto:africagemfinds@gmail.com">Email</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <Link href="/contact">Send an inquiry</Link>
            <a href="https://www.google.com/maps/search/?api=1&query=101+Saphan+Yao+Alley+Bangkok" target="_blank" rel="noopener noreferrer">Bangkok, Thailand</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Africa Gem Finds. All rights reserved.</span>
          <span>Site by Flowra</span>
        </div>
      </div>
    </footer>
  );
}
