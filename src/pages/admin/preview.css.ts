import type { APIRoute } from "astro";
import global from "../../styles/global.css?raw";
import prose from "../../styles/prose.css?raw";
import profile from "../../styles/profile.css?raw";

/**
 * The stylesheet for the CMS preview pane (public/admin/cms.js): the site's own CSS, so the preview
 * looks like the live page and follows any change to the site's styles.
 */
const extra = `
@font-face {
  font-family: "Sora"; font-style: normal; font-display: swap; font-weight: 100 800;
  src: url(https://cdn.jsdelivr.net/fontsource/fonts/sora:vf@5.2.5/latin-wght-normal.woff2) format("woff2");
}
/* The preview is its own page (an iframe): a dark scrollbar like the rest of the CMS, not the browser's light one */
:root { color-scheme: dark; scrollbar-color: hsl(0 0% 30%) transparent; }
/* The preview redraws on every keystroke: no entrance animations */
*, *::before, *::after { animation: none !important; }
/* Stand-in for an interactive widget, which only runs on the live site */
.cms-widget { margin: 40px 0; padding: 28px; border: 1px dashed var(--white-40); border-radius: 16px; color: var(--white-60); }
.cms-widget strong { display: block; margin-bottom: 4px; color: var(--white); }
/* "Before you submit" card above the article (cms.js): not part of the site */
.cms-check { margin-top: 24px; padding: 18px 22px; border: 1px solid var(--white-20); border-radius: 16px; font-size: 15px; }
.cms-check > p { color: var(--white); }
.cms-check[data-ok] > p { color: var(--success); }
.cms-check ul { margin: 10px 0 0; padding-left: 20px; color: var(--white-60); display: grid; gap: 8px; }
/* Google result and shared-link card under the article (cms.js SearchCard): not part of the site */
.cms-search { display: grid; gap: 12px; margin-block: 24px 48px; font-size: 15px; }
.cms-search .caption { color: var(--white-60); margin-top: 12px; }
.cms-search [data-over] { color: var(--error); }
.cms-google, .cms-share { max-width: 600px; padding: 18px 22px; border: 1px solid var(--white-20); border-radius: 16px; color: var(--white-60); }
.cms-url { font-size: 13px; color: var(--white-40); }
.cms-title { color: var(--white); font-weight: 600; margin-block: 2px 4px; }
.cms-share { padding: 0; overflow: hidden; }
.cms-share img { display: block; width: 100%; aspect-ratio: 1.91; object-fit: cover; }
.cms-share > div { padding: 14px 22px 18px; }
.cms-check-sub { margin-top: 16px; color: var(--white); }
.cms-related { display: grid; gap: 10px; padding-left: 20px; color: var(--white-60); }
.cms-related code { display: block; font-size: 13px; color: var(--white-40); }
/* Glossary terms (cms.js markTerms): the definition shows on hover */
abbr.cms-term { text-decoration: underline dotted var(--white-40); text-underline-offset: 4px; cursor: help; }
/* "On this page" (copied from components/Toc.astro, whose styles are scoped to the site page): keep them alike */
.toc { display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
.toc ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-left: 1px solid var(--white-20); }
.toc a { display: block; padding: 6px 0 6px 16px; margin-left: -1px; border-left: 1px solid transparent; font-size: 14px; line-height: 1.4; color: var(--white-60); }
.cms-check code { display: block; margin-top: 2px; font-size: 13px; color: var(--white-40); overflow-wrap: anywhere; }
`;

export const GET: APIRoute = () =>
  new Response([global, prose, profile, extra].join("\n"), { headers: { "Content-Type": "text/css; charset=utf-8" } });
