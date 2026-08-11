import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const expected = process.env.KEEPALIVE_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) {
    return NextResponse.json({ alive: false }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('media').select('id').limit(1);
  if (error) return NextResponse.json({ alive: false, error: error.message }, { status: 503 });
  return NextResponse.json({ alive: true, ts: new Date().toISOString() });
}
