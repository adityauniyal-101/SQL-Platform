import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, safeEqual, signToken } from '@/lib/auth';

const SESSION_TTL_SECS = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string' || !safeEqual(password, expected)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, await signToken('admin', SESSION_TTL_SECS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECS,
    path: '/',
  });
  return response;
}
