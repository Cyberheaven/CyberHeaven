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

  // cms.js: the delete confirm focuses Cancel (so Enter doesn't delete) and names the entry
  await page.keyboard.press("Escape"); // the ⋮ menu is still open from Clear All
  await wait(400);
  await page.click('[role="toolbar"][aria-label="Primary"] button[aria-label="Show Editor Options"]');
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === "Delete").click());
  await wait(800);
  const confirmDelete = await page.evaluate(() => ({
    focus: document.activeElement?.dataset.label,
    text: document.querySelector('dialog[role="alertdialog"] [id$="-body"]')?.textContent.trim(),
  }));
  check("delete confirm focuses Cancel", confirmDelete.focus === "Cancel", confirmDelete.focus);
  check("delete confirm names the entry", confirmDelete.text?.includes("Malware Analysis"), confirmDelete.text);
  await page.keyboard.press("Escape");

  // theme.css: a field's ⋮ menu is faint until the field is hovered
  const faint = await page.$eval('section.field[data-key-path="category"] button[aria-label="Show Field Options"]', (b) => getComputedStyle(b).opacity);
  check("field ⋮ menu is faint", faint === "0.5", faint);

  // cms.js + theme.css: on a phone the editor bar still shows the entry's title
  await page.setViewport({ width: 390, height: 844 });
  await wait(1000);
  const phoneTitle = await page.evaluate(() => {
    const spacer = document.querySelector('[role="toolbar"][aria-label="Primary"] > .inner > .spacer');
    return spacer && getComputedStyle(spacer, "::before").content;
  });
  check("phone editor bar shows the title", phoneTitle?.includes("Malware Analysis"), phoneTitle);
  await page.setViewport({ width: 1024, height: 768 });

  // cms.js + theme.css: an untouched new article has no "unsaved" ring, and ← leaves without asking
  await goTo(page, "#/collections/articles/new");
  const ring = await page.$eval('[role="toolbar"][aria-label="Primary"] button[data-label="Save"]', (b) => getComputedStyle(b, "::after").opacity);
  check("empty new article: no unsaved ring", ring === "0", ring);
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(800);
  check("empty new article: ← leaves without asking", !hashOf(page).includes("/new"), hashOf(page));

  // config.yml: a new article's date is today; cms.js: its preview shows where the title goes
  await goTo(page, "#/collections/articles/new");
  const date = await page.$eval('section.field[data-key-path="date"] input', (i) => i.value);
  check("new article date defaults to today", date === new Date().toISOString().slice(0, 10), date);
  let previewText = "";
  for (const frame of page.frames()) previewText += await frame.evaluate(() => document.body?.innerText ?? "").catch(() => "");
  check("new article preview shows 'Start with a title'", previewText.includes("Start with a title"));

  // cms.js + theme.css: only maintainers see Pages and Settings in the sidebar. The demo has no GitHub sign-in, so
  // this gives it a pretend token and answers GitHub's "what may this person do" request itself.
  // The pretend answer is the "check-permissions" item in localStorage.
  await page.evaluateOnNewDocument(() => {
    const realFetch = window.fetch;
    window.fetch = (url, options) => String(url).startsWith("https://api.github.com/repos/")
      ? Promise.resolve(new Response(`{"permissions":${localStorage.getItem("check-permissions")}}`))
      : realFetch(url, options);
  });
  await page.evaluate(() => localStorage.setItem("sveltia-cms.user", JSON.stringify({ ...JSON.parse(localStorage.getItem("sveltia-cms.user")), token: "demo" })));
  const sidebar = () => page.$$eval('[aria-label="Collection List"] [role="treeitem"]', (items) => items.filter((i) => i.offsetParent).map((i) => i.dataset.label).join(", "));
  for (const [level, perms, expected] of [
    ["volunteer", { push: true }, "Articles, Team members, Resource list, Glossary, Lab exercises"],
    ["maintainer", { push: true, maintain: true }, "Articles, Pages, Team members, Resource list, Glossary, Lab exercises, Settings"],
  ]) {
    await page.evaluate((p) => localStorage.setItem("check-permissions", p), JSON.stringify(perms));
    await goTo(page, "#/collections/articles");
    await page.reload(); // cms.js asks GitHub once per sign-in; a reload is a fresh start
    await wait(3000);
    const shown = await sidebar();
    check(`${level} sidebar`, shown === expected, shown);
  }

  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
