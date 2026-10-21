// Screenshots of every main CMS view, in Chrome and Firefox, desktop and phone. Look through them after any
// change to public/admin (theme.css, cms.js, config.yml) or after updating Sveltia.
// Usage: node scripts/cms-preview/shoot.mjs [outDir]   (TOKEN=... to sign in to a GitHub repo instead of the demo)
import { mkdirSync } from "node:fs";
import { openCms, goTo } from "./open.mjs";

const out = process.argv[2] ?? "/tmp/cyberheaven-cms-shots";
mkdirSync(out, { recursive: true });
const views = {
  "articles": "#/collections/articles",
  "article-editor": "#/collections/articles/entries/a-beginners-guide-to-malware-analysis",
  "new-article": "#/collections/articles/new",
  "pages": "#/collections/pages",
  "home-page-editor": "#/collections/pages/entries/home",
  "team": "#/collections/people",
  "settings": "#/collections/settings/entries/site",
  "lab-exercise": "#/collections/interactive/entries/decode",
  "assets": "#/assets",
  "start-here": "#/pages/start",
};

for (const browserName of ["chrome", "firefox"]) {
  for (const [width, height, device] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
    const name = `${out}/${browserName}-${device}`;
    const { browser, page } = await openCms(browserName, { width, height, signInShot: `${name}-sign-in.png` });
    for (const [view, hash] of Object.entries(views)) {
      await goTo(page, hash);
      await page.screenshot({ path: `${name}-${view}.png` });
    }
    await browser.close();
  }
}
console.log(`Screenshots in ${out}/`);
