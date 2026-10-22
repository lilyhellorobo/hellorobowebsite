// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  // Site pages are prerendered (static). Only the CMS under /admin renders on demand,
  // which is what the Node adapter is for (each admin page sets `prerender = false`).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
  security: {
    // Hosts the server trusts in the Host header. The CMS checks that form posts come
    // from the same origin, so the live domain has to be listed here.
    allowedDomains: [
      { hostname: 'hellorobo.co', protocol: 'https' },
      { hostname: 'www.hellorobo.co', protocol: 'https' },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  env: {
    schema: {
      // CMS login. Both live in the git-ignored .env (locally) or the host's env vars.
      // `npm run cms:user` manages them — see README "CMS".
      CMS_USERS: envField.string({ context: 'server', access: 'secret', optional: true }),
      CMS_SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
