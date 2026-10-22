# Hello Robo — Website

The new website for Hello Robo studio. Built with [Astro](https://astro.build).
Design source: Figma “Hello Robo Website 2026” → **Handoff ✅** → `website` section.

## Getting started

```bash
git clone https://github.com/lilyhellorobo/hellorobowebsite.git
cd hellorobowebsite
npm install
npm run dev
```

Then open http://localhost:4321.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with live reload |
| `npm run build` | Builds the static site into `dist/` |
| `npm run preview` | Serves the built site |
| `npm run svg` | Optimizes every SVG in `public/images` |

If you change `src/content.config.ts` and the dev server shows old data, stop it
and clear the cache: `rm -rf .astro node_modules/.astro`, then `npm run dev`.

Review pages (not linked from the site):

- `/styleguide` — every color, text style, button, icon and line
- `/blocks` — finished blocks and links to every page

## Project structure

```
src/
  styles/
    tokens.css        all design tokens (colors, type, spacing, layout)
    fonts.css         Alliance No.2 @font-face
    global.css        reset + text style classes (.t-h1 … .t-button)
  layouts/
    BaseLayout.astro  shell: Get in touch · page · pre-footer · footer · nav pill
  components/
    ui/               Button, ArrowLink, Divider, WebGLSlot, VideoSlot, BlockPlaceholder
    global/           NavPill, GetInTouch, PreFooterCTA, Footer
    icons/            Icon (all small icons), RoboLogo
  blocks/             page blocks, one folder per page (built in phase 2)
  content/            CMS-shaped content (JSON): projects, team, positions, episodes, news
  content.config.ts   schemas for the content collections
  data/site.ts        menu links, studio address, socials
  pages/              one file per route
public/
  fonts/              licensed font files (not in git until added)
  images/             images exported from Figma
```

## Pages

| Route | Figma frame |
|---|---|
| `/` | 1.0 home |
| `/work` | Portfolio page |
| `/work/[slug]` | Project (Weekly Robotics) |
| `/services` | Services |
| `/team` | team + card |
| `/careers` | Careers |
| `/careers/[slug]` | Careers (Content Creator) |
| `/robo-radio` | Robo radio |
| `/robo-radio/[slug]` | robo radio single episode |
| `/contact` | Contact + Receipt |

Blocks that aren't built yet show as grey placeholders at their Figma height,
with a link to the Figma node.

## Rules

- **Text styles:** only the five Figma styles — H1, H2, H3, Body, Button — via
  `.t-h1`, `.t-h2`, `.t-h3`, `.t-body`, `.t-button`. Don't add new ones.
- **Tokens only:** no raw hex colors or font sizes in blocks. Add missing values
  to `tokens.css` first.
- **One block = one file = one branch / pull request.** Put the Figma node link
  in a comment at the top of the file.
- **Order:** static desktop → responsive → motion → WebGL & CMS.
- **Graphics are SVG only.** Logos, icons, stamps and all micrographics are
  SVG, never PNG/JPG. Export from Figma with text outlined, then run
  `npm run svg` to optimize (SVGO, see `svgo.config.mjs`). Compare against the
  original at 4× zoom before committing. Photos and video stay raster.
- **WebGL and video** areas use `WebGLSlot` / `VideoSlot` so the layout never
  waits for 3D or video files.
- **Scaling (desktop + tablet):** write every desktop size as
  `calc(N * var(--px))`, where N is the Figma px value. `--px` is 1px at 1728
  and shrinks with the screen, so 1440 / 1280 / 1024 / 768 look like the Figma
  frame scaled down. Text never goes below a readable size (floors in
  `tokens.css`). Images get their size from the `width` attribute copied to
  `style="--w: N"`. Hairlines (1–2px) stay as they are. Tablet-only fixes go in
  `@media (min-width: 768px) and (max-width: 1199px)`.
- **Mobile:** one breakpoint, `@media (max-width: 767px)`, at the end of each
  block's `<style>`. The text styles switch to Figma's Mobile/* sizes in
  `tokens.css`, so blocks only change layout. Mobile/Body2 (12px) is
  `.t-body2-mobile`; `.only-mobile` / `.only-desktop` hide elements that exist
  in one layout only. Use `minmax(0, 1fr)` for mobile grid columns.

## How we work

- `main` is always the working, deployable version — don't commit to it directly.
- Start each task on its own branch: `git checkout -b feature/short-description`
- Push your branch and open a Pull Request on GitHub for review.
- Before starting new work, update: `git checkout main && git pull`
