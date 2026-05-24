// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
// 注:v2 用了 inject-workflow.mjs 整合 CF Workflows;v3 走纯 Pages Functions streaming,
// 不引入 Workflows,所以 adapter 走默认 cloudflare(),不需要 hack。
export default defineConfig({
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
