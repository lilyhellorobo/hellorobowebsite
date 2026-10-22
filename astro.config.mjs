// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Pages are fully static for now; the CMS hook-up comes later.
  output: 'static',
  devToolbar: { enabled: false },
});
