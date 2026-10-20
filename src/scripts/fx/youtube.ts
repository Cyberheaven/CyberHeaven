// YouTube players (lib/youtube.mjs): pressing play swaps the poster for the real player.
// youtube-nocookie.com keeps YouTube from setting cookies until the video is played.
document.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest(".yt-play");
  const frame = btn?.closest<HTMLElement>("[data-yt]");
  if (!frame) return;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${frame.dataset.yt}?autoplay=1&rel=0`;
  iframe.title = frame.dataset.ytTitle ?? "YouTube video";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  frame.replaceChildren(iframe);
  iframe.focus();
});
