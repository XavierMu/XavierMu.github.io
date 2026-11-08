// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// 部署到 https://xaviermu.github.io （用户站点，根路径）
export default defineConfig({
  site: 'https://xaviermu.github.io',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: false,
    },
  },
  build: {
    format: 'directory',
  },
});
