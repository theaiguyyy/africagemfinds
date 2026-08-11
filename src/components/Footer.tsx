import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <span className="dots" style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ruby)' }} />
              </span>
              African Gem Finds
            </div>
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
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://wa.me/66617472342" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://www.instagram.com/african_gem_finds" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="/" >Facebook</a>
            <a href="https://line.me/ti/p/~66617472342" target="_blank" rel="noopener noreferrer">LINE</a>
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
