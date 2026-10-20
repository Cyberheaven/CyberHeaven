<p align="center">
  <img src="public/assets/logo-mark.webp" alt="" width="88" height="88">
</p>

<h1 align="center">CyberHeaven</h1>

<p align="center">
  <b>Free, practical cybersecurity learning, run by the people who use it.</b><br>
  Guides, hands-on tools and hand-picked resources for every aspiring defender.
</p>

<p align="center">
  <a href="https://discord.gg/QH8mRSCdW9">Discord</a> ·
  <a href="https://twitter.com/cyberheaven0x">X (Twitter)</a> ·
  <a href="https://www.linkedin.com/company/cyberheaven">LinkedIn</a> ·
  <a href="mailto:cyberheavenhq@proton.me">cyberheavenhq@proton.me</a>
</p>

---

For eight years CyberHeaven published practical guides for cybersecurity learners. Today it is a
**community-driven, volunteer-run project**: no pricing, no paid courses, no paywalls, no tracking.
Everything is free for everyone, and anyone can help keep it going.

## What’s inside

- **Articles**: beginner-friendly guides on OSINT, digital forensics and incident response, malware analysis, SOC careers and Linux.
- **Interactive tools**: find your career path, spot the phish, route SOC alerts, explore malware families. All in the browser, no sign-up.
- **Glossary**: 160+ cybersecurity terms in plain English.
- **Resources**: 130+ hand-picked courses, labs, tools, certifications, books and communities from across the web.
- **Discussion**: comments under every article, powered by [giscus](https://giscus.app) and this repo’s Discussions.

## Ways to help

You don’t need to be an expert, and you don’t need to know how to code.

| You want to… | How |
| --- | --- |
| Write an article | Pitch your idea on [Discord](https://discord.gg/QH8mRSCdW9) or by [email](mailto:cyberheavenhq@proton.me?subject=Article%20idea). |
| Suggest a resource or glossary term | Open an [issue](../../issues) or a [discussion](../../discussions), or tell us on Discord. |
| Fix a typo or an outdated detail | Edit the file on GitHub and open a pull request, or use the content editor (below). |
| Help other learners | Join the [Discord](https://discord.gg/QH8mRSCdW9) and answer questions. |
| Improve the site | Pick an [issue](../../issues), or propose something in [Discussions](../../discussions). |

### Editing content without code

Volunteers with access can sign in at **`/admin`** (Sveltia CMS, GitHub login) and edit:

- **Articles** and **Pages** (Markdown)
- **Team**: everyone’s profile (photo, roles, bio, links). Articles pick their author from here
- **Resources**, **Glossary** and the **Spot the phish** messages
- **Settings → Categories** for articles, resources, glossary topics and team roles

Writing tips: to embed a YouTube video, paste its link on a line of its own. To show an interactive widget in an
article, add `<div data-widget="soc-ladder"></div>` or `<div data-widget="malware-explorer"></div>` on its own line.

## Running it locally

You need [Node.js](https://nodejs.org) 22 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the built site
```

Quick checks for the data that drives the interactive bits:

```sh
node scripts/check-career.mjs
node scripts/check-youtube.mjs
```

## How it’s built

A static [Astro](https://astro.build) site. No server, no database, no build-time secrets.

```
src/
  content/articles/   articles (Markdown)
  content/pages/      plain pages, e.g. legal.md (and about.md’s text)
  content/people/     team profiles (one Markdown file per person, bio in the body)
  content/site.json   homepage copy, navigation, socials, comments settings
  data/               resources, glossary, categories, quiz and game data (JSON)
  pages/              one file per route (articles, resources, glossary, team, join, play/…)
  components/         page sections, widgets, PageHead, YouTube, Comments
  scripts/            scroll effects, smooth scrolling, list filtering
  styles/             global.css (design tokens and shared styles), prose.css (article text)
public/admin/         Sveltia CMS (config.yml must stay in sync with src/content.config.ts)
```

Keep it simple: this is a volunteer project, so code should stay approachable for contributors of every skill level.

## Credits

The visual design builds on the **elias-vent** theme by Alex Prokhorov, used under the MIT License (see
[`THEME-LICENSE`](THEME-LICENSE)). Articles are written by CyberHeaven’s contributors and credited on each article.

Please read the site’s [terms, privacy and community guidelines](src/content/pages/legal.md) before contributing.
