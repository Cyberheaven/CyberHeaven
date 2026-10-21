/*
 * CMS preview pane: shows an article or a team member the way the live site will.
 *
 * The preview uses the site's real stylesheets (/admin/preview.css, built from src/styles by
 * src/pages/admin/preview.css.ts) and the same markup and class names as the real pages:
 *   articles → src/pages/articles/[slug].astro
 *   people   → src/pages/team/[person].astro
 * If you change the markup of one of those pages, change it here too.
 *
 * Not shown in the preview: animations, the "On this page" list, comments, and interactive widgets
 * (they appear as a labelled box), because the site's scripts don't run here.
 *
 * Also adds "Interactive widget" to the article editor's Insert menu (registerEditorComponent below), the
 * "Start here" guide to the sidebar, and a "Before you submit" card at the top of the article preview.
 */
import { youtubeHtml, youtubeId } from "./youtube.mjs";
import { articleProblems } from "./content-rules.mjs";

const { React } = CMS;
const h = React.createElement;

CMS.registerPreviewStyle("/admin/preview.css");

// "Start here" in the sidebar: a short guide for volunteers (src/pages/admin/start.astro)
CMS.registerCustomPage({ id: "start", label: "Start here", icon: "waving_hand", url: "/admin/start/" });
// "Content health": small fixes across the live site, a to-do list for volunteers (src/pages/admin/health.astro)
CMS.registerCustomPage({ id: "health", label: "Content health", icon: "health_and_safety", url: "/admin/health/" });

// ---------- Small pieces shared by both templates ----------

const longDate = (s) => new Date(s).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });
const shortDate = (s) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = (s) => new Date(s).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// A title whose words rise in on the site (PageHead.astro); here they just sit still.
const words = (text) => (text || "").split(" ").flatMap((w, i) => [i > 0 && " ", h("span", { key: i, className: "phead-w" }, w)]);

const icons = { "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"], "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"] };
const Icon = ({ name, size = 18 }) =>
  h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    icons[name].map((d) => h("path", { key: d, d })));

// Same as components/Avatar.astro: a photo, or initials on a colour pair picked from the name.
function Avatar({ name = "", src, size, className }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const hash = [...name].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const a = (hash % 5) + 1;
  const b = ((hash >>> 3) % 5) + 1;
  const style = { "--size": `${size}px`, "--a": `var(--c${a})`, "--b": `var(--c${b === a ? (a % 5) + 1 : b})` };
  return h("span", { className: ["avatar", className].filter(Boolean).join(" "), style },
    src ? h("img", { src, alt: "", width: size, height: size }) : h("span", { "aria-hidden": true }, initials));
}

// What the site's Markdown plugin (lib/markdown-youtube.mjs) and article page do to the text, done
// to the preview after it's drawn: YouTube links and embeds become the site's player, and widget
// placeholders become a labelled box.
const widgetNames = { "soc-ladder": "SOC escalation ladder", "malware-explorer": "Malware family explorer" };
const widgetBox = (name) => `<div class="cms-widget"><strong>${widgetNames[name] || name}</strong>Interactive widget: it appears here on the live site.</div>`;
function siteMarkup(root) {
  for (const p of root.querySelectorAll("p")) {
    const only = p.children.length === 1 && p.textContent.trim() === p.children[0].textContent.trim() ? p.children[0] : null;
    const id = only?.tagName === "A" && youtubeId(only.href);
    if (id) p.outerHTML = youtubeHtml(id, /^https?:/.test(only.textContent.trim()) ? "" : only.textContent);
  }
  for (const frame of root.querySelectorAll("iframe")) {
    const id = youtubeId(frame.src);
    if (id) frame.outerHTML = youtubeHtml(id, frame.title);
  }
  for (const w of root.querySelectorAll("[data-widget]")) w.outerHTML = widgetBox(w.dataset.widget);
}

// In the article editor, a widget is a block with a picker ("Interactive widget" in the + menu), not a
// line of HTML that looks like a typo. It's saved as the same line the site looks for.
CMS.registerEditorComponent({
  id: "widget",
  label: "Interactive widget",
  icon: "widgets",
  fields: [{ name: "name", label: "Widget", widget: "select", options: Object.entries(widgetNames).map(([value, label]) => ({ value, label })) }],
  pattern: /^<div data-widget="([\w-]+)"><\/div>$/m,
  fromBlock: (match) => ({ name: match[1] }),
  toBlock: ({ name }) => `<div data-widget="${name}"></div>`,
  toPreview: ({ name }) => widgetBox(name),
});

// The Markdown body as Sveltia draws it, kept in the site's markup. Sveltia wraps the text in a few
// extra boxes, so the "prose" class goes on the innermost one: the site's spacing rules (".prose > *")
// then apply exactly as on the live page.
function Prose({ widget, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const update = () => {
      let inner = root;
      while (inner.children.length === 1 && inner.firstElementChild.matches("div:not([data-widget], .cms-widget), section")) inner = inner.firstElementChild;
      if (!inner.classList.contains("prose")) inner.classList.add("prose"); // adding it again would wake the observer forever
      siteMarkup(inner);
    };
    update();
    const watch = new MutationObserver(update);
    watch.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);
  return h("div", { ref, className }, widget);
}

// Other saved entries (an article's author, a person's articles): null while they load.
function useLoaded(load, deps) {
  const [value, setValue] = React.useState(null);
  React.useEffect(() => {
    let current = true;
    setValue(null);
    load().then((v) => current && setValue(v ?? null), () => {});
    return () => { current = false; };
  }, deps);
  return value;
}

// ---------- "Before you submit": what to fix before an article goes live ----------

const quoted = (line) => (line.length > 60 ? `${line.slice(0, 60)}…` : line);

// The rules are in lib/content-rules.mjs, shared with the pull request checks and the "Content health" page.
function Checklist({ entry, getCollection }) {
  const live = useLoaded(async () => ({
    // Like the site: hidden articles and files starting with _ have no page
    articles: (await getCollection("articles")).filter((a) => !a.get("data").get("draft") && !a.get("slug").startsWith("_")).map((a) => a.get("slug")),
    team: (await getCollection("people")).map((p) => p.get("slug")).filter((id) => !id.startsWith("_")),
  }), []);
  const found = articleProblems(entry.get("data").toJS(), live);
  if (entry.getIn(["data", "draft"])) found.push({ text: "Hide from the site is on: this article won't appear on the site." });
  return h("aside", { className: "shell", "aria-label": "Before you submit" },
    h("div", { className: "cms-check", "data-ok": found.length ? null : "" },
      h("p", { className: "body-sb" }, found.length ? `Before you submit: ${found.length} to fix` : "Before you submit: nothing to fix"),
      found.length > 0 && h("ul", null, found.map((f, i) => h("li", { key: i }, f.text, f.quote && h("code", null, quoted(f.quote)))))));
}

// ---------- How the article shows up in Google and when shared ----------

// The article page's <title> is "Title | CyberHeaven" and its description is the excerpt (layouts/Base.astro).
// Shared links use the site's own image (/assets/og.jpg), not the cover. Google cuts titles at about 60
// characters and descriptions at about 160.
const cut = (text, max) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);
function SearchCard({ title, excerpt, slug }) {
  const pageTitle = `${title || "Title"} | CyberHeaven`;
  const count = (label, n, max) => h("span", { "data-over": n > max ? "" : null }, `${label} ${n}/${max}`);
  return h("aside", { className: "shell cms-search", "aria-label": "In Google and when shared" },
    h("p", { className: "caption" }, "In Google · ", count("title", pageTitle.length, 60), " · ", count("excerpt", excerpt.length, 160)),
    h("div", { className: "cms-google" },
      h("p", { className: "cms-url" }, `cyberheaven.github.io › articles › ${slug || "…"}`),
      h("p", { className: "cms-title" }, cut(pageTitle, 60)),
      h("p", null, cut(excerpt, 160) || "No excerpt: Google picks some text from the page.")),
    h("p", { className: "caption" }, "When the link is shared"),
    h("div", { className: "cms-share" },
      h("img", { src: "/assets/og.jpg", alt: "" }),
      h("div", null,
        h("p", { className: "cms-url" }, "cyberheaven.github.io"),
        h("p", { className: "cms-title" }, pageTitle),
        h("p", null, cut(excerpt, 110)))));
}

// ---------- Article: src/pages/articles/[slug].astro ----------

function ArticlePreview({ entry, widgetFor, getAsset, getCollection }) {
  const get = (key) => entry.getIn(["data", key]);
  const title = get("title");
  const date = get("date");
  const cover = get("cover");
  const tags = get("tags")?.toJS?.() ?? [];
  const body = get("body") || "";
  const minutes = Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200));
  const authorId = get("author");
  // A new article has no author yet (an empty string), which would break the whole preview
  const author = useLoaded(async () => (authorId ? (await getCollection("people", authorId))?.get("data") : null), [authorId]);
  const name = author?.get("name") || authorId || "";
  // ponytail: only the bio's first paragraph, with links/emphasis stripped; the card shows 3 lines of it anyway
  const bio = (author?.get("body") || "").trim().split(/\n\s*\n/)[0].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");

  return h("main", null,
    h(Checklist, { entry, getCollection }),
    h("article", null,
      h("header", { className: "phead shell post-head" },
        // A new article has no title yet: show where it will go instead of an empty pane
        h("h1", { className: "h1 balance phead-title", style: title ? null : { opacity: 0.4 } }, words(title || "Start with a title")),
        h("div", { className: "phead-extra" },
          h("p", { className: "post-meta body" },
            get("category") && h("a", { href: "/articles" }, get("category")),
            date && h("time", null, longDate(date)),
            name && h("a", { href: "/team" }, `By ${name}`),
            body.trim() && h("span", null, `${minutes} min read`)))), // not on an article with no text yet
      cover && h("div", { className: "shell post-cover" },
        h("div", { className: "post-cover-clip" }, h("img", { src: String(getAsset(cover) ?? cover), alt: get("coverAlt") || "" }))),
      h("div", { className: "shell post-layout" },
        h("aside", { className: "post-aside" },
          tags.length > 0 && h("ul", { className: "tag-list", "aria-label": "Tags" }, tags.map((t) => h("li", { key: t }, h("a", { href: "/articles" }, t))))),
        h("div", { className: "post-main" },
          h(Prose, { widget: widgetFor("body") }),
          name && h("aside", { className: "author-card", "aria-label": "About the author" },
            h("a", { href: "/team", className: "author-card-who" },
              h(Avatar, { name, src: author?.get("avatar"), size: 64 }),
              h("span", null,
                h("span", { className: "caption muted" }, "Written by"),
                h("span", { className: "h4" }, name),
                author?.get("headline") && h("span", { className: "body muted" }, author.get("headline")))),
            bio && h("div", { className: "body muted author-card-bio" }, h("p", null, bio)),
            h("a", { className: "text-link body-sb", href: "/team" }, "View profile", h(Icon, { name: "arrow-right" })))))),
    h(SearchCard, { title, excerpt: (get("excerpt") || "").trim(), slug: entry.get("slug") }));
}

// ---------- Team member: src/pages/team/[person].astro ----------

function PersonPreview({ entry, widgetFor, getAsset, getCollection }) {
  const get = (key) => entry.getIn(["data", key]);
  const name = get("name") || "";
  const avatar = get("avatar");
  const roles = get("roles")?.toJS?.() ?? [];
  const links = (get("links")?.toJS?.() ?? []).filter((l) => l.label && l.url);
  const headline = get("headline");
  const pronouns = get("pronouns");
  const id = entry.get("slug");
  // Their live articles, newest first (like getArticles() in lib/site.ts)
  const written = useLoaded(async () => (await getCollection("articles"))
    .map((a) => ({ id: a.get("slug"), ...a.get("data").toJS() }))
    .filter((a) => id && a.author === id && !a.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date))), [id]) ?? [];

  return h("main", null,
    h("section", { className: "shell pf" },
      h("div", { className: "pf-side" },
        h(Avatar, { name, src: avatar && String(getAsset(avatar) ?? avatar), size: 240, className: "pf-avatar" }),
        links.length > 0 && h("ul", { className: "pf-links" },
          links.map((l, i) => h("li", { key: i }, h("a", { href: l.url }, h("span", { className: "body-sb" }, l.label), h(Icon, { name: "arrow-up-right" })))))),
      h("div", { className: "pf-main" },
        h("h1", { className: "h1 balance phead-title" }, words(name)),
        (headline || pronouns) && h("p", { className: "phead-lead" }, headline, headline && pronouns && " · ", pronouns && h("span", null, pronouns)),
        h("div", { className: "phead-extra pf-facts" },
          roles.length > 0 && h("p", { className: "pf-roles" }, roles.map((r) => h("a", { key: r, className: "tag", href: "/team" }, r))),
          h("dl", { className: "pf-meta" },
            get("alumni") && h("div", null, h("dt", null, "Status"), h("dd", null, "Past member, with thanks")),
            get("location") && h("div", null, h("dt", null, "Based in"), h("dd", null, get("location"))),
            get("joined") && h("div", null, h("dt", null, "With CyberHeaven since"), h("dd", null, monthYear(get("joined")))),
            written.length > 0 && h("div", null, h("dt", null, "Articles"), h("dd", null, written.length)))),
        (get("body") || "").trim() && h(Prose, { widget: widgetFor("body"), className: "pf-bio" }))),
    written.length > 0 && h("section", { className: "shell pf-articles" },
      h("h2", { className: "h3" }, `Articles by ${name.split(" ")[0]}`),
      h("ul", { className: "latest-grid" }, written.map((a) => h("li", { key: a.id, className: "sf" },
        h("a", { className: "acard", href: `/articles/${a.id}` },
          h("div", { className: "acard-media" }, h("img", { src: a.cover, alt: a.coverAlt || "" })),
          h("p", { className: "caption acard-meta" }, h("span", null, (a.category || "").toUpperCase()), h("time", null, shortDate(a.date))),
          h("h3", { className: "h4 balance" }, a.title),
          h("p", { className: "body muted acard-excerpt" }, a.excerpt)))))));
}

CMS.registerPreviewTemplate("articles", ArticlePreview);
CMS.registerPreviewTemplate("people", PersonPreview);

// ---------- Small fixes around Sveltia ----------

// Sveltia enables Save on a new entry before anything is typed, which lit the "unsaved" ring (theme.css) on an
// empty form. Until the first edit, body[data-fresh] is set: theme.css hides the ring and ← leaves without asking.
// ponytail: any click on a field counts as an edit (Sveltia's pickers don't all fire input events).
const markFresh = () => { document.body.dataset.fresh = /\/new$/.test(location.hash) ? "1" : ""; };
markFresh();
window.addEventListener("hashchange", markFresh);
for (const type of ["input", "change", "click"]) {
  document.addEventListener(type, (event) => {
    if (event.target.closest?.("section.field")) document.body.dataset.fresh = "";
  }, true);
}

// Pages and Settings are the site's structure, which only maintainers can publish, so everyone else doesn't see them
// in the sidebar (theme.css, under body[data-level="volunteer"]). This only tidies the sidebar: a direct link still
// opens them, and GitHub still decides what goes live. The level is the signed-in person's access to the repo, so
// writers, editors and contributors look the same here (telling writers and editors apart needs a wider sign-in).
// If GitHub can't be asked, everything stays visible.
let levelChecked = null;
async function setLevel() {
  let token = null;
  try { token = JSON.parse(localStorage.getItem("sveltia-cms.user"))?.token; } catch {}
  if (!token || token === levelChecked) return; // not signed in yet (or the demo), or already checked
  levelChecked = token;
  const repo = (await (await fetch("config.yml")).text()).match(/^\s+repo:\s*(\S+)/m)?.[1];
  const response = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return;
  const { permissions = {} } = await response.json();
  document.body.dataset.level = permissions.admin || permissions.maintain ? "maintainer" : "volunteer";
}
setLevel().catch(() => {});
window.addEventListener("hashchange", () => setLevel().catch(() => {})); // signing in changes the address

// Leaving an entry with ← while it has unsaved changes asks first: Sveltia would drop the changes without a word.
// Closing or reloading the tab asks too (the browser shows its own message).
// ponytail: the browser's Back button can't be stopped this way; add a hashchange guard if volunteers hit it.
const unsaved = () => !document.body.dataset.fresh && document.querySelector('[role="toolbar"][aria-label="Primary"] button[data-label="Save"][aria-disabled="false"]');
document.addEventListener("click", (event) => {
  if (event.target.closest?.('button[aria-label="Cancel Editing"]') && unsaved() && !confirm("Leave without saving? Your changes will be lost.")) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  // "Clear All" in the editor's ⋮ menu empties every field at once, also without asking
  if (event.target.closest?.('[role="menuitem"]')?.textContent.trim() === "Clear All" && !confirm("Clear every field in this entry?")) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
window.addEventListener("beforeunload", (event) => { if (unsaved()) event.preventDefault(); });

// Sveltia draws its own markup whenever it likes, so these checks run after each change to the page:
// - the logo reads "CyberHeaven" (theme.css), so its name for screen readers starts with that too;
// - a volunteer's first visit opens the "Start here" guide, once per browser;
// - Sveltia's delete confirm opens with focus on Delete (so Enter deletes) and doesn't say what goes: focus moves
//   to Cancel, and in the editor the question names the entry. (Deleting a team member who still has articles is
//   refused by Sveltia itself: it lists the articles and switches Delete off. check.mjs tests that.)
let seenStart = true;
try { seenStart = !!localStorage.getItem("ch-seen-start"); } catch {}
new MutationObserver(() => {
  document.querySelector('button[aria-label="Visit Live Site"]')?.setAttribute("aria-label", "CyberHeaven: visit the live site");
  // On phones the editor bar has no entry title: theme.css shows this one ("Articles › Title – CyberHeaven CMS")
  const spacer = document.querySelector('[aria-label="Content Editor"] [role="toolbar"][aria-label="Primary"] > .inner > .spacer');
  const title = document.title.replace(/ – .*$/, "").split(" › ").pop();
  if (spacer && spacer.dataset.title !== title) spacer.dataset.title = title;
  const confirmDelete = document.querySelector('dialog[role="alertdialog"][open]:has(button[data-label="Delete"]):not([data-checked])');
  if (confirmDelete) {
    confirmDelete.dataset.checked = "1"; // once per dialog: Sveltia makes a new one each time
    const title = document.querySelector('[role="toolbar"][aria-label="Primary"] h2 bdi:last-child')?.textContent;
    const body = confirmDelete.querySelector('[id$="-body"]');
    // Only Sveltia's text node is changed (not the element), so its own updates keep working
    const text = [...(body?.childNodes ?? [])].find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue.includes("delete this entry"));
    if (title && text) text.nodeValue = `Delete “${title}”? Every version stays on GitHub, so it can be brought back.`;
    setTimeout(() => confirmDelete.querySelector('button[data-label="Cancel"]')?.focus()); // after Sveltia focuses Delete
  }
  if (!seenStart && /^#\/collections(\/[\w-]+)?$/.test(location.hash)) {
    seenStart = true;
    try { localStorage.setItem("ch-seen-start", "1"); } catch {}
    location.hash = "#/pages/start";
  }
}).observe(document.documentElement, { childList: true, subtree: true }); // the whole page, so <title> changes count too
