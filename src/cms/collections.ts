/**
 * What the CMS edits. Each CMS section maps to a content collection in src/content/
 * (schemas in src/content.config.ts) and describes its fields once: the editor form
 * is built from these fields and saved entries are checked against them.
 * Keep these in step with src/content.config.ts.
 */

export type Field =
  | { kind: 'text'; key: string; label: string; required?: boolean; hint?: string; lang?: string }
  | { kind: 'textarea'; key: string; label: string; required?: boolean; hint?: string }
  | {
      kind: 'number';
      key: string;
      label: string;
      hint?: string;
      default?: number;
      /** When left at 0, take the value from a sibling graphic field's own size */
      sizeOf?: { field: string; dimension: 'width' | 'height' };
    }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[]; hint?: string }
  /** `limit`: at most this many entries in the collection can have it switched on */
  | { kind: 'boolean'; key: string; label: string; default?: boolean; limit?: number; hint?: string }
  /** A hex color like #FF6B03; empty means the default */
  | { kind: 'color'; key: string; label: string; placeholder?: string; hint?: string }
  /** A graphic from the asset library (src/cms/library.ts), stored as its public path */
  | { kind: 'graphic'; key: string; label: string; required?: boolean; hint?: string }
  /** A 3D model (.glb), saved to public/models/<collection>/ and stored as its public path */
  | { kind: 'model'; key: string; label: string; required?: boolean; hint?: string }
  /** A YouTube link; any YouTube URL is accepted and stored as the 11-character video id */
  | { kind: 'youtube'; key: string; label: string; required?: boolean; hint?: string }
  /** `video: true` also accepts MP4 / WebM, stored as { video: "/videos/..." } */
  | { kind: 'image'; key: string; label: string; required?: boolean; video?: boolean; hint?: string }
  /** 1..max images (or videos) side by side */
  | { kind: 'images'; key: string; label: string; max: number; video?: boolean; hint?: string }
  /** `omitEmpty`: leave the key out instead of writing [] (for schema fields that default to []) */
  | { kind: 'strings'; key: string; label: string; item: string; multiline?: boolean; omitEmpty?: boolean; hint?: string }
  /** A nested object; `optional` adds an on/off switch and omits it when off */
  | { kind: 'group'; key: string; label: string; fields: Field[]; optional?: boolean; hint?: string }
  /** A repeatable list of objects */
  | { kind: 'list'; key: string; label: string; item: string; fields: Field[]; hint?: string }
  /** A repeatable list of typed blocks, stored with a `type` key */
  | {
      kind: 'blocks';
      key: string;
      label: string;
      variants: { type: string; label: string; fields: Field[] }[];
      hint?: string;
    };

export interface CmsCollection {
  /** URL segment under /admin */
  slug: string;
  /** Folder name in src/content/ and src/assets/ */
  collection: 'team' | 'studio' | 'news' | 'projects' | 'episodes' | 'positions';
  label: string;
  singular: string;
  /** Field used as the list title and to suggest the file name of a new entry */
  titleField: string;
  subtitleField?: string;
  thumbField?: string;
  /** Where the entry shows on the site, for the "View on site" link */
  siteUrl?: (id: string) => string;
  /** Entries can be dragged into order on the list page (rewrites their `order` field) */
  sortable?: boolean;
  /** Upload images into src/assets/<collection>/<id>/ instead of src/assets/<collection>/ */
  assetsPerEntry?: boolean;
  /**
   * Shown at the top of this section's list (and highlighted in its nav) instead of
   * having a nav item of its own, e.g. the studio card inside Team
   */
  parent?: string;
  /** Fixed entries: they can be edited, not added or deleted */
  fixed?: boolean;
  /** Badge on its row in the parent's list */
  badge?: string;
  fields: Field[];
}

const order: Field = {
  kind: 'number',
  key: 'order',
  label: 'Order',
  default: 0,
  hint: 'Lower numbers come first.',
};

// Object ids on the Team field. Mirrors `objects` in src/blocks/team/TeamField.astro.
const TEAM_OBJECTS = [
  'hello_robo',
  'inner_calm_02',
  'bright_ideas_01',
  'bite_first_05',
  'tiny_obsession_12',
  'seriously_playful',
  'good_chaos_13',
  'nuts_about_details_03',
  'cat_mode_active',
];

export const CMS_COLLECTIONS: CmsCollection[] = [
  {
    slug: 'team',
    collection: 'team',
    label: 'Team',
    singular: 'team member',
    titleField: 'name',
    subtitleField: 'role',
    thumbField: 'photo',
    siteUrl: (id) => `/team#${id}`,
    fields: [
      { kind: 'text', key: 'name', label: 'Name', required: true, hint: 'As shown on the card, e.g. “Lily A.”' },
      { kind: 'text', key: 'nameJa', label: 'Name in Japanese', required: true, lang: 'ja' },
      { kind: 'text', key: 'role', label: 'Role', required: true },
      { kind: 'textarea', key: 'quote', label: 'Quote', required: true },
      { kind: 'image', key: 'photo', label: 'Photo', required: true, hint: 'Portrait PNG or JPG, exported at 2×.' },
      {
        kind: 'select',
        key: 'object',
        label: 'Object on the Team field',
        options: TEAM_OBJECTS.map((id) => ({ value: id, label: `${id.toUpperCase()}.OBJ` })),
        hint: 'The 3D object that opens this person’s card. Each object should belong to one person.',
      },
      {
        kind: 'model',
        key: 'model',
        label: '3D object',
        hint: 'For the interactive WebGL team gallery. GLB format (binary glTF, textures embedded), ideally under 5 MB. In Blender: File → Export → glTF 2.0, format “glTF Binary (.glb)”.',
      },
      order,
    ],
  },
  {
    slug: 'studio',
    collection: 'studio',
    label: 'Studio card',
    singular: 'studio card',
    titleField: 'name',
    subtitleField: 'heading',
    siteUrl: (id) => `/team#${id}`,
    parent: 'team',
    fixed: true,
    badge: 'Studio card · opened by the robot',
    fields: [
      { kind: 'text', key: 'nameJa', label: 'Name in Japanese', required: true, lang: 'ja' },
      { kind: 'text', key: 'name', label: 'Name', required: true },
      { kind: 'graphic', key: 'stamp', label: 'Stamp', hint: 'Top right of the card.' },
      { kind: 'text', key: 'heading', label: 'Heading', required: true, hint: 'e.g. “Our culture”' },
      { kind: 'strings', key: 'text', label: 'Text', item: 'paragraph', multiline: true },
    ],
  },
  {
    slug: 'updates',
    collection: 'news',
    label: 'Updates',
    singular: 'update',
    titleField: 'text',
    subtitleField: 'href',
    thumbField: 'image',
    siteUrl: () => '/',
    sortable: true,
    fields: [
      { kind: 'textarea', key: 'text', label: 'Text', required: true, hint: 'The headline on the Home carousel card.' },
      { kind: 'image', key: 'image', label: 'Image', required: true },
      {
        kind: 'select',
        key: 'size',
        label: 'Card size',
        options: [
          { value: 'narrow', label: 'Narrow (537)' },
          { value: 'wide', label: 'Wide (815)' },
        ],
      },
      { kind: 'text', key: 'href', label: 'Link', required: true, hint: 'A page on the site (/careers/content-creator) or a full URL.' },
      order,
    ],
  },
  {
    slug: 'projects',
    collection: 'projects',
    label: 'Projects',
    singular: 'project',
    titleField: 'name',
    subtitleField: 'services',
    thumbField: 'reveal',
    siteUrl: (id) => `/work/${id}`,
    sortable: true,
    assetsPerEntry: true,
    fields: [
      { kind: 'text', key: 'name', label: 'Name', required: true },
      { kind: 'textarea', key: 'intro', label: 'Intro', required: true },
      { kind: 'strings', key: 'services', label: 'Services', item: 'service' },
      {
        kind: 'image',
        key: 'reveal',
        label: 'Cover (full bleed)',
        required: true,
        video: true,
        hint: 'The full-width visual under the title, also the Work wheel background. Image (JPG, PNG, GIF) or video (MP4, WebM — plays muted on a loop).',
      },
      {
        kind: 'color',
        key: 'background',
        label: 'Background color',
        placeholder: '#000000',
        hint: 'Background of the project page. Leave empty for black. Text turns black on light colors.',
      },
      {
        kind: 'group',
        key: 'micrographics',
        label: 'Micrographics',
        hint: 'The two graphics at the bottom left of the hero. Pick from the Hello Robo library or upload a new one (SVG preferred).',
        fields: [
          { kind: 'graphic', key: 'left', label: 'Left (round badge)' },
          { kind: 'graphic', key: 'right', label: 'Right (stamp)' },
        ],
      },
      {
        kind: 'group',
        key: 'summary',
        label: 'Summary',
        fields: [
          { kind: 'text', key: 'label', label: 'Label', required: true },
          { kind: 'textarea', key: 'text', label: 'Text', required: true },
        ],
      },
      {
        kind: 'list',
        key: 'facts',
        label: 'Facts',
        item: 'fact',
        fields: [
          { kind: 'text', key: 'label', label: 'Label', required: true },
          { kind: 'text', key: 'value', label: 'Value', required: true },
        ],
      },
      {
        kind: 'blocks',
        key: 'sections',
        label: 'Page sections',
        hint: 'The project page body, top to bottom.',
        variants: [
          {
            type: 'media',
            label: 'Images',
            fields: [
              {
                kind: 'images',
                key: 'images',
                label: 'Images or videos (1–3, side by side)',
                max: 3,
                video: true,
                hint: 'JPG, PNG, GIF, or MP4 / WebM video (plays muted on a loop).',
              },
            ],
          },
          {
            type: 'text',
            label: 'Text',
            fields: [
              { kind: 'text', key: 'label', label: 'Label', required: true },
              { kind: 'textarea', key: 'text', label: 'Text', required: true },
            ],
          },
        ],
      },
      {
        kind: 'group',
        key: 'testimonial',
        label: 'Testimonial',
        optional: true,
        fields: [
          { kind: 'textarea', key: 'quote', label: 'Quote', required: true },
          { kind: 'text', key: 'author', label: 'Author', required: true },
          { kind: 'text', key: 'role', label: 'Role', required: true },
        ],
      },
      {
        kind: 'list',
        key: 'credits',
        label: 'Credits',
        item: 'credit',
        fields: [
          { kind: 'text', key: 'role', label: 'Role', required: true },
          { kind: 'text', key: 'name', label: 'Name', required: true },
        ],
      },
      {
        kind: 'group',
        key: 'next',
        label: 'Next project',
        optional: true,
        fields: [
          { kind: 'text', key: 'name', label: 'Name', required: true },
          { kind: 'text', key: 'href', label: 'Link', required: true, hint: 'e.g. /work/transitive' },
          { kind: 'image', key: 'image', label: 'Image', required: true },
        ],
      },
      order,
    ],
  },
  {
    slug: 'careers',
    collection: 'positions',
    label: 'Careers',
    singular: 'position',
    titleField: 'title',
    subtitleField: 'type',
    siteUrl: (id) => `/careers/${id}`,
    sortable: true,
    fields: [
      { kind: 'text', key: 'title', label: 'Job title', required: true },
      { kind: 'text', key: 'location', label: 'Location', required: true, hint: 'e.g. “Remote” or “New York”' },
      { kind: 'text', key: 'hours', label: 'Hours', required: true, hint: 'e.g. “US-friendly hours”' },
      {
        kind: 'select',
        key: 'type',
        label: 'Type',
        options: ['Full time', 'Contract', 'Contract to hire', 'Freelance'].map((t) => ({ value: t, label: t })),
      },
      order,
      {
        kind: 'group',
        key: 'stamp',
        label: 'Stamp next to the title',
        optional: true,
        hint: 'Shown in the Careers list.',
        fields: [
          { kind: 'graphic', key: 'src', label: 'Graphic', required: true },
          { kind: 'number', key: 'w', label: 'Width (px)', hint: 'Leave at 0 to use the graphic’s own size.', sizeOf: { field: 'src', dimension: 'width' } },
          { kind: 'number', key: 'h', label: 'Height (px)', hint: 'Leave at 0 to use the graphic’s own size.', sizeOf: { field: 'src', dimension: 'height' } },
        ],
      },
      { kind: 'strings', key: 'intro', label: 'Intro', item: 'paragraph', multiline: true, omitEmpty: true },
      { kind: 'strings', key: 'workOn', label: 'What you’ll work on', item: 'point', multiline: true, omitEmpty: true },
      { kind: 'strings', key: 'bring', label: 'What you bring', item: 'point', multiline: true, omitEmpty: true },
      { kind: 'strings', key: 'niceToHave', label: 'Nice to have', item: 'point', multiline: true, omitEmpty: true },
      { kind: 'strings', key: 'howWeWork', label: 'How we work', item: 'paragraph', multiline: true, omitEmpty: true },
      { kind: 'strings', key: 'applySteps', label: 'To apply, send', item: 'step', multiline: true, omitEmpty: true, hint: 'Numbered 01, 02… on the page.' },
      { kind: 'textarea', key: 'outro', label: 'Closing line', hint: 'Optional. Shown under “How to apply”.' },
    ],
  },
  {
    slug: 'robo-radio',
    collection: 'episodes',
    label: 'Robo Radio',
    singular: 'episode',
    titleField: 'title',
    subtitleField: 'guest',
    thumbField: 'cover',
    siteUrl: (id) => `/robo-radio/${id}`,
    sortable: true,
    fields: [
      { kind: 'text', key: 'title', label: 'Title', required: true, hint: 'e.g. “Robo Radio 14: Alejandro Otalora”' },
      { kind: 'number', key: 'number', label: 'Episode number', hint: 'Leave at 0 if it has no number.' },
      { kind: 'text', key: 'guest', label: 'Guest name', required: true },
      { kind: 'text', key: 'guestTitle', label: 'Guest title', required: true, hint: 'What they do, e.g. “Head of Design at Humanoid”.' },
      { kind: 'image', key: 'cover', label: 'Cover image', required: true, hint: 'The episode poster (tall, about 1080×1530).' },
      { kind: 'youtube', key: 'youtube', label: 'YouTube video', required: true, hint: 'Paste the video link, e.g. https://www.youtube.com/watch?v=FczVAM_6H8Q' },
      { kind: 'textarea', key: 'description', label: 'Description', required: true },
      { kind: 'text', key: 'portfolioUrl', label: 'Guest’s portfolio link', hint: 'Optional. Shown as “Follow <name>’s work”.' },
      { kind: 'boolean', key: 'listed', label: 'Show in “All of the episodes”', default: true },
      {
        kind: 'boolean',
        key: 'featured',
        label: 'Featured',
        default: false,
        limit: 6,
        hint: 'Shown as a poster under “One talk. One future” on Robo Radio. Up to 6 episodes, in list order.',
      },
      {
        kind: 'boolean',
        key: 'homepage',
        label: 'Displayed on homepage',
        default: false,
        limit: 4,
        hint: 'Shown as a poster in the Robo Radio section on Home. Up to 4 episodes, in list order.',
      },
      order,
    ],
  },
];

/** Video id from a YouTube URL (watch, youtu.be, embed, shorts, live) or a bare id */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function getCmsCollection(slug: string | undefined) {
  return CMS_COLLECTIONS.find((c) => c.slug === slug);
}
