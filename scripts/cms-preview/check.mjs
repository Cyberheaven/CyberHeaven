// Checks the CMS behaviour that public/admin/cms.js, config.yml and theme.css add on top of Sveltia, in Chrome
// and Firefox. Run it after updating Sveltia or changing those files. Uses the demo (setup.mjs without --github).
// Usage: node scripts/cms-preview/check.mjs   → prints PASS/FAIL per check, exits with 1 if anything failed
import { openCms, goTo, wait } from "./open.mjs";

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};
const hashOf = (page) => new URL(page.url()).hash;

for (const browserName of ["chrome", "firefox"]) {
  console.log(`\n${browserName}`);
  const { browser, page } = await openCms(browserName, { width: 1024, height: 768 });
  let acceptLeave = false;
  page.on("dialog", (dialog) => (acceptLeave ? dialog.accept() : dialog.dismiss()));

  // cms.js: a first visit opens the "Start here" guide
  check("first visit opens Start here", hashOf(page) === "#/pages/start", hashOf(page));

  // cms.js: the logo's name for screen readers starts with what it shows
  await goTo(page, "#/collections/articles");
  const logoName = await page.$eval('[aria-label="Global"] button:has(> img.logo)', (b) => b.getAttribute("aria-label"));
  check("logo is named CyberHeaven", logoName.startsWith("CyberHeaven"), logoName);

  // theme.css: the logo, the switches and the search box fit side by side at laptop width
  const overlap = await page.evaluate(() => {
    const right = (s) => document.querySelector(s).getBoundingClientRect().right;
    const left = (s) => document.querySelector(s).getBoundingClientRect().left;
    return right('[aria-label="Switch Page"]') - left('[aria-label="Global"] .search-bar');
  });
  check("top bar items don't overlap at 1024px", overlap <= 0, `${Math.round(overlap)}px`);

  // cms.js: ← asks before throwing away unsaved changes
  await goTo(page, "#/collections/articles/entries/a-beginners-guide-to-malware-analysis");
  await page.click('section.field[data-key-path="title"] input');
  await page.keyboard.type(" (unsaved)");
  await wait(500);
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(800);
  check("← with unsaved changes asks, Cancel stays", hashOf(page).includes("/entries/"), hashOf(page));
  acceptLeave = true;
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(1200);
  check("← with unsaved changes asks, OK leaves", !hashOf(page).includes("/entries/"), hashOf(page));

  // cms.js: ⋮ → Clear All asks first; Cancel keeps the fields
  acceptLeave = false;
  await goTo(page, "#/collections/articles/entries/a-beginners-guide-to-malware-analysis");
  await page.click('[role="toolbar"][aria-label="Primary"] button[aria-label="Show Editor Options"]');
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === "Clear All").click());
  await wait(800);
  const title = await page.$eval('section.field[data-key-path="title"] input', (i) => i.value);
  check("Clear All asks, Cancel keeps the fields", title !== "", title);

  // config.yml: a new article's date is today; cms.js: its preview shows where the title goes
  await goTo(page, "#/collections/articles/new");
  const date = await page.$eval('section.field[data-key-path="date"] input', (i) => i.value);
  check("new article date defaults to today", date === new Date().toISOString().slice(0, 10), date);
  let previewText = "";
  for (const frame of page.frames()) previewText += await frame.evaluate(() => document.body?.innerText ?? "").catch(() => "");
  check("new article preview shows 'Start with a title'", previewText.includes("Start with a title"));

  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
