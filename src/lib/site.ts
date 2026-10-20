import data from "../content/site.json";
import categories from "../data/categories.json";
import { getCollection } from "astro:content";

export const site = data;

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
