/**
 * Guards the CMS: every /admin route except the login page needs a session.
 * Prerendered site pages pass straight through.
 */
import { defineMiddleware } from 'astro:middleware';
import { readSession } from './cms/auth';

const PUBLIC_ADMIN = new Set(['/admin/login', '/admin/login/']);

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (context.isPrerendered || !(pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return next();
  }

  // Writes must come from the CMS itself (Astro's checkOrigin skips JSON and DELETE)
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    const origin = context.request.headers.get('origin');
    if (origin !== context.url.origin) return new Response('Forbidden', { status: 403 });
  }

  const user = readSession(context.cookies);
  if (user) context.locals.user = user;

  if (!user && !PUBLIC_ADMIN.has(pathname)) {
    if (pathname.startsWith('/admin/api/') || pathname.startsWith('/admin/media')) {
      return new Response('Not signed in', { status: 401 });
    }
    return context.redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }

  return next().then((response) => {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  });
});
