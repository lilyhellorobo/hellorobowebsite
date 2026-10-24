# Fonts

Add the licensed Alliance No.2 web fonts here:

- `AllianceNo2-Regular.woff2`
- `AllianceNo2-Regular.woff` (optional)

The CMS (`/admin`) uses Medium: add `AllianceNo2-Medium.woff2` too (loaded by
`src/cms/admin.css`; without it the CMS uses the installed font, or Helvetica).

They are loaded by `src/styles/fonts.css`. After adding them, uncomment the
preload line in `src/layouts/BaseLayout.astro`.
