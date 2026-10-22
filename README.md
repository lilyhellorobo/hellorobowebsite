# Hello Robo — Website

The new website for the Hello Robo studio, built with [Astro](https://astro.build)
(static output, no framework JS).

- **Design source:** Figma “Hello Robo Website 2026” → page **Handoff ✅** → section `website`
  (https://www.figma.com/design/9SsfbCUY7KcxjZpCuRpDxf/Hello-Robo-Website-2026?node-id=10093-10194)
- **Scope of this repo:** front end. Order of work:
  **static desktop → responsive → motion → WebGL & CMS**.

## Status

| Phase | State |
|---|---|
| 0. Project setup, tokens, fonts | ✅ done |
| 1. Shell: Get in touch, nav pill, pre-footer, footer | ✅ done |
| 2. Static desktop blocks, all pages | ✅ done (matches Figma section heights at 1728 within ~1–5px) |
| 3a. Laptop + tablet scaling (768–1727) | ✅ done (the 1728 design scales down; text has readable floors) |
| 3b. Mobile (≤ 767) | ✅ Home from the Figma 390 frame; other pages follow the same rules (see “Needs design”) |
| Site menu (overlay) | ✅ works on every page; placeholder open/close animation |
| 4. Motion | ⏳ next — menu reveal, project wheel, carousels, value tabs, contact steps |
| 5. WebGL scenes, video, CMS | ⏳ slots and content collections are ready |

## Getting started

```bash
git clone https://github.com/lilyhellorobo/hellorobowebsite.git
cd hellorobowebsite
npm install
npm run dev
```

Open http://localhost:4321. The licensed font files are **not in git** (public repo):
copy `AllianceNo2-Regular.woff2` and `.woff` into `public/fonts/` — ask Lily for them.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with live reload |
| `npm run build` | Builds the static site into `dist/` |
| `npm run preview` | Serves the built site |
| `npm run svg` | Optimizes every SVG in `public/images` (SVGO, `svgo.config.mjs`) |

If you change `src/content.config.ts` and the dev server shows old data, stop it and
clear the cache: `rm -rf .astro node_modules/.astro node_modules/.vite`, then `npm run dev`.

Review pages (not linked from the site): `/styleguide` (colors, text styles, buttons,
icons, lines) and `/blocks` (every block and page).

---

## Sitemap

| Route | Page | Figma frame | Content |
|---|---|---|---|
| `/` | Home | 1.0 home | static + `news` collection |
| `/work` | Work — project wheel (full screen, no footer) | Portfolio page | static (CMS later) |
| `/work/[slug]` | Project, e.g. `/work/weekly-robotics` | Project (Weekly Robotics) | `projects` collection |
| `/services` | Services | Services | static |
| `/team` | Team field + person cards (`/team#lily-a`) | team + card | `team` collection |
| `/careers` | Careers | Careers | `positions` collection |
| `/careers/[slug]` | Position, e.g. `/careers/content-creator` | Careers (Content Creator) | `positions` collection |
| `/robo-radio` | Robo Radio | Robo radio | `episodes` collection |
| `/robo-radio/[slug]` | Episode, e.g. `/robo-radio/14-alejandro-otalora` | robo radio single episode | `episodes` collection |
| `/contact` | Contact flow: `#name` `#email` `#company` `#mission` `#message` `#done` | Contact + Receipt | static |
| `/styleguide`, `/blocks` | Internal review pages | — | — |

Every page shares the shell from `BaseLayout`: **Get in touch** (top right) · page ·
**pre-footer** · **footer** · **nav pill** + **site menu**. Options per page:
`headerVariant` (dark / light / grey), `prefooter` (conversation / building / false),
`back` (adds the back button), `footer` (false on Work, Team, Contact).

## Folder structure

```
src/
  styles/
    tokens.css          design tokens: colors, type, scale unit, spacing, layout, z-index
    fonts.css           Alliance No.2 @font-face
    global.css          reset, text style classes, helpers, image/icon scaling
  layouts/
    BaseLayout.astro    the shell every page uses
  components/
    global/             GetInTouch, NavPill, SiteMenu, PreFooterCTA, Footer, FooterWordmark
    ui/                 Button, ArrowLink, Divider, WebGLSlot, VideoSlot, BlockPlaceholder
    icons/              Icon (corners, hex, hex-pin, back, arrow, dots), RoboLogo
  blocks/               page blocks — one folder per page, one block per file
    home/ work/ services/ careers/ position/ radio/ episode/ project/ team/ contact/
  content/              CMS-shaped JSON: projects/ team/ positions/ episodes/ news/
  content.config.ts     schemas for those collections
  data/site.ts          menu links, studio address, socials
  assets/               photos (PNG, 2× exports) — optimized to WebP by astro:assets
  pages/                one file per route (see Sitemap)
public/
  fonts/                licensed fonts (git-ignored)
  images/<page>/        SVG graphics (stamps, logos, micrographics), a few PNGs
  videos/               showreel.mp4 / .webm / poster go here (see videos/README.md)
svgo.config.mjs         SVG optimization settings (keeps ids and viewBox)
.claude/launch.json     dev server config for the Claude preview
```

---

## Design system

All values live in `src/styles/tokens.css`. Blocks use tokens and the five text
classes — no raw hex colors or font sizes.

### Colors

| Token | Value | Use |
|---|---|---|
| `--color-orange` | `#FF6B03` | **Orange / primary — the only orange.** Every orange in the designs uses it |
| `--color-black` | `#000000` | dark sections, buttons |
| `--color-ink` | `#111111` | body text on light, image placeholders |
| `--color-ink-warm` | `#100F0D` | video / deep backgrounds |
| `--color-white` | `#FFFFFF` | |
| `--color-grey-50` | `#F9F9F9` | nav pill, menu panel |
| `--color-grey-100` | `#F2F2F2` | light surfaces |
| `--color-grey-200` | `#EDEDED` | team field |
| `--color-grey-300` | `#D9D9D9` | placeholders, Copy button |
| `--color-grey-350` | `#C6C6C6` | pre-footer / contact bg, inactive menu links |
| `--color-grey-400` | `#BCBCBC` | menu dots |
| `--color-grey-600` | `#747474` | secondary text |
| `--line-on-light` / `--line-on-dark` | black / white 20% | rules and dividers (`--line-width: 1px`) |
| `--line-strong-on-light` / `-on-dark` | black / white | active tab segment |

Only the orange is a Figma variable; greys and lines were measured from the designs.

### Typography — Alliance No.2 Regular, five styles only

| Class | Desktop (Figma) | Floor on small screens | Mobile (Figma Mobile/*) |
|---|---|---|---|
| `.t-h1` | 120 / 95% / −6% | 56 | 64 / 95% / −6% |
| `.t-h2` | 80 / 95% / −6% | 40 | 44 / 116% / −5% |
| `.t-h3` | 50 / 116% / −5% | 26 | 32 / 116% / −5% |
| `.t-body` | 20 / 120% / −1% | 15 | 16 / 120% / −1% |
| `.t-button` | 18 / 100% / +6%, uppercase | 13 | 18 |
| `.t-body2-mobile` | (Body on desktop) | — | 12 / 120% / −1% (Mobile/Body2) |

Don't add text styles. Stray sizes in Figma are mapped to the nearest of these.
The browser renders Alliance the same as Figma (checked: heading widths match within 0.5px).

### Scale unit and layout

| Token | Value |
|---|---|
| `--px` | `min(1px, 100vw / 1728)` — **1 Figma pixel**. 1px at 1728+, smaller below; 1px again on mobile |
| `--page-max` | 1728px |
| `--page-margin` | 40 (16 on mobile) |
| `--gutter` | 12 |
| `--space-6 … --space-160` | 6, 12, 16, 20, 24, 32, 40, 48, 60, 80, 100, 120, 160 |
| `--button-height` | 60 (min 44) |
| `--nav-height` / `--nav-width` | 80 / 426 (min 56 / 300; 64 tall on mobile) |
| `--icon-size` | 32 (min 24) |
| `--radius-ui` | 2px |
| `--z-raised / -header / -nav / -overlay` | 10 / 100 / 200 / 300 (menu sits at nav − 1) |

### Helpers (`global.css`)

- `.container` — max 1728, side margins
- `.theme-dark` / `.theme-light` — section colors
- `.only-mobile` / `.only-desktop` — elements that exist in one layout only
- `.visually-hidden` — screen-reader-only text
- `img[style*="--w"]`, `.icon`, `.robo-logo` — take their Figma width from `--w`, scaled by `--px`

### Responsive system

| Range | What happens |
|---|---|
| ≥ 1728 | The Figma desktop frame, 1:1 |
| 768 – 1727 | Same layout scaled by `--px` (e.g. 1440 → 83%, 1024 → 59%); text floors keep it readable. Tablet-only fixes: `@media (min-width: 768px) and (max-width: 1199px)` |
| ≤ 767 | Mobile layouts (Figma 390 frames), `@media (max-width: 767px)` at the end of each block's `<style>` |

Writing CSS: desktop sizes as `calc(N * var(--px))` where N is the Figma px value;
hairlines (1–2px) stay as they are; mobile values are plain px; use `minmax(0, 1fr)`
for mobile grid columns. Images: give `<img>` its Figma `width` and `style="--w: N"`.

---

## Components

| Component | Figma | Notes |
|---|---|---|
| `GetInTouch` | hero "nav" 265×64 | fixed top right; dark / light / grey; hidden on mobile (it's in the menu) |
| `NavPill` | "nav" 10093:2370, 426×80 | fixed bottom centre; optional back button; opens the menu |
| `SiteMenu` | "1.1 menu d" 10194:165 | blurred backdrop, links (current page black + arrow), Let's talk, photo, Say hello + socials. Close: × / Esc / backdrop click |
| `PreFooterCTA` | "block" 1728×949 | variants `conversation` (stamp) / `building` ("Click anywhere"); mobile adds 2 buttons + email bar |
| `Footer` + `FooterWordmark` | "footer + contacts" 10093:2045 | wordmark is one SVG `<symbol>` reused 39× |
| `Button` | "button" | variants dark / light, size default / small, icons hex / hex-pin / corners / arrow / none |
| `ArrowLink` | "View →" | orange Body link |
| `Divider` | rules | `tone`, `accent` segment |
| `WebGLSlot` | areas marked "3d web gl" | reserves the space, shows the static poster; mount scenes in `.webgl-slot__stage` |
| `VideoSlot` | video areas | plays `src` (muted, loop) or shows the poster; `mobileRatio` for a different mobile crop |
| `Icon`, `RoboLogo` | icons, orange logo | `currentColor` |

## Block inventory

Every block file starts with a comment naming its Figma node and link.

| Page | Block (file in `src/blocks/`) | Figma node | Mobile |
|---|---|---|---|
| Home | `home/HomeHero` — title, receipt sphere, robot (WebGL poster) | 10093:119 | Figma |
| | `home/HomeIntro` — stamp + mission text | 10093:145 | Figma |
| | `home/HomeShowreel` — video (`public/videos/showreel.mp4`) | 10093:183 | Figma |
| | `home/HomePhilosophy` — "300 robotics companies" + bars (WebGL poster) | 10093:185 | Figma |
| | `home/HomeShowcase` — "What it took…" + photo with services | 10093:249 | Figma ("block 1") |
| | `home/HomeClients` — text + logo wall + stamps | 10093:577 | Figma (logo rows) |
| | `work/ProjectScroller` — project wheel (shared with /work) | 10093:1049 | Figma (cards) |
| | `home/HomeRadio` — Robo Radio teaser + posters | 10093:1424 | Figma |
| | `home/HomeNews` — news row (`news` collection) | 10093:1889 | Figma |
| Work | `work/ProjectScroller` | 10100:11973 | cards, all projects |
| Project | `project/ProjectHero` — title, badge, intro + reveal image | 10100:12388, 10100:12374 | rules |
| | `project/ProjectSummary` (+ `ProjectTextRow`) — text + facts | 10100:12615 | rules |
| | `project/ProjectSections` — media rows (1–3 images) and text rows | 10100:12637 | rules |
| | `project/ProjectTestimonial` — quote + credits + stamp | 10100:12938 | rules |
| | `project/ProjectNext` — next project | 10100:13197 | rules |
| Services | `services/ServicesHero` | 10103:138 | rules |
| | `services/ServicesDevice` — device still (video later) | 10103:211 | needs design |
| | `services/ServiceBlock` ×3 — branding / interface / video production | 10103:212 / 267 / 304 | rules |
| | `services/ServicesBuilding` — "Building toward yes" + logos | 10103:1223 | rules |
| Team | `team/TeamField` — objects field (WebGL poster) + 9 cards via `#id` | 10104:170, 10104:555 | needs design |
| Careers | `careers/CareersHero` — title, stamps, text, photo strip | 10100:14718 | needs design |
| | `careers/CareersValues` — values + robot (WebGL poster), tab 01 active | 10100:14871 | rules |
| | `careers/CareersPositions` — list from `positions` | 10100:14936 | rules |
| Position | `position/PositionHero` | 10102:146 | rules |
| | `position/PositionDetails` | 10102:1315 | rules |
| Robo Radio | `radio/RadioTV` (variant hero) — TV poster + controls | 10105:275 | needs design |
| | `radio/RadioIntro` | 10105:306 | rules |
| | `radio/RadioClips` — Humanoids + 2 clips | 10105:432 | rules |
| | `radio/RadioCollage` — 3×3 posters | 10105:481 | needs design |
| | `radio/RadioInvite` — "Pull up a chair" | 10105:971 | rules |
| | `radio/RadioEpisodes` — list from `episodes` | 10105:985 | rules |
| | `radio/RadioGuests` — guest logos | 10105:1064 | rules |
| Episode | `episode/EpisodeHero` | 10105:2720 | rules |
| | `episode/EpisodeText` ×2 + `radio/RadioTV` (variant episode) | 10105:2815, 10105:2825 | rules |
| Contact | `contact/ContactFlow` — 7 screens via `:target` | 10093:10195 … 10721 | needs design |
| | `contact/Receipt` — receipt artwork | 10099:11845 | rules |

**Mobile:** *Figma* = built from the 390 frame · *rules* = follows the Home mobile
rules (one column, 16 margins, Home spacing) · *needs design* = placeholder until
there's a mobile frame.

## Content (CMS-ready)

Collections in `src/content/` (schemas in `src/content.config.ts`). Each entry is a
JSON file; adding a file adds a page or row.

| Collection | Fields | Used by |
|---|---|---|
| `projects` | name, intro, services, reveal, summary, facts, sections (media / text), testimonial, credits, next, order | `/work/[slug]` |
| `team` | name, nameJa, role, quote, photo, object (which field object opens the card), order | `/team` |
| `positions` | title, location, hours, type, intro, workOn, bring, howWeWork, applySteps, stamp, order | `/careers`, `/careers/[slug]` |
| `episodes` | title, number, guest, guestLine, description, portfolioUrl, cover, poster, listed, order | `/robo-radio`, `/robo-radio/[slug]` |
| `news` | text, image, size (wide / narrow), href, order | Home news row |

## Assets

- **Graphics are SVG only** (logos, icons, stamps, micrographics). Export from Figma
  with text outlined, run `npm run svg`, compare with the original at 4× zoom.
  Never remove `id`s (masks depend on them).
- **Photos** are 2× PNG exports in `src/assets/`, served as WebP by `astro:assets`.
- **The one orange:** recolor any other orange in an exported SVG to `#FF6B03`.

## Open items

- Showreel video file (`public/videos/showreel.mp4`) — waiting for the file.
- Mobile designs needed: Team field, Robo Radio TV, Contact, Careers hero, Services device image, poster collage, Project hero.
- Real social links (`src/data/site.ts`).
- Placeholder copy in Figma: Team (Paulina, Greg quotes; Alex's names swapped); episode rows share one description.
- Heavy SVGs to simplify with the designer: approved stamp (~965 KB), department stamp (~738 KB), logo rows (~990 KB), menu micrographic (~518 KB). Bedrock logo only exists as PNG.
- Motion step: menu reveal, project wheel scroll, news carousel, value tabs, contact form logic and copy-email.

---

## Rules

- **Text styles:** only `.t-h1 .t-h2 .t-h3 .t-body .t-button` (+ `.t-body2-mobile`).
- **Tokens only:** no raw hex colors or font sizes in blocks. Add missing values to `tokens.css` first.
- **Sizes:** desktop sizes as `calc(N * var(--px))`; mobile in plain px at the end of the block.
- **One block = one file.** Figma node link in a comment at the top of the file.
- **Graphics are SVG only**; photos and video stay raster.
- **WebGL and video** areas use `WebGLSlot` / `VideoSlot`, so the layout never waits for 3D or video.
- **No JS for layout.** Static states use CSS (`:target` for team cards and contact steps).
  The only script is the menu toggle in `NavPill`.

## How we work

- `main` is the working, deployable version — don't commit to it directly.
- Start each task on its own branch: `git checkout -b feature/short-description`.
- Push the branch and open a Pull Request on GitHub for review.
- Before starting new work, update: `git checkout main && git pull`.
