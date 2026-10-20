import data from "../content/site.json";
import { getCollection } from "astro:content";

export const site = data;

/** Published articles, newest first. */
export async function getArticles() {
  const all = await getCollection("articles", (a) => !a.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPages() {
  return getCollection("pages");
}
