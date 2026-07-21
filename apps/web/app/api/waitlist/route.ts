import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : null;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Waitlist is not configured yet.' },
      { status: 503 }
    );
  }

  const { error } = await supabase.from('waitlist').insert({ email: rawEmail, name });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyOnList: true });
    }
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
