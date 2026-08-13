import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inquiry = {
      name: clean(body.name, 120),
      email: clean(body.email, 254).toLowerCase(),
      phone: clean(body.phone, 60),
      gemstone: clean(body.gemstone ?? body.category, 80),
      message: clean(body.message, 4000),
      status: 'new',
    };
    if (!inquiry.name || !inquiry.email || !inquiry.message || !/^\S+@\S+\.\S+$/.test(inquiry.email)) {
      return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const context = [
      clean(body.stoneId, 80) && `Stone reference: ${clean(body.stoneId, 80)}`,
      clean(body.stoneStatus, 20) && `Stone status: ${clean(body.stoneStatus, 20)}`,
      clean(body.pageUrl, 500) && `Page: ${clean(body.pageUrl, 500)}`,
      clean(body.primaryImage, 500) && `Primary image: ${clean(body.primaryImage, 500)}`,
    ].filter(Boolean).join('\n');
    if (context) inquiry.message = `${inquiry.message}\n\n${context}`.slice(0, 4000);
    const { data, error } = await supabase.from('inquiries').insert(inquiry).select('id, created_at').single();
    if (error) throw error;

    const webhook = process.env.MAKE_WEBHOOK_URL;
    if (webhook && !webhook.includes('REPLACE_WITH_YOUR_WEBHOOK_ID')) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'inquiry.created', inquiry: { ...inquiry, ...data } }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error('Inquiry submission failed', error);
    return NextResponse.json({ error: 'Your inquiry could not be sent. Please try again.' }, { status: 500 });
  }
}
