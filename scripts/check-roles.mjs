// Run on every pull request (.github/workflows/checks.yml): only maintainers may change team roles, so nobody else
// can make themselves "Maintainer" or "Founder" on the team page. Fails when a pull request changes a team member's
// roles (src/content/people/*.md, including a new person with roles) or the list of roles in Settings → Categories
// (src/data/categories.json) and whoever opened it isn't a maintainer (repo access admin or maintain).
// Env: AUTHOR (who opened the pull request), BASE (the commit to compare with, default origin/main),
// REPO (owner/name) and GH_TOKEN (to ask GitHub about AUTHOR). Without AUTHOR it only lists the changes.
// Run by hand: node scripts/check-roles.mjs
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml"; // comes with Astro

const { AUTHOR, REPO, GH_TOKEN, BASE = "origin/main" } = process.env;
const before = (path) => {
  try {
    return execSync(`git show ${BASE}:${path}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null; // a new file
  }
};
const roles = (markdown) => (markdown?.startsWith("---\n") ? yaml.load(markdown.slice(4, markdown.indexOf("\n---\n", 4)))?.roles : null) ?? [];
const list = (r) => (r.length ? r.join(", ") : "none");

const changes = [];
for (const file of readdirSync("src/content/people").filter((f) => f.endsWith(".md"))) {
  const path = `src/content/people/${file}`;
  const [was, now] = [roles(before(path)), roles(readFileSync(path, "utf8"))];
  if (JSON.stringify(was) !== JSON.stringify(now)) changes.push(`${path}: roles ${list(was)} → ${list(now)}`);
}
const roleList = (text) => JSON.stringify(text ? JSON.parse(text).roles : null);
if (roleList(before("src/data/categories.json")) !== roleList(readFileSync("src/data/categories.json", "utf8")))
  changes.push("src/data/categories.json: the list of roles (Settings → Categories → Roles)");

let maintainer = false;
if (AUTHOR) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/collaborators/${AUTHOR}/permission`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  const access = response.ok ? (await response.json()).role_name : `unknown (GitHub said ${response.status})`;
  maintainer = ["admin", "maintain"].includes(access);
  console.log(`${AUTHOR}'s access to the repo: ${access}`);
}

if (!changes.length) console.log("roles: ok (no role changes)");
else if (!AUTHOR || maintainer) console.log(`roles: ok, changed by ${AUTHOR ? "a maintainer" : "you (not checked)"}:\n${changes.join("\n")}`);
else {
  console.log(`Only maintainers can change team roles. Ask a maintainer to make this change, or undo it:\n${changes.join("\n")}`);
  process.exit(1);
}
