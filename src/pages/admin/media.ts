/**
 * GET /admin/media?ref=../../assets/... | /models/... | /videos/... — serves a content image,
 * 3D model or video to the CMS for previews, straight from disk (with Range for videos)
 */
import { existsSync } from 'node:fs';
import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { assetFile } from '../../cms/store';

export const prerender = false;

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export const GET: APIRoute = async ({ url, request }) => {
  const file = assetFile(url.searchParams.get('ref') ?? '');
  const type = file && TYPES[path.extname(file).toLowerCase()];
  if (!file || !type || !existsSync(file)) return new Response('Not found', { status: 404 });
  const headers: Record<string, string> = {
    'Content-Type': type,
    // SVGs can carry scripts: never let them run
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };

  // Video players ask for byte ranges to start and seek
  const { size } = await stat(file);
  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1, start + 8 * 1024 * 1024 - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const handle = await open(file);
    const chunk = Buffer.alloc(end - start + 1);
    await handle.read(chunk, 0, chunk.length, start);
    await handle.close();
    return new Response(chunk, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(chunk.length) },
    });
  }
  return new Response(await readFile(file), { headers });
};
