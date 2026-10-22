/**
 * Hello Robo asset library: the micrographics (stamps, badges, globes) in public/images
 * plus anything uploaded through the CMS into public/images/micrographics/.
 * Stored on entries as the public path, e.g. "/images/project/badge-25.svg".
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CmsError, MAX_UPLOAD_BYTES, slugify } from './store';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
export const UPLOAD_DIR = 'images/micrographics';

/** Site graphics that count as micrographics (logos, players and illustrations don't) */
const SITE_GRAPHIC = /^(stamp-|badge-)|micrographic|globe/;

export interface LibraryItem {
  path: string;
  name: string;
  group: 'Uploaded' | 'Site';
}

async function walk(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const toPublicPath = (file: string) => '/' + path.relative(PUBLIC_DIR, file).split(path.sep).join('/');
const label = (file: string) =>
  path
    .basename(file)
    .replace(/\.[^.]+$/, '')
    .replace(/-[0-9a-f]{6}$/, '')
    .replace(/[-_]+/g, ' ');

export async function listLibrary(): Promise<LibraryItem[]> {
  const uploadDir = path.join(PUBLIC_DIR, UPLOAD_DIR);
  const files = await walk(IMAGES_DIR);
  const uploaded = files.filter((f) => f.startsWith(uploadDir + path.sep) && /\.(svg|png|webp)$/i.test(f));
  const site = files.filter(
    (f) => !f.startsWith(uploadDir + path.sep) && f.endsWith('.svg') && SITE_GRAPHIC.test(path.basename(f)),
  );
  const items = (list: string[], group: LibraryItem['group']) =>
    list
      .map((f) => ({ path: toPublicPath(f), name: label(f), group }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return [...items(uploaded, 'Uploaded'), ...items(site, 'Site')];
}

/** True if the public path points at an existing file in public/images */
export function libraryFileExists(publicPath: string) {
  if (!publicPath.startsWith('/images/')) return false;
  const file = path.resolve(PUBLIC_DIR, '.' + publicPath);
  return file.startsWith(IMAGES_DIR + path.sep) && existsSync(file);
}

/** Width / height of an SVG in the library, from its width/height or viewBox */
export function graphicSize(publicPath: string): { width: number; height: number } | null {
  if (!libraryFileExists(publicPath) || !publicPath.endsWith('.svg')) return null;
  const head = readFileSync(path.resolve(PUBLIC_DIR, '.' + publicPath), 'utf8').slice(0, 2000);
  const tag = head.match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const attr = (name: string) => Number(tag.match(new RegExp(`\\s${name}="([\\d.]+)(px)?"`))?.[1]);
  const box = tag.match(/viewBox="[\d.\s-]+?\s([\d.]+)\s+([\d.]+)"/);
  const width = attr('width') || Number(box?.[1]);
  const height = attr('height') || Number(box?.[2]);
  return width && height ? { width: Math.round(width), height: Math.round(height) } : null;
}

// SVGs are served from the site's own origin, so refuse anything that could run code
const UNSAFE_SVG = /<script|<foreignObject|\son\w+\s*=|javascript:|<iframe|<embed|<object/i;

export async function saveLibraryUpload(file: File): Promise<LibraryItem> {
  const ext = { 'image/svg+xml': '.svg', 'image/png': '.png', 'image/webp': '.webp' }[file.type];
  if (!ext) throw new CmsError('Micrographics must be SVG (preferred), PNG or WebP');
  if (file.size > MAX_UPLOAD_BYTES) throw new CmsError(`“${file.name}” is larger than 15 MB`);
  const data = Buffer.from(await file.arrayBuffer());
  if (ext === '.svg') {
    const text = data.toString('utf8');
    if (!/<svg[\s>]/i.test(text)) throw new CmsError(`“${file.name}” is not a valid SVG`);
    if (UNSAFE_SVG.test(text)) throw new CmsError(`“${file.name}” contains scripts or links, which aren’t allowed`);
  }
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'micrographic';
  const name = `${base}-${randomBytes(3).toString('hex')}${ext}`;
  const dir = path.join(PUBLIC_DIR, UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await writeFile(full, data);
  return { path: toPublicPath(full), name: label(full), group: 'Uploaded' };
}
