# The CMS (`/admin`)

Volunteers edit the site at `/admin` with [Sveltia CMS](https://github.com/sveltia/sveltia-cms), a Git-based CMS: it
reads and writes the Markdown and JSON files in this repo through GitHub. There is no server and no database.
Who may publish what is in [access-levels.md](access-levels.md); how signing in works is in [cms-login.md](cms-login.md).

This page is for whoever maintains the CMS itself: how it's put together, why it looks the way it does, and how to
check it still works after a change or a Sveltia update.

## Files

| File | What it does |
| --- | --- |
| `public/admin/index.html` | Loads Sveltia (the version is pinned in the script URL), then `theme.css`, then `cms.js`. |
| `public/admin/config.yml` | Every collection and field the CMS shows, with the hints volunteers see. **Must match `src/content.config.ts`.** |
| `public/admin/theme.css` | The CyberHeaven look: dark, Sora, white as the only accent, pill buttons, site-sized headings. |
| `public/admin/cms.js` | Previews that look like the live pages, the "Interactive widget" editor block, the "Start here" page, and small behaviour fixes (below). |
| `public/admin/logo.webp` | The logo on the sign-in screen and in the top bar. |
| `src/pages/admin/preview.css.ts` | Builds `/admin/preview.css` for the preview pane from the site's real stylesheets. |
| `src/pages/admin/youtube.mjs.ts` | Serves `src/lib/youtube.mjs` to `cms.js`, so the preview draws YouTube embeds like the site. |
| `src/pages/admin/start.astro` | The "Start here" guide inside the CMS. Its "Where everything is" table repeats the README's: change both. |
| `.github/CODEOWNERS` | Who must approve changes to which files ([access-levels.md](access-levels.md)). |
| `scripts/cms-preview/` | A local copy of the CMS for testing, plus screenshot and behaviour checks (below). |

## How the theme works

Sveltia has no official theming yet (it's on their roadmap), so `theme.css` works with what Sveltia exposes:

1. **`--sui-*` CSS variables first.** Sveltia draws nearly everything from about 450 of them: colours
   (`--sui-background-color-1-hsl` … `-5`, foregrounds, borders), the accent, the font, corner radii, control
   heights. Most of the look is just new values for these. One variable can drive unrelated things (for example
   `--sui-button-medium-border-radius` also rounds the image drop zone), so check every view after changing one.
2. **Then ARIA and data attributes**, which are stable: `[role="toolbar"][aria-label="Global"]` (top bar),
   `[aria-label="Primary"]` (the editor's bar), `button[data-label="Save"]`, `section.field[data-key-path="title"]`,
   `[aria-label="Switch Page"]`, `nav.primary-sidebar`, `[role="grid"][aria-label="Entries"]`.
3. **Then Sveltia's own class names** (`.search-bar`, `.buttons`, `.toolbar-wrapper`, `img.logo`).
4. **Never the generated `svelte-xxxx` classes**: they change with every Sveltia release.

Things that aren't obvious:

- **Load order.** Sveltia adds its own `<style>` tags to `<head>` when it starts, so a stylesheet in `<head>` loses.
  `theme.css` is linked at the **end of `<body>`**, after the Sveltia script. Keep it there.
- **Dark only.** `:root:root[data-theme]` outranks Sveltia's light, dark and high-contrast blocks, so every editor
  gets the dark look whatever their system or CMS setting says.
- **Sveltia's nested rules are strong.** Some of its rules are nested under a component class, e.g.
  `.toolbar-wrapper.svelte-xxxx > .sui.toolbar .buttons { width: 50% }`. To beat those, start your selector with
  the same parent (`.toolbar-wrapper > [role="toolbar"]…`). To find such a rule, run
  `node scripts/cms-preview/find-css.mjs "<text>"` (it prints every live CSS rule containing that text).
- **Firefox and icon buttons.** Sveltia keeps icon buttons square with `aspect-ratio: 1 / 1`. Chrome grows a button
  to fit added text anyway, Firefox doesn't: when you add a label to an icon button, also set `aspect-ratio: auto`.
- **Iframes.** The preview pane and the "Start here" page are iframes: they need their own
  `color-scheme: dark`, or Firefox draws a light scrollbar in them.
- **Labels added with CSS** (`content: "Workflow"`) must contain words from the element's accessible name, so
  screen-reader users can say what they see.
- **Respect `prefers-reduced-motion`** for every animation; keep text contrast at 4.5:1 or more.

## Behaviour added in `cms.js`

- **Previews** for articles and team members use the same markup and classes as `src/pages/articles/[slug].astro`
  and `src/pages/team/[person].astro`, styled by the site's real CSS. If you change those pages, change `cms.js` too.
- **Interactive widget** in the article editor's Insert menu (saved as `<div data-widget="…"></div>`).
- **Start here** page (`CMS.registerCustomPage`). A volunteer's first visit in each browser opens it once.
- **Unsaved changes:** the ← button asks before throwing them away (Sveltia wouldn't); closing the tab asks too.
  The browser's own Back button isn't covered.
- **Logo name:** screen readers hear "CyberHeaven: visit the live site", matching what the logo shows.

## The editor rewrites Markdown

Sveltia's rich-text editor re-writes the Markdown body on every save, and some Markdown doesn't survive: lists
indented by 1–3 spaces, HTML tables, `<iframe>` lines, `* * *` rules. Content is kept in forms that survive, and
`node scripts/check-content.mjs` flags anything that wouldn't. Reported upstream:
[sveltia-cms#1100](https://github.com/sveltia/sveltia-cms/issues/1100) and
[#1101](https://github.com/sveltia/sveltia-cms/issues/1101).

## Testing the CMS locally

The CMS normally needs a GitHub sign-in. `scripts/cms-preview/` builds a local copy that runs on the real content
without one (Sveltia's test backend: changes stay in your browser), and checks it in Chrome and Firefox. Both
browsers must work: the main maintainer uses Firefox.

```sh
npm i --no-save puppeteer-core@23.11.1               # drives your installed Chrome and Firefox; no download
node scripts/cms-preview/setup.mjs /tmp/cms-preview   # builds the site and the local CMS
python3 -m http.server 4399 --directory /tmp/cms-preview
# open http://localhost:4399/admin/index.html and click Start Demo

node scripts/cms-preview/check.mjs                    # behaviour checks, both browsers: PASS/FAIL
node scripts/cms-preview/shoot.mjs /tmp/cms-shots      # screenshots of every view, both browsers, desktop + phone
```

Run `setup.mjs` again after changing `config.yml` or anything in `src/pages/admin` (it copies or builds those).
Browsers are expected at `/usr/bin/google-chrome` and `/usr/bin/firefox`; set `CHROME` / `FIREFOX` otherwise.

The demo has no review workflow. To test against a real GitHub repo (a sandbox copy, see
[access-levels.md](access-levels.md#testing-changes-safely)), use `--github owner/repo` and sign in with a token:

```sh
node scripts/cms-preview/setup.mjs /tmp/cms-sandbox --github Cyberheaven/cms-sandbox
python3 -m http.server 4399 --directory /tmp/cms-sandbox
TOKEN=$(gh auth token) node scripts/cms-preview/shoot.mjs /tmp/sandbox-shots
```

## Updating Sveltia

1. Change the version in the script URL in `public/admin/index.html`.
2. Run `setup.mjs`, `check.mjs` and `shoot.mjs` (above), and compare the screenshots with ones taken before the
   update. Variable names have stayed the same so far, but Sveltia doesn't promise that.
3. If something broke, find the new markup with your browser's inspector, and Sveltia's rule with `find-css.mjs`.

## Known gaps

- The "Start here" page shows its title twice (Sveltia's bar and the page heading).
- Team members without a photo show a black square in the list (the site shows their initials).
- Sveltia's message when publishing isn't allowed yet is vague: "Couldn't publish the entry. Please try again."
  It means the change still needs an approval ([access-levels.md](access-levels.md)).
