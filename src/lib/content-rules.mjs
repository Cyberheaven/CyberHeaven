// Rules for a Markdown body, shared by scripts/check-content.mjs (pull request checks) and the CMS's
// "Before you submit" card (public/admin/cms.js, served by src/pages/admin/content-rules.mjs.ts).
// Tested against Sveltia 0.250.0.
//
// Why the safety rules matter: the site shows HTML written in Markdown as-is, scripts included, and the site
// shares its address with the CMS, where everyone's sign-in is kept. So content may not contain HTML (except the
// interactive widget line) or links that run code (javascript:).

// Markdown the CMS editor (Sveltia) changes or breaks when someone edits and saves the page there
const editorRules = [
  [/^\s*<table/, "HTML table: the CMS escapes it as text. Use a Markdown table (| a | b |)"],
  [/^\s*<iframe/, "embed: paste the YouTube link on its own line instead, e.g. [Video title](https://www.youtube.com/watch?v=…)"],
  [/^\* \* \*$/, "'* * *' line: the CMS turns it into a bullet point. Use *** for a divider"],
];

// A link that runs code instead of opening a page. Browsers ignore spaces and line breaks inside the scheme.
export const runsCode = (url) => /^(javascript|vbscript|data):/i.test(url.replace(/[\x00-\x20]/g, ""));

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

// Every problem in a Markdown body, as { line (1 = the body's first line), message }. Code blocks are skipped.
export function bodyProblems(body) {
  const problems = [];
  let fence = false;
  body.split("\n").forEach((text, i) => {
    if (text.startsWith("```")) fence = !fence;
    if (fence) return;
    const found = editorRules.filter(([pattern]) => pattern.test(text)).map(([, message]) => message);
    for (const message of found.length ? found : unsafe(text)) problems.push({ line: i + 1, message });
  });
  return problems;
}
