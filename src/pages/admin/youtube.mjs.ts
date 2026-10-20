import type { APIRoute } from "astro";
import source from "../../lib/youtube.mjs?raw";

/** The site's YouTube player markup (lib/youtube.mjs), for the CMS preview (public/admin/cms.js). */
export const GET: APIRoute = () => new Response(source, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
