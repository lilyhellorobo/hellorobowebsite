// CMS-shaped content. Each collection is a folder of JSON files in src/content/.
// Later these loaders can be swapped for a headless CMS without touching the pages.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * An image (path in src/assets, optimized by astro:assets; GIFs keep their animation)
 * or a video in public/videos/, written as { "video": "/videos/..." }.
 * Rendered by src/components/ui/Media.astro.
 */
const media = (image: () => z.ZodTypeAny) =>
  z.union([image(), z.object({ video: z.string().regex(/^\/videos\//) })]);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      intro: z.string(),
      services: z.array(z.string()),
      /** Cover: the full-bleed image or video under the hero ("show logo") */
      reveal: media(image),
      /** Page background for the dark sections; text turns black on light colors */
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      /** The two hero micrographics (public paths from the CMS asset library); left one is round */
      micrographics: z
        .object({ left: z.string().optional(), right: z.string().optional() })
        .default({}),
      summary: z.object({ label: z.string(), text: z.string() }),
      facts: z.array(z.object({ label: z.string(), value: z.string() })),
      /** Page body: media rows (1–3 images side by side) and text rows, in order */
      sections: z.array(
        z.discriminatedUnion('type', [
          z.object({ type: z.literal('media'), images: z.array(media(image)).min(1).max(3) }),
          z.object({ type: z.literal('text'), label: z.string(), text: z.string() }),
        ]),
      ),
      testimonial: z
        .object({ quote: z.string(), author: z.string(), role: z.string() })
        .optional(),
      credits: z.array(z.object({ role: z.string(), name: z.string() })).default([]),
      next: z.object({ name: z.string(), href: z.string(), image: image() }).optional(),
      order: z.number().default(0),
    }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      nameJa: z.string(),
      role: z.string(),
      quote: z.string(),
      photo: image(),
      /** The 3D object on the Team field that opens this card */
      object: z.string().describe('Object id on the Team field, e.g. hello_robo'),
      /** 3D model of their object for the WebGL team gallery: a .glb in public/models/team/ */
      model: z.string().optional(),
      order: z.number().default(0),
    }),
});

const positions = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/positions' }),
  schema: z.object({
    title: z.string(),
    location: z.string(),
    hours: z.string(),
    type: z.enum(['Full time', 'Contract', 'Contract to hire', 'Freelance']),
    intro: z.array(z.string()).default([]),
    workOn: z.array(z.string()).default([]),
    bring: z.array(z.string()).default([]),
    niceToHave: z.array(z.string()).default([]),
    howWeWork: z.array(z.string()).default([]),
    applySteps: z.array(z.string()).default([]),
    /** Closing line under "How to apply" */
    outro: z.string().optional(),
    /** Optional stamp shown next to the title in the Careers list */
    stamp: z.object({ src: z.string(), w: z.number(), h: z.number() }).optional(),
    order: z.number().default(0),
  }),
});

const episodes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/episodes' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    number: z.number().optional(),
    guest: z.string(),
    /** What the guest does, e.g. "Head of Design at Humanoid" */
    guestTitle: z.string(),
    description: z.string(),
    /** YouTube video id (the 11 characters after watch?v=) */
    youtube: z.string().regex(/^[\w-]{11}$/).optional(),
    portfolioUrl: z.string().optional(),
    /** 16:9-ish cover used in "All of the episodes" */
    cover: image().optional(),
    /** Tall poster used on the episode page */
    poster: image().optional(),
    /** Show in the "All of the episodes" list */
    listed: z.boolean().default(true),
    /** Poster in the "One talk. One future" collage (up to 6, in `order`) */
    featured: z.boolean().default(false),
    /** Poster in the Robo Radio section on Home (up to 4, in `order`) */
    homepage: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/news' }),
  schema: ({ image }) => z.object({
    text: z.string(),
    image: image(),
    /** Card width on the Home carousel: "wide" = 815, "narrow" = 537 */
    size: z.enum(['wide', 'narrow']).default('narrow'),
    href: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { projects, team, positions, episodes, news };
