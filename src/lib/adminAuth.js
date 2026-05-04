import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const ADMIN_COOKIE_NAME = 'mazaltime_admin';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function getSecret() {
  return process.env.NEXTAUTH_SECRET || 'supersecretkeyformazaltime';
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('hex');
}

export function createAdminToken(admin) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${admin.id}:${admin.username}:${expiresAt}`;
  return `${payload}:${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token) return null;

  const parts = token.split(':');
  if (parts.length !== 4) return null;

  const [id, username, expiresAt, signature] = parts;
  const payload = `${id}:${username}:${expiresAt}`;

  if (signature !== sign(payload)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return { id, username };
}

export function getAdminSessionFromCookies(cookieStore) {
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function getAdminSessionFromRequest(req) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function setAdminCookie(response, admin) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminToken(admin),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie(response) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function verifyAdminPassword(admin, password) {
  if (!admin?.password || !password) return false;

  if (admin.password.startsWith('$2')) {
    return bcrypt.compare(password, admin.password);
  }

  return admin.password === password;
}
