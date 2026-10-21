// Run: node scripts/check-data.mjs — checks the content fits together:
// - every category, topic and role used exists in src/data/categories.json (renaming one there doesn't rename
//   it where it's used, and a resource or glossary term with an unknown category disappears from its page)
// - no glossary term or resource link is listed twice
// - every field in the content files is in the CMS form (public/admin/config.yml): a field that isn't can't be
//   edited in the CMS, and a CMS save can lose it. Add it to config.yml (and src/content.config.ts for articles,
//   pages and people) together with the content.
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml"; // comes with Astro

let problems = 0;
const report = (message) => {
  console.log(message);
  problems++;
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const frontmatter = (path) => yaml.load(readFileSync(path, "utf8").split("\n---\n")[0].slice(4)) ?? {};
const markdown = (dir) => readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f}`);

// Categories, topics and roles
const categories = json("src/data/categories.json");
const known = (list, name, where) => {
  if (!categories[list].some((c) => c.name === name))
    report(`${where}: "${name}" isn't in src/data/categories.json → ${list} (CMS: Settings → Categories)`);
};
for (const path of markdown("src/content/articles")) known("articles", frontmatter(path).category, path);
for (const path of markdown("src/content/people")) for (const role of frontmatter(path).roles ?? []) known("roles", role, path);
for (const r of json("src/data/resources.json").items) known("resources", r.category, `src/data/resources.json, ${r.name}`);
for (const t of json("src/data/glossary.json").terms) known("glossary", t.category, `src/data/glossary.json, ${t.term}`);

// Listed twice
const once = (values, what) => {
  const seen = new Set();
  for (const v of values) {
    const key = v.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) report(`${what} "${v}" is listed twice`);
    seen.add(key);
  }
};
once(json("src/data/glossary.json").terms.map((t) => t.term), "src/data/glossary.json: term");
once(json("src/data/resources.json").items.map((r) => r.url), "src/data/resources.json: link");

// Content fields vs the CMS form
const notInForm = { "src/content/articles": ["draft"] }; // set by hand in the file, on purpose (see content.config.ts)
function inForm(fields, value, where, allowed = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, v] of Object.entries(value)) {
    const field = fields.find((f) => f.name === key);
    if (!field) {
      if (!allowed.includes(key)) report(`${where}: "${key}" isn't in the CMS form (public/admin/config.yml)`);
    } else if (field.fields) {
      for (const [i, item] of (Array.isArray(v) ? v : [v]).entries())
        inForm(field.fields, item, Array.isArray(v) ? `${where} → ${key} ${i + 1}` : `${where} → ${key}`);
    }
  }
}
const config = yaml.load(readFileSync("public/admin/config.yml", "utf8"));
for (const collection of config.collections) {
  if (collection.folder)
    for (const path of markdown(collection.folder)) inForm(collection.fields, frontmatter(path), path, notInForm[collection.folder]);
  for (const file of collection.files ?? [])
    inForm(file.fields, file.file.endsWith(".json") ? json(file.file) : frontmatter(file.file), file.file);
}

if (problems) process.exit(1);
console.log("data: ok");
