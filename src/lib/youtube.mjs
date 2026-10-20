// The YouTube player markup, shared by YouTube.astro and the Markdown plugin (markdown-youtube.mjs).
// Styles: ".yt" in styles/global.css. Pressing play swaps in the real player (scripts/fx/youtube.ts).

/** The 11-character video id from any YouTube link or embed address, or null. */
export function youtubeId(url = "") {
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function youtubeHtml(id, title = "Watch on YouTube") {
  const t = esc(title.trim() || "Watch on YouTube");
  return (
    `<figure class="yt"><div class="yt-frame" data-yt="${id}" data-yt-title="${t}">` +
    `<button type="button" class="yt-play" aria-label="Play video: ${t}">` +
    `<img class="yt-thumb" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">` +
    `<span class="yt-scrim"></span>` +
    `<span class="yt-info"><span class="yt-source">YouTube video</span><span class="yt-title">${t}</span></span>` +
    `<span class="yt-btn" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg></span>` +
    `</button></div></figure>`
  );
}
