// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
// 注:v2 用了 inject-workflow.mjs 整合 CF Workflows;v3 走纯 Pages Functions streaming,
// 不引入 Workflows,所以 adapter 走默认 cloudflare(),不需要 hack。
export default defineConfig({
  // platformProxy.enabled = true 让 `npm run dev` 也能访问 wrangler.toml 里的
  // D1 / KV / R2 binding(走本地 .wrangler 模拟),不必切到 wrangler pages dev。
  // 注:@astrojs/cloudflare 13.2.2 的 type 定义未导出 platformProxy 字段,但 runtime 支持。
  adapter: cloudflare(/** @type {any} */ ({
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.toml'
    }
  })),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
