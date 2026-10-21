// Run: node scripts/check-content.mjs — finds content that isn't safe to publish, and Markdown that the CMS
// editor (Sveltia) changes or breaks when someone edits and saves the page there. Tested against Sveltia 0.250.0.
//
// Why the safety rules matter: the site shows HTML written in Markdown as-is, scripts included, and the site
// shares its address with the CMS, where everyone's sign-in is kept. So content may not contain HTML (except the
// interactive widget line) or links that run code (javascript:).
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml"; // comes with Astro

const rules = [
  [/^\s*<table/, "HTML table: the CMS escapes it as text. Use a Markdown table (| a | b |)"],
  [/^\s*<iframe/, "embed: paste the YouTube link on its own line instead, e.g. [Video title](https://www.youtube.com/watch?v=…)"],
  [/^\* \* \*$/, "'* * *' line: the CMS turns it into a bullet point. Use *** for a divider"],
];

// A link that runs code instead of opening a page. Browsers ignore spaces and line breaks inside the scheme.
const runsCode = (url) => /^(javascript|vbscript|data):/i.test(url.replace(/[\x00-\x20]/g, ""));

// Safety rules for one line of a Markdown body
function unsafe(line) {
  const prose = line
    .replace(/(`+)[^`][\s\S]*?\1/g, "") // `code` is shown as text, so anything goes there
    .replace(/\\</g, "")
    .replace(/<div data-widget="[a-z-]+"><\/div>/g, ""); // Insert → Interactive widget
  const found = [];
  if (/<\/?[a-z][a-z0-9-]*[\s>/]|<!--/i.test(prose))
    found.push("HTML: the site would show it as-is, scripts included. Use Markdown, or put code in `backticks`");
  const links = [
    ...prose.matchAll(/\]\(\s*<?([^\s)>]*)/g), // [text](link) and ![alt](image)
    ...prose.matchAll(/<([a-z][a-z0-9+.-]*:[^\s>]*)>/gi), // <https://…>
    ...prose.matchAll(/^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)/g), // [name]: link
  ].map((m) => m[1]);
  // & before the first / could spell javascript: in HTML codes, like &#106;avascript:
  for (const link of links)
    if (runsCode(link) || /^[^/?#]*&/.test(link)) found.push(`link "${link}" would run code, not open a page`);
  return found;
}

// Safety rule for every text value in frontmatter and JSON: no links that run code
function unsafeValues(value, file, field = "") {
  if (typeof value === "string" && runsCode(value)) report(`${file}: ${field} "${value.slice(0, 40)}" would run code, not open a page`);
  else if (value && typeof value === "object")
    for (const [key, v] of Object.entries(value)) unsafeValues(v, file, field ? `${field}.${key}` : key);
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
    if (bodyStart) unsafeValues(yaml.load(text.slice(4, bodyStart - 5)), path);
    let fence = false;
    text.slice(bodyStart).split("\n").forEach((line, i) => {
      if (line.startsWith("```")) fence = !fence;
      if (fence) return;
      const found = rules.filter(([pattern]) => pattern.test(line)).map(([, message]) => message);
      for (const message of found.length ? found : unsafe(line)) report(`${path}:${offset + i + 1}: ${message}`);
    });
  }
}

for (const dir of ["src/content", "src/content/pages", "src/data"])
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")))
    unsafeValues(JSON.parse(readFileSync(`${dir}/${file}`, "utf8")), `${dir}/${file}`);

if (problems) process.exit(1);
console.log("content: ok");
