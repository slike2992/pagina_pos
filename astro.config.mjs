// @ts-check
import { defineConfig } from 'astro/config';
import { publicLocalPayment } from './scripts/public-local-payment.mjs';

export default defineConfig({
  site: 'https://cripton.com.co',
  devToolbar: { enabled: false },
  integrations: [publicLocalPayment()],
  // Astro applies these headers only to its local dev/preview servers.
  // Static production hosting needs its own response-header configuration.
  server: { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
});
