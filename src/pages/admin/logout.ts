import type { APIRoute } from 'astro';
import { endSession } from '../../cms/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  endSession(cookies);
  return redirect('/admin/login');
};
