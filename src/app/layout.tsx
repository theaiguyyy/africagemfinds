import type { Metadata } from 'next';
import { Fraunces, Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'Explore rough aquamarine, tourmaline, rubellite, morganite, spessartite garnet, and beryl from Africa, personally inspected by Africa Gem Finds.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: 'Explore personally inspected rough gemstones from Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Explore personally inspected rough gemstones from Africa.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
