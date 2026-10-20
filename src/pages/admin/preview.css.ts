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
/* The preview redraws on every keystroke: no entrance animations */
*, *::before, *::after { animation: none !important; }
/* Stand-in for an interactive widget, which only runs on the live site */
.cms-widget { margin: 40px 0; padding: 28px; border: 1px dashed var(--white-40); border-radius: 16px; color: var(--white-60); }
.cms-widget strong { display: block; margin-bottom: 4px; color: var(--white); }
`;

export const GET: APIRoute = () =>
  new Response([global, prose, profile, extra].join("\n"), { headers: { "Content-Type": "text/css; charset=utf-8" } });
