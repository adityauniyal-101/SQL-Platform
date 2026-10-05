// HMAC-signed tokens using Web Crypto, so the same code runs in Edge middleware and Node routes.
// Token format: <payload>.<expiryUnixSecs>.<base64url signature>

export const ADMIN_COOKIE = 'admin_token';
export const ASSESSMENT_COOKIE = 'assessment_session';

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('SESSION_SECRET or ADMIN_PASSWORD must be set');
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

// Constant-time string comparison (length is not secret here).
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export async function signToken(payload: string, ttlSecs: number): Promise<string> {
  if (payload.includes('.')) throw new Error('Token payload must not contain "."');
  const expiry = Math.floor(Date.now() / 1000) + ttlSecs;
  const body = `${payload}.${expiry}`;
  return `${body}.${await hmac(body)}`;
}

// Returns the payload if the token is authentic and unexpired, otherwise null.
export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [payload, expiryStr, signature] = parts;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now() / 1000) return null;
  const expected = await hmac(`${payload}.${expiryStr}`);
  return safeEqual(signature, expected) ? payload : null;
}

export async function isAdminToken(token: string | undefined): Promise<boolean> {
  return (await verifyToken(token)) === 'admin';
}

// Returns the submission id bound to the assessment cookie, or null.
export async function getAssessmentSubmissionId(token: string | undefined): Promise<number | null> {
  const payload = await verifyToken(token);
  if (!payload || !payload.startsWith('sub')) return null;
  const id = Number(payload.slice(3));
  return Number.isInteger(id) && id > 0 ? id : null;
}
