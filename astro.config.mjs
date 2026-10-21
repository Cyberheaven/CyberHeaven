// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import youtube from "./src/lib/markdown-youtube.mjs";

export default defineConfig({
  output: "static",
  site: "https://cyberheaven.github.io", // GitHub Pages: docs/hosting.md
  // Styles go into the page itself, so the first paint does not wait for a stylesheet request.
  build: { inlineStylesheets: "always" },
  // sitemap-index.xml for search engines; the 404 page and the CMS pages (/admin/…) are left out.
  // Old addresses of pages that moved, so existing links keep working.
  redirects: {
    "/privacy": "/legal#privacy",
    "/terms": "/legal#terms",
    "/cookies": "/legal#cookies",
  },
  // YouTube embeds and links in Markdown become the site's own video player.
  markdown: { processor: satteri({ hastPlugins: [youtube] }) },
  integrations: [sitemap({ filter: (page) => !/\/(404\/?|admin\/.*)$/.test(page) })],
});
