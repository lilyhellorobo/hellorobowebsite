/** DELETE /admin/api/responses/<id> — delete a contact form response */
import type { APIRoute } from 'astro';
import { errorResponse, json } from '../../../../cms/api';
import { deleteResponse } from '../../../../cms/responses';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    await deleteResponse(params.id ?? '');
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};
