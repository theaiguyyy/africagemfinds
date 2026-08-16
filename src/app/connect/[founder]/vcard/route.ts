import { founderVCard, getFounderProfile } from '@/lib/founders';

type Context = { params: Promise<{ founder: string }> };

export function generateStaticParams() {
  return [{ founder: 'aly' }, { founder: 'ibrahim' }];
}

export async function GET(_request: Request, { params }: Context) {
  const { founder: slug } = await params;
  const founder = getFounderProfile(slug);
  if (!founder) return new Response('Contact not found', { status: 404 });

  return new Response(founderVCard(founder), {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${founder.slug}-africa-gem-finds.vcf"`,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
