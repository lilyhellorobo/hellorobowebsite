/**
 * Contact form responses: one JSON file per submission in data/contact-responses/
 * (git-ignored — people's names and emails never go into the repo or the site build).
 * Written by the public /api/contact endpoint, read and deleted in the CMS.
 */
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CmsError } from './store';

const DIR = path.resolve(process.env.CONTACT_RESPONSES_DIR || path.join(process.cwd(), 'data/contact-responses'));
const ID_RE = /^\d{8}-\d{6}-[0-9a-f]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactResponse {
  id: string;
  /** ISO date */
  receivedAt: string;
  /** "Start a project" (name, email, company, services) or "Drop a quick word" (message) */
  type: 'project' | 'message';
  name?: string;
  email?: string;
  company?: string;
  services?: string[];
  message?: string;
  /** Page the form was sent from */
  page?: string;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Checks a submission from the site; throws CmsError with the problems */
export function parseResponse(input: unknown): Omit<ContactResponse, 'id' | 'receivedAt'> {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const page = str(src.page, 200) || undefined;
  if (src.type === 'message') {
    const message = str(src.message, 5000);
    if (!message) errors.push('Message is empty');
    if (errors.length) throw new CmsError(errors[0], 422, errors);
    return { type: 'message', message, page };
  }
  if (src.type !== 'project') throw new CmsError('Unknown form');
  const name = str(src.name, 120);
  const email = str(src.email, 200);
  const company = str(src.company, 200);
  const services = Array.isArray(src.services)
    ? src.services.map((s) => str(s, 100)).filter(Boolean).slice(0, 20)
    : [];
  if (!name) errors.push('Name is missing');
  if (!EMAIL_RE.test(email)) errors.push('Email doesn’t look right');
  if (errors.length) throw new CmsError(errors[0], 422, errors);
  return { type: 'project', name, email, company: company || undefined, services, page };
}

export async function saveResponse(input: unknown): Promise<ContactResponse> {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const entry: ContactResponse = {
    id: `${stamp}-${randomBytes(3).toString('hex')}`,
    receivedAt: now.toISOString(),
    ...parseResponse(input),
  };
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, `${entry.id}.json`);
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(entry, null, 2) + '\n');
  await rename(tmp, file);
  return entry;
}

/** Newest first */
export async function listResponses(): Promise<ContactResponse[]> {
  if (!existsSync(DIR)) return [];
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.json'));
  const entries = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(path.join(DIR, f), 'utf8')) as ContactResponse),
  );
  return entries.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export async function deleteResponse(id: string) {
  if (!ID_RE.test(id)) throw new CmsError('Invalid response id', 400);
  const file = path.join(DIR, `${id}.json`);
  if (!existsSync(file)) throw new CmsError('Response not found', 404);
  await unlink(file);
}
