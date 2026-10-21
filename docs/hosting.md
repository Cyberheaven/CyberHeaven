# Hosting

The site is a static Astro build served free by **GitHub Pages** at **<https://cyberheaven.github.io>**, from the
repo `Cyberheaven/cyberheaven.github.io`. GitHub serves an organisation's site at that address only from a repo with
exactly that name, which is why the repo is named after the site.

## How a change gets online

1. Something lands on `main`: a pushed commit, or a change published from the CMS ([access-levels.md](access-levels.md)).
2. The workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds the site with Node 22
   (`withastro/action`) and publishes `dist/` to Pages. It takes a few minutes; progress is on the repo's
   *Actions* tab.
3. If the build fails (for example a CMS entry broke the content schema in `src/content.config.ts`), the live site
   stays as it was and the failed run shows the error. Fix it on `main` and the next run deploys.

To redeploy without a change: *Actions → Deploy to GitHub Pages → Run workflow*.
To go back to an older version: revert the bad commit on `main` (or re-run an older successful run).

## Settings

- *Settings → Pages*: **Source: GitHub Actions**. (If it says "Deploy from a branch", GitHub publishes the raw repo
  files instead of the built site: switch it back.) HTTPS is enforced.
- `astro.config.mjs` → `site: "https://cyberheaven.github.io"`. It's used for canonical links, social previews,
  `robots.txt` and the sitemap. Change it if the address changes.
- Pages serves `dist/404.html` for unknown addresses, and the redirects in `astro.config.mjs` (`/privacy` →
  `/legal#privacy`, …) are built as small HTML pages, since Pages has no server-side redirects.

## A custom domain later

The old `cyberheaven.eu` domain was dropped, but may be used again. To move the site to a domain (that or another):

1. Own the domain. Add it under *Settings → Pages → Custom domain*; GitHub lists the DNS records to create there.
2. Change `site` in `astro.config.mjs`.
3. Let the CMS sign-in work on it: add it to the login service's `ALLOWED_DOMAINS` and update the OAuth app's
   homepage ([cms-login.md](cms-login.md#changing-the-domain)).

Nothing else in the site depends on the address. Old WordPress links (`cyberheaven.eu/<post>/`) only work again if
redirects for them are added (`redirects` in `astro.config.mjs`).

## Signing in to the CMS on the live site

"Sign In with GitHub" goes through a small login service on Cloudflare Workers: [cms-login.md](cms-login.md).

## Renamed repo

The repo was called `Cyberheaven/CyberHeaven` until 21 Oct 2026. GitHub redirects the old URL and old git remotes,
but update your clone anyway: `git remote set-url origin git@github.com:Cyberheaven/cyberheaven.github.io.git`.
