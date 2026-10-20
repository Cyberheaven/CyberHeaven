// Run: node scripts/check-youtube.mjs — checks the YouTube link parser in src/lib/youtube.mjs.
import assert from "node:assert/strict";
import { youtubeId, youtubeHtml } from "../src/lib/youtube.mjs";

for (const url of [
  "https://www.youtube.com/embed/o305_T7KMDc?feature=oembed",
  "https://www.youtube.com/watch?v=o305_T7KMDc",
  "https://youtube.com/watch?t=10&v=o305_T7KMDc",
  "https://youtu.be/o305_T7KMDc?si=abc",
  "https://www.youtube-nocookie.com/embed/o305_T7KMDc",
  "https://www.youtube.com/shorts/o305_T7KMDc",
]) assert.equal(youtubeId(url), "o305_T7KMDc", url);
assert.equal(youtubeId("https://vimeo.com/123"), null);
assert.equal(youtubeId(undefined), null);
assert.ok(youtubeHtml("o305_T7KMDc", 'A "quoted" <title>').includes("A &quot;quoted&quot; &lt;title&gt;"));
console.log("youtube: ok");
