/** Shared helpers for the /admin/api endpoints */
import { CmsError, MAX_UPLOAD_BYTES } from './store';

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(err: unknown) {
  if (err instanceof CmsError) return json({ error: err.message, errors: err.errors }, err.status);
  console.error('[cms]', err);
  return json({ error: 'Something went wrong while saving. Please try again.' }, 500);
}

/**
 * Reads an editor submission: multipart form with `data` (the entry as JSON, new images
 * written as "upload:<token>") and one file per token.
 */
export async function readSubmission(request: Request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_UPLOAD_BYTES * 10) throw new CmsError('Too much to upload at once — save in smaller steps', 413);
  const form = await request.formData();
  let data: unknown;
  try {
    data = JSON.parse(String(form.get('data') ?? ''));
  } catch {
    throw new CmsError('Invalid form data');
  }
  const files = new Map<string, File>();
  for (const [key, value] of form.entries()) {
    if (key.startsWith('upload:') && value instanceof File) files.set(key, value);
  }
  return { data, files, id: String(form.get('id') ?? '') };
}
