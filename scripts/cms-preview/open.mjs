// Opens the local CMS preview (setup.mjs) in Chrome or Firefox and signs in: the demo, or a GitHub token when
// one is given. Shared by shoot.mjs and check.mjs. Needs `npm i --no-save puppeteer-core@23.11.1` (no browser
// download: it drives the Chrome and Firefox already installed; set CHROME / FIREFOX to their paths if needed).
import puppeteer from "puppeteer-core";

export const BASE = process.env.CMS_URL ?? "http://localhost:4399/admin/index.html";
export const wait = (ms) => new Promise((done) => setTimeout(done, ms));

const paths = { chrome: process.env.CHROME ?? "/usr/bin/google-chrome", firefox: process.env.FIREFOX ?? "/usr/bin/firefox" };

// Clicks the first button whose text matches (works the same in both browsers)
export const clickButton = (page, pattern) =>
  page.evaluate((source) => {
    const button = [...document.querySelectorAll("button")].find((b) => new RegExp(source, "i").test(b.textContent));
    button?.click();
    return !!button;
  }, pattern);

// signInShot: a file path to screenshot the sign-in screen to, before signing in
export async function openCms(browserName, { width = 1440, height = 900, token = process.env.TOKEN, signInShot } = {}) {
  const browser = await puppeteer.launch({ browser: browserName, executablePath: paths[browserName], headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE);
  await wait(3000);
  if (signInShot) await page.screenshot({ path: signInShot });
  if (token) {
    await clickButton(page, "Access Token");
    await wait(800);
    await page.type("input", token);
    await clickButton(page, "^\\s*Sign In\\s*$");
    await wait(8000);
  } else {
    await clickButton(page, "Start Demo");
    await wait(4000);
    await clickButton(page, "Get Started"); // the demo's welcome dialog
    await wait(1000);
  }
  return { browser, page };
}

export async function goTo(page, hash) {
  await page.goto(BASE + hash);
  await wait(3000);
}
