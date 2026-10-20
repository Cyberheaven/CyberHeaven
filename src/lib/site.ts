import data from "../content/site.json";
import interactive from "../content/pages/interactive.json";
import categories from "../data/categories.json";
import { getCollection } from "astro:content";

// Site-wide settings (CMS: Settings → Site). Each page's own text lives in src/content/pages (CMS: Pages).
export const site = data;

/**
 * Fills {placeholders} in text from the CMS with numbers worked out when the site is built,
 * e.g. fill("{count} terms", { count: 162 }) gives "162 terms". Unknown placeholders are left as they are.
 */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in values ? String(values[key]) : m));
}

/** Small numbers as words ("Five ways in"), bigger ones as digits. */
export function countWord(n: number) {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
}

/**
 * A lab or tool from the Interactive page's list (src/content/pages/interactive.json), found by its link.
 * Its page uses the heading (or the title if there's none), intro and search engine text from there.
 */
export function tool(href: string) {
  const t = interactive.tools.find((t) => t.href === href);
  if (!t) throw new Error(`No tool links to ${href}. Add it in src/content/pages/interactive.json (CMS: Pages → Interactive).`);
  return { ...t, heading: t.heading || t.title };
}

/** Published articles, newest first. */
export async function getArticles() {
  const all = await getCollection("articles", (a) => !a.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Everyone in src/content/people, current members first, then by name. */
export async function getPeople() {
  const all = await getCollection("people", (p) => !p.id.startsWith("_"));
  // Roles marked "onlyOne" in categories.json (e.g. Founder) can belong to a single person.
  for (const role of categories.roles.filter((r) => "onlyOne" in r && r.onlyOne)) {
    const holders = all.filter((p) => p.data.roles.includes(role.name)).map((p) => p.data.name);
    if (holders.length > 1) throw new Error(`Only one person can be ${role.name}, but ${holders.join(" and ")} both are. Fix it in src/content/people.`);
  }
  return all.sort((a, b) => Number(a.data.alumni) - Number(b.data.alumni) || a.data.name.localeCompare(b.data.name, "en", { sensitivity: "base" }));
}

export async function getPages() {
  return getCollection("pages");
}
