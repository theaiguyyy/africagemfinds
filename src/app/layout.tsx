import type { Metadata } from 'next';
import { Fraunces, Inter, Space_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Africa Gem Finds',
  description: 'Rough gemstones sourced directly across Africa — aquamarine, tourmaline, rubylite, morganite, spessartite garnet, and beryl. Based in Bangkok.',
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
