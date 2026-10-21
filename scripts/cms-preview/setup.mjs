// Builds a local copy of the CMS (/admin) that you can open and screenshot without signing in to GitHub.
// See docs/cms.md. Usage, from the repo root:
//   node scripts/cms-preview/setup.mjs [folder]                     → demo mode: real content, no sign-in, saves stay in the browser
//   node scripts/cms-preview/setup.mjs [folder] --github owner/repo → real GitHub repo (e.g. a sandbox), sign in with a token
// Then serve the folder:  python3 -m http.server 4399 --directory <folder>   and open http://localhost:4399/admin/index.html
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, symlinkSync, rmSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const args = process.argv.slice(2);
const githubRepo = args.includes("--github") ? args[args.indexOf("--github") + 1] : null;
const out = resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--github") ?? "/tmp/cyberheaven-cms-preview");
const repo = resolve(import.meta.dirname, "../..");
const admin = join(out, "admin");
const link = (target, path) => { rmSync(path, { force: true, recursive: false }); symlinkSync(target, path); };

// preview.css, youtube.mjs, content-rules.mjs and the "Start here" and "Content health" pages are built by Astro (src/pages/admin)
console.log("Building the site…");
execSync("npm run build", { cwd: repo, stdio: "ignore" });

mkdirSync(admin, { recursive: true });
for (const dir of ["src", "public"]) link(join(repo, dir), join(out, dir));
for (const dir of ["media", "assets"]) link(join(repo, "public", dir), join(out, dir));
link(join(repo, "dist/_astro"), join(out, "_astro")); // fonts used by the "Start here" page
for (const file of ["theme.css", "logo.webp", "cms.js"]) link(join(repo, "public/admin", file), join(admin, file));
for (const file of ["preview.css", "youtube.mjs", "content-rules.mjs", "start", "health"]) link(join(repo, "dist/admin", file), join(admin, file));

// The same Sveltia version as the real CMS, saved locally
const page = readFileSync(join(repo, "public/admin/index.html"), "utf8");
const cdn = page.match(/https:\/\/unpkg\.com\/@sveltia\/cms@[\d.]+\/dist\/sveltia-cms\.js/)[0];
console.log(`Downloading ${cdn}…`);
writeFileSync(join(admin, "sveltia-cms.js"), await (await fetch(cdn)).text());

let config = readFileSync(join(repo, "public/admin/config.yml"), "utf8");
let index = page.replace(cdn, "sveltia-cms.js");
if (githubRepo) {
  config = config.replace(/^  repo: .*$/m, `  repo: ${githubRepo}`);
} else {
  // Demo mode: Sveltia's test backend loads the files listed in manifest.json and needs no sign-in.
  // It has no review workflow, so those settings go.
  config = config
    .replace(/^  name: github$/m, "  name: test-repo")
    .replace(/^  (repo|branch|open_authoring|auth_scope|base_url):.*\n/gm, "")
    .replace(/^publish_mode:.*\n/m, "");
  index = index.replace("<title>", '<link rel="cms-seed-url" href="/manifest.json">\n    <title>');
  const files = [];
  const walk = (dir) => { for (const name of readdirSync(dir)) { const path = join(dir, name); statSync(path).isDirectory() ? walk(path) : files.push(relative(repo, path)); } };
  for (const dir of ["src/content", "src/data", "public/media"]) walk(join(repo, dir));
  writeFileSync(join(out, "manifest.json"), JSON.stringify({ files }));
}
writeFileSync(join(admin, "config.yml"), config);
writeFileSync(join(admin, "index.html"), index);

console.log(`Ready (${githubRepo ? `GitHub repo ${githubRepo}: sign in with a token` : "demo mode: click Start Demo"}).
Serve it:  python3 -m http.server 4399 --directory ${out}
Open:      http://localhost:4399/admin/index.html
config.yml is a copy: run this again after changing public/admin/config.yml or src/pages/admin.`);
