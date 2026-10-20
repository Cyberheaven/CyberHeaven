#!/usr/bin/env python3
"""Import the scraped WordPress site into Astro content collections.

Usage: python3 -I scripts/import-wordpress.py <path-to-site-content> [project-root]
Re-runnable: overwrites its outputs.
"""
import html, json, re, shutil, sys
from pathlib import Path
from urllib.parse import urlparse

import html2text
from bs4 import BeautifulSoup

SRC = Path(sys.argv[1]).resolve()
ROOT = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent).resolve()
UPLOADS = SRC / "media/wp-content/uploads"
OUT_MEDIA = ROOT / "public/media"

CATEGORY = {10: "Career Guides", 12: "Cheat Sheets", 13: "Cybersecurity News", 14: "Free Resources",
            11: "Learning Roadmaps", 19: "Tutorials"}
PAGES = {"about": "about", "resources": "resources", "privacy-policy": "privacy",
         "terms-conditions": "terms", "cookie-policy": "cookies"}
LINK_PAGES = {"about": "/about", "resources": "/resources", "privacy-policy": "/privacy",
              "terms-conditions": "/terms", "cookie-policy": "/cookies"}
REMOVE_LINK = {"pricing", "courses", "learning-paths", "checkout", "cart", "account", "my-account", "course", "login"}
WIDGET_IDS = {"soc2", "mw-explorer"}  # inline interactive widgets (script-driven) cannot live in markdown

load = lambda n: json.load((SRC / n).open())
posts, pages, cats_unused = load("posts.json"), load("pages.json"), None
tags = {t["id"]: html.unescape(t["name"]) for t in load("tags.json")}
users = {u["id"]: u["name"] for u in load("users.json")}
media = {m["id"]: m for m in load("media.json")}
crawled = {e["url"].rstrip("/"): e for e in load("crawled_pages.json")}
post_slugs = {p["slug"] for p in posts}

referenced, missing, removed_links, notes = set(), set(), [], []
UP_RE = re.compile(r"^https?://(?:www\.)?cyberheaven\.eu/wp-content/uploads/(.+)$")


def media_path(url):
    """Map an uploads URL to /media/<path>, recording the file for copying."""
    m = UP_RE.match(url)
    if not m:
        return None
    rel = m.group(1).split("?")[0]
    if not (UPLOADS / rel).exists():
        stripped = re.sub(r"-\d+x\d+(\.\w+)$", r"\1", rel)
        if (UPLOADS / stripped).exists():
            rel = stripped
    referenced.add(rel)
    if not (UPLOADS / rel).exists():
        missing.add(rel)
    return "/media/" + rel


def fix_link(href, text, where):
    """Return new href, or None to unwrap the link."""
    if media_path(href):
        return media_path(href)
    u = urlparse(href)
    if u.netloc and u.netloc.replace("www.", "") != "cyberheaven.eu":
        return href
    slug = u.path.strip("/")
    if not slug and not href:
        return "/privacy" if "Privacy Policy" in text else None  # empty href in cookie policy
    if slug in post_slugs:
        return f"/articles/{slug}" + (f"#{u.fragment}" if u.fragment else "")
    if slug in LINK_PAGES:
        return LINK_PAGES[slug]
    if slug.split("/")[0] in REMOVE_LINK:
        removed_links.append(f"{where}: [{text}]({href})")
        return None
    return href


def clean(soup, where):
    for t in soup(["script", "style", "link", "svg", "button", "noscript"]):
        t.decompose()
    for i in WIDGET_IDS:
        for t in soup.find_all(id=i):
            notes.append(f"{where}: dropped interactive widget #{i}")
            t.decompose()
    for t in soup.find_all(class_=re.compile(r"share|related|sharedaddy|jp-relatedposts")):
        t.decompose()
    for t in soup.find_all("img"):
        for a in ("srcset", "sizes", "class", "style", "width", "height", "decoding", "loading", "fetchpriority"):
            t.attrs.pop(a, None)
        if t.get("src") and media_path(t["src"]):
            t["src"] = media_path(t["src"])
    for a in soup.find_all("a"):
        new = fix_link(a.get("href", ""), a.get_text(strip=True), where)
        if new is None:
            a.unwrap()
        else:
            a["href"] = new
    for h in soup.find_all("h1"):
        h.name = "h2"  # page template owns the h1
    for p in soup.find_all("p"):
        if not p.get_text(strip=True) and not p.find(["img", "iframe"]):
            p.decompose()


def to_markdown(htmlstr, where):
    soup = BeautifulSoup(htmlstr, "html.parser")
    clean(soup, where)
    stash = []

    # code blocks, tables and iframes are kept verbatim and swapped back after conversion
    for t in soup.find_all(["pre", "table", "iframe"]):
        if t.name == "pre":
            code = t.find("code")
            classes = (code.get("class") if code else None) or t.get("class") or []
            lang = next((c[9:] for c in classes if c.startswith("language-")), "")
            raw = f"```{lang}\n{(code or t).get_text().strip(chr(10))}\n```"
        else:
            for x in [t] + t.find_all(True):
                for a in ("class", "style", "id", "width", "height", "frameborder", "allow", "loading"):
                    x.attrs.pop(a, None)
            raw = str(t)
        stash.append(raw)
        p = soup.new_tag("p")
        p.string = f"CHSTASH{len(stash) - 1}X"
        t.replace_with(p)
    h = html2text.HTML2Text()
    h.body_width = 0
    h.unicode_snob = True
    h.ignore_links = False
    md = h.handle(str(soup))
    md = re.sub(r"CHSTASH(\d+)X", lambda m: stash[int(m.group(1))], md)
    md = re.sub(r"[ \t]+\n", "\n", md)
    return re.sub(r"\n{3,}", "\n\n", md).strip() + "\n"


def q(s):
    return json.dumps(s, ensure_ascii=False)


def text(s):
    return " ".join(html.unescape(BeautifulSoup(s, "html.parser").get_text(" ")).split())


EMAIL = "cyberheavenhq@proton.me"


def write(path, fm, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = "---\n" + "\n".join(f"{k}: {v}" for k, v in fm.items()) + "\n---\n\n" + body
    path.write_text(re.sub(r"[\w.+-]+@cyberheaven\.eu", EMAIL, out))


# ---------- articles ----------
for p in posts:
    slug, title = p["slug"], text(p["title"]["rendered"])
    body = to_markdown(p["content"]["rendered"], f"articles/{slug}")
    exc = re.sub(r"\s*\[?(…|&hellip;)\]?\s*$|\s*Read more.*$", "", text(p["excerpt"]["rendered"])).strip()
    if exc and "&hellip;" in p["excerpt"]["rendered"] and ". " in exc[40:]:
        exc = exc[: exc.rindex(". ") + 1]  # WP cuts excerpts mid-sentence
    if not exc or exc == title:  # prefix-only excerpt: use first prose paragraph
        first = next((l for l in body.splitlines() if l and l[0].isalpha()), title)
        exc = first if len(first) < 220 else first[:200].rsplit(" ", 1)[0] + "…"
        notes.append(f"articles/{slug}: excerpt was missing/duplicated title; used first paragraph")
    m = media.get(p["featured_media"])
    cover, alt = None, ""
    if m:
        cover, alt = media_path(m["source_url"]), (m.get("alt_text") or "").strip()
    else:
        img = re.search(r"!\[[^\]]*\]\((/media/[^)\s]+)", body)
        cover = img.group(1) if img else ""
    cat = next(CATEGORY[c] for c in p["categories"] if c in CATEGORY)
    fm = {"title": q(title), "category": q(cat), "date": p["date"][:10], "author": q(users[p["author"]]),
          "excerpt": q(exc), "cover": q(cover), "coverAlt": q(alt or title),
          "tags": json.dumps([tags[t] for t in p["tags"]], ensure_ascii=False), "draft": "false"}
    write(ROOT / f"src/content/articles/{slug}.md", fm, body)
    print("article", slug, len(body))

# ---------- pages ----------
def sq(s):
    return " ".join(s.split())


def about_html(full):
    s = BeautifulSoup(full, "html.parser").find(class_="wp-site-blocks")
    lead = s.select_one("div.is-layout-constrained p")
    story = s.select_one(".ch-about-content")
    out = [f"<p>{sq(lead.get_text(' '))}</p>", f"<h2>{sq(story.select_one('h2').get_text(' '))}</h2>"]
    out += [f"<p>{sq(p.get_text(' '))}</p>" for p in story.find_all("p")]
    out.append("<h2>Our values</h2>")
    for c in s.select(".ch-value-card"):
        out.append(f"<h3>{sq(c.h3.get_text())}</h3><p>{sq(c.p.get_text())}</p>")
    return "".join(out)  # stats, CTA button omitted: see report


def resources_html(full):
    s = BeautifulSoup(full, "html.parser").find(class_="wp-site-blocks")
    h1 = next(x for x in s.find_all("h1") if "Blog" in x.get_text())
    out = [f"<p>{sq(h1.find_next('p').get_text())}</p>", "<ul>"]
    for p in posts:
        out.append(f'<li><a href="https://cyberheaven.eu/{p["slug"]}/">{text(p["title"]["rendered"])}</a></li>')
    return "".join(out) + "</ul>"


for pg in pages:
    if pg["slug"] not in PAGES:
        continue
    name = PAGES[pg["slug"]]
    entry = crawled.get(pg["link"].rstrip("/"), {})
    full = entry.get("full_html", "")
    if pg["content"]["rendered"].strip():
        h = pg["content"]["rendered"]
    elif pg["slug"] == "about":
        h = about_html(full)
    else:
        h = resources_html(full)
    md = BeautifulSoup(full, "html.parser").find("meta", attrs={"name": "description"})
    desc = sq(md["content"]) if md else ""
    body = to_markdown(h, f"pages/{name}")
    if not desc:
        desc = next((l for l in body.splitlines() if l and l[0].isalpha()), "")
        desc = desc if len(desc) < 200 else desc[:180].rsplit(" ", 1)[0] + "…"
    write(ROOT / f"src/content/pages/{name}.md", {"title": q(text(pg["title"]["rendered"])), "description": q(desc)}, body)
    print("page", name, len(body))

# ---------- media ----------
shutil.rmtree(OUT_MEDIA, ignore_errors=True)
for rel in sorted(referenced - missing):
    dst = OUT_MEDIA / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(UPLOADS / rel, dst)
for f in ("_fixture.md",):
    for d in ("articles", "pages"):
        (ROOT / f"src/content/{d}/{f}").unlink(missing_ok=True)

print("media copied:", len(referenced - missing), "missing:", sorted(missing))
print("removed links:", *removed_links, sep="\n  ")
print("notes:", *notes, sep="\n  ")
