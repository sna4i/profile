// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://yuya4i.github.io',
  base: '/yuya',
  vite: {
    plugins: [tailwindcss()],
  },
});
