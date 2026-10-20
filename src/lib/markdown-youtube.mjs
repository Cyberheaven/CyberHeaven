// Markdown plugin (for Astro's Sätteri processor, see astro.config.mjs): turns YouTube videos in
// articles and pages into the site's own player (lib/youtube.mjs). Writers can paste either a
// YouTube <iframe> embed, or just a YouTube link on a line of its own.
import { youtubeHtml, youtubeId } from "./youtube.mjs";

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const swapIframes = (html) =>
  html.replace(/<iframe[^>]*>\s*<\/iframe>/gi, (tag) => {
    const id = youtubeId(tag.match(/src="([^"]+)"/)?.[1]);
    return id ? youtubeHtml(id, decode(tag.match(/title="([^"]*)"/)?.[1] ?? "")) : tag;
  });

export default {
  name: "youtube",
  element: {
    filter: ["iframe", "p"],
    visit(node, ctx) {
      if (node.tagName === "iframe") {
        const id = youtubeId(node.properties?.src);
        if (id) ctx.replaceNode(node, { type: "raw", value: youtubeHtml(id, String(node.properties?.title ?? "")) });
        return;
      }
      // A paragraph that holds nothing but a YouTube link
      const kids = (node.children ?? []).filter((k) => !(k.type === "text" && !k.value.trim()));
      if (kids.length !== 1 || kids[0].type !== "element" || kids[0].tagName !== "a") return;
      const id = youtubeId(kids[0].properties?.href);
      if (!id) return;
      const label = ctx.textContent(kids[0]).trim();
      ctx.replaceNode(node, { type: "raw", value: youtubeHtml(id, /^https?:/.test(label) ? "" : label) });
    },
  },
  // <iframe> embeds written as raw HTML in the Markdown
  raw(node, ctx) {
    if (/<iframe[^>]+youtu/i.test(node.value)) ctx.replaceNode(node, { type: "raw", value: swapIframes(node.value) });
  },
};
