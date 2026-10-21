// Prints every CSS rule in the running CMS (Sveltia's nested rules included) whose text contains the given
// words: the way to find which Sveltia rule beats one in theme.css. Usage: node scripts/cms-preview/find-css.mjs "width: 50%"
import { openCms } from "./open.mjs";

const needle = process.argv[2];
if (!needle) throw new Error('Usage: node scripts/cms-preview/find-css.mjs "<text to look for>"');
const { browser, page } = await openCms("chrome");
const rules = await page.evaluate((text) => {
  const found = [];
  for (const sheet of document.styleSheets) {
    try { for (const rule of sheet.cssRules) if (rule.cssText.includes(text)) found.push(rule.cssText); } catch {}
  }
  return found;
}, needle);
console.log(rules.join("\n\n---\n\n") || "No rule contains that text.");
await browser.close();
