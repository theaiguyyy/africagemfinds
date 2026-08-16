import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  COMPANY_CONTACT,
  FOUNDER_SLUGS,
  founderProfileUrl,
  founderWhatsAppUrl,
  getFounderProfile,
} from '@/lib/founders';
import styles from './profile.module.css';

type Props = { params: Promise<{ founder: string }> };

export function generateStaticParams() {
  return FOUNDER_SLUGS.map((founder) => ({ founder }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { founder: slug } = await params;
  const founder = getFounderProfile(slug);
  if (!founder) return { title: 'Contact Profile', robots: { index: false, follow: false } };

  const title = `${founder.fullName} — ${founder.role}`;
  const description = `Connect directly with ${founder.fullName} of Africa Gem Finds.`;
  return {
    title,
    description,
    alternates: { canonical: founderProfileUrl(founder) },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: founderProfileUrl(founder),
      siteName: COMPANY_CONTACT.name,
      images: [{ url: founder.portrait, alt: founder.portraitAlt }],
    },
  };
}

export default async function FounderProfilePage({ params }: Props) {
  const { founder: slug } = await params;
  const founder = getFounderProfile(slug);
  if (!founder) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <article className={styles.card}>
        <section className={styles.portrait}>
          <Image
            src={founder.portrait}
            alt={founder.portraitAlt}
            fill
            priority
            quality={95}
            sizes="(max-width: 760px) 100vw, 48vw"
            style={{ objectFit: 'cover', objectPosition: founder.portraitPosition }}
          />
          <div className={styles.portraitShade} />
          <Link href="/" className={styles.brandMark} aria-label="Visit the Africa Gem Finds homepage">
            <Image src="/africa-gem-finds-logo-transparent.png" alt="Africa Gem Finds" width={180} height={112} priority />
          </Link>
          <p className={styles.scanLabel}>Personal contact · Africa Gem Finds</p>
        </section>

        <section className={styles.content}>
          <p className={styles.eyebrow}>You&apos;re connected</p>
          <h1>{founder.fullName}</h1>
          <p className={styles.role}>{founder.role}</p>
          <p className={styles.intro}>Direct access to African rough gemstones, handled person to person.</p>

          <div className={styles.primaryActions}>
            <a className={styles.whatsapp} href={founderWhatsAppUrl(founder)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span><small>Message on WhatsApp</small>{founder.phoneDisplay}</span>
            </a>
            <a className={styles.save} href={`/connect/${founder.slug}/vcard`} download={`${founder.slug}-africa-gem-finds.vcf`}>
              <ContactIcon />
              <span>Add to Contacts</span>
            </a>
          </div>

          <div className={styles.contactList} aria-label="Company contact links">
            <a href={`mailto:${COMPANY_CONTACT.email}`}>
              <span>Email</span><strong>{COMPANY_CONTACT.email}</strong>
            </a>
            <a href={COMPANY_CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
              <span>Instagram</span><strong>{COMPANY_CONTACT.instagramHandle}</strong>
            </a>
            <a href={COMPANY_CONTACT.website}>
              <span>Website</span><strong>africagemfinds.com</strong>
            </a>
          </div>

          <p className={styles.footerLine}>Rough gemstones · Direct from source</p>
        </section>
      </article>
    </main>
  );
}

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L.2 24l6.4-1.7c1.8 1 3.7 1.5 5.5 1.5 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.4-8.5Zm-8.4 18.3c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.8 1 1-3.7-.2-.4a9.7 9.7 0 1 1 8.3 4.6Zm5.3-7.3c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-1.8-.9-3-1.7-4.2-3.8-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.3 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3 2.2.9 3 .9 4.1.8.7-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4Z" /></svg>;
}

function ContactIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0m14-5v6m-3-3h6" /></svg>;
}
