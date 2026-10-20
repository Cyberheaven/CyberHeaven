import data from "../content/site.json";
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
  return all.sort((a, b) => Number(a.data.alumni) - Number(b.data.alumni) || a.data.name.localeCompare(b.data.name, "en", { sensitivity: "base" }));
}

export async function getPages() {
  return getCollection("pages");
}
