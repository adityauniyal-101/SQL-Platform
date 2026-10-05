import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminToken } from '@/lib/auth';

// ---------- Rate limiting (in-memory, per IP, fixed window) ----------
// Resets on restart and is per-instance — fine for a single Render instance.

interface Limit {
  max: number;
  windowMs: number;
}

const LIMITS: { match: (path: string, method: string) => boolean; key: string; limit: Limit }[] = [
  { key: 'login', match: (p, m) => p === '/api/admin/login' && m === 'POST', limit: { max: 5, windowMs: 15 * 60_000 } },
  { key: 'execute', match: (p) => p === '/api/execute' || p === '/api/assessment/run', limit: { max: 30, windowMs: 60_000 } },
  { key: 'join', match: (p) => p === '/api/assessment/join', limit: { max: 10, windowMs: 60_000 } },
];

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.ip || 'unknown';
}

function rateLimit(req: NextRequest, pathname: string): NextResponse | null {
  const rule = LIMITS.find((r) => r.match(pathname, req.method));
  if (!rule) return null;

  const now = Date.now();
  if (buckets.size > 10_000) {
    buckets.forEach((b, k) => {
      if (b.resetAt <= now) buckets.delete(k);
    });
  }

  const id = `${rule.key}:${clientIp(req)}`;
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + rule.limit.windowMs });
    return null;
  }

  bucket.count++;
  if (bucket.count > rule.limit.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { success: false, error: `Too many requests. Please wait ${retryAfter}s and try again.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }
  return null;
}

// ---------- Middleware ----------

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const limited = rateLimit(req, pathname);
  if (limited) return limited;

  // Protect admin APIs (except login/logout)
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login' && pathname !== '/api/admin/logout') {
    if (!(await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protect /admin pages (but not the login page itself)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!(await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
