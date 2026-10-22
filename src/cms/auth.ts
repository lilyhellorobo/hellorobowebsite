/**
 * CMS auth: email + password users, signed session cookie.
 * Users come from the CMS_USERS secret (JSON list of { email, hash }); passwords are
 * stored only as scrypt hashes. `npm run cms:user` adds users and resets passwords.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { CMS_SESSION_SECRET, CMS_USERS } from 'astro:env/server';

export const SESSION_COOKIE = 'hr_cms';
const SESSION_DAYS = 7;

interface StoredUser {
  email: string;
  hash: string;
}

function users(): StoredUser[] {
  if (!CMS_USERS) return [];
  try {
    const list = JSON.parse(CMS_USERS);
    return Array.isArray(list) ? list : [];
  } catch {
    console.error('[cms] CMS_USERS is not valid JSON');
    return [];
  }
}

function secret(): string {
  if (!CMS_SESSION_SECRET || CMS_SESSION_SECRET.length < 32) {
    throw new Error('CMS_SESSION_SECRET is missing or too short. Run `npm run cms:user -- list` to create one.');
  }
  return CMS_SESSION_SECRET;
}

/** Same format as scripts/cms-user.mjs: scrypt:<salt b64>:<hash b64> */
function checkHash(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = scryptSync(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Hash of a random password, checked when the email is unknown so the response
// takes the same time whether or not the user exists.
const DUMMY_HASH = (() => {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString('base64')}:${scryptSync(randomBytes(16), salt, 64).toString('base64')}`;
})();

export function verifyLogin(email: string, password: string): string | null {
  const normalized = email.trim().toLowerCase();
  const user = users().find((u) => u.email.toLowerCase() === normalized);
  const ok = checkHash(password, user?.hash ?? DUMMY_HASH);
  return ok && user ? user.email : null;
}

// --- Failed-login throttle (per IP, in memory) ---

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map<string, { count: number; since: number }>();

export function isThrottled(ip: string): boolean {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.since > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

export function recordFailure(ip: string) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.since > WINDOW_MS) failures.set(ip, { count: 1, since: Date.now() });
  else f.count++;
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}

// --- Session cookie: base64url(JSON payload) + "." + HMAC ---

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function startSession(cookies: AstroCookies, email: string, secure: boolean) {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 86400_000 }),
  ).toString('base64url');
  cookies.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    path: '/admin',
    httpOnly: true,
    sameSite: 'strict',
    secure,
    maxAge: SESSION_DAYS * 86400,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/admin' });
}

export function readSession(cookies: AstroCookies): { email: string } | null {
  const raw = cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof email !== 'string' || typeof exp !== 'number' || exp < Date.now()) return null;
    // A user removed from CMS_USERS loses access right away
    if (!users().some((u) => u.email === email)) return null;
    return { email };
  } catch {
    return null;
  }
}
