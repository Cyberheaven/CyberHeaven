import type { APIRoute } from "astro";
import source from "../../lib/content-rules.mjs?raw";

/** The content rules the pull request checks use (lib/content-rules.mjs), for the CMS's "Before you submit" card. */
export const GET: APIRoute = () => new Response(source, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
