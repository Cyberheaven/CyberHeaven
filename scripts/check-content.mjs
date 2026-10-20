// Run: node scripts/check-content.mjs — finds Markdown that the CMS editor (Sveltia) changes or breaks
// when someone edits and saves the page there. Tested against Sveltia 0.248.1.
import { readFileSync, readdirSync } from "node:fs";

const rules = [
  [/^ {1,3}([*+-]|\d+\.) /, "list starts indented: each CMS save indents it further until it becomes a code block. Remove the leading spaces"],
  [/^\s*<table/, "HTML table: the CMS escapes it as text. Use a Markdown table (| a | b |)"],
  [/^\s*<iframe/, "embed: paste the YouTube link on its own line instead, e.g. [Video title](https://www.youtube.com/watch?v=…)"],
  [/^\* \* \*$/, "'* * *' line: the CMS turns it into a bullet point. Use *** for a divider"],
  [/^\|.*`[^`]*\\[$<][^`]*`/, "backslash before $ or < in a table cell: the CMS drops it on save. Reword the cell"],
];

let problems = 0;
for (const dir of ["articles", "people", "pages"]) {
  for (const file of readdirSync(`src/content/${dir}`).filter((f) => f.endsWith(".md"))) {
    const path = `src/content/${dir}/${file}`;
    const text = readFileSync(path, "utf8");
    const bodyStart = text.startsWith("---\n") ? text.indexOf("\n---\n", 4) + 5 : 0;
    const offset = text.slice(0, bodyStart).split("\n").length - 1;
    let fence = false;
    text.slice(bodyStart).split("\n").forEach((line, i) => {
      if (line.startsWith("```")) fence = !fence;
      if (fence) return;
      for (const [pattern, message] of rules) {
        if (pattern.test(line)) {
          console.log(`${path}:${offset + i + 1}: ${message}`);
          problems++;
        }
      }
    });
  }
}
if (problems) process.exit(1);
console.log("content: ok");
