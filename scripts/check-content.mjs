// Run: node scripts/check-content.mjs — finds content that isn't safe to publish, and Markdown that the CMS
// editor (Sveltia) changes or breaks when someone edits and saves the page there. The rules for Markdown bodies are
// in src/lib/content-rules.mjs (the CMS's "Before you submit" card uses them too); why they matter is explained there.
// Also: every article's cover has alt text, no article still has the CMS's starting outline notes, and no content uses the old @cyberheaven.eu email addresses (the
// project's address is cyberheavenhq@proton.me).
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml"; // comes with Astro
import { bodyProblems, outlineMark, runsCode } from "../src/lib/content-rules.mjs";

// Safety rule for every text value in frontmatter and JSON: no links that run code
function unsafeValues(value, file, field = "") {
  if (typeof value === "string" && runsCode(value)) report(`${file}: ${field} "${value.slice(0, 40)}" would run code, not open a page`);
  else if (value && typeof value === "object")
    for (const [key, v] of Object.entries(value)) unsafeValues(v, file, field ? `${field}.${key}` : key);
}

function oldEmails(text, file) {
  for (const [email] of text.matchAll(/[\w.+-]+@cyberheaven\.eu\b/gi)) report(`${file}: ${email} is an old address: use cyberheavenhq@proton.me`);
}

let problems = 0;
const report = (message) => {
  console.log(message);
  problems++;
};

for (const dir of ["articles", "people", "pages"]) {
  for (const file of readdirSync(`src/content/${dir}`).filter((f) => f.endsWith(".md"))) {
    const path = `src/content/${dir}/${file}`;
    const text = readFileSync(path, "utf8");
    const bodyStart = text.startsWith("---\n") ? text.indexOf("\n---\n", 4) + 5 : 0;
    const offset = text.slice(0, bodyStart).split("\n").length - 1;
    const data = bodyStart ? yaml.load(text.slice(4, bodyStart - 5)) : {};
    unsafeValues(data, path);
    if (dir === "articles" && data.cover && !data.coverAlt?.trim()) report(`${path}: the cover image has no alt text (coverAlt)`);
    if (text.includes(outlineMark)) report(`${path}: the starting outline's ${outlineMark} notes are still there: replace them with text`);
    oldEmails(text, path);
    for (const { line, message } of bodyProblems(text.slice(bodyStart))) report(`${path}:${offset + line}: ${message}`);
  }
}

for (const dir of ["src/content", "src/content/pages", "src/data"])
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const text = readFileSync(`${dir}/${file}`, "utf8");
    unsafeValues(JSON.parse(text), `${dir}/${file}`);
    oldEmails(text, `${dir}/${file}`);
  }

if (problems) process.exit(1);
console.log("content: ok");
