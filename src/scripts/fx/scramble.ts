import { reducedMotion } from "../lib";

/**
 * Tool card specimens ([data-scramble], ToolCards.astro) "decrypt" into view: every character starts as
 * dim cipher noise that keeps cycling, then locks into the real character at its own random moment,
 * roughly left to right. Runs once when the card scrolls into view and again on mouse hover.
 */
const GLYPHS = "ABCDEFabcdef0123456789+/=%$#";
const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scramble]"));

function decrypt(el: HTMLElement) {
  const text = (el.dataset.text ??= el.textContent ?? "");
  const n = text.length;
  // each character unlocks at a slightly random time, biased left to right
  const unlock = Array.from(text, (_, i) => 120 + (i / n) * 520 + Math.random() * 260);
  const start = performance.now();
  let last = 0;
  cancelAnimationFrame(Number(el.dataset.raf));
  const frame = (now: number) => {
    const t = now - start;
    if (now - last > 45) {
      last = now;
      // rebuild as runs of plain text and cipher spans, so locked characters read normally
      el.replaceChildren();
      let run: HTMLElement | null = null;
      let runLocked = false;
      for (let i = 0; i < n; i++) {
        const locked = t >= unlock[i] || text[i] === " ";
        if (!run || runLocked !== locked) {
          run = document.createElement("span");
          if (!locked) run.className = "is-cipher";
          runLocked = locked;
          el.append(run);
        }
        run.textContent += locked ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
    }
    if (t < Math.max(...unlock)) el.dataset.raf = String(requestAnimationFrame(frame));
    else el.textContent = text;
  };
  el.dataset.raf = String(requestAnimationFrame(frame));
}

if (els.length && !reducedMotion() && typeof IntersectionObserver !== "undefined") {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        decrypt(e.target as HTMLElement);
      }),
    { threshold: 1 }
  );
  for (const el of els) {
    io.observe(el);
    el.closest("a")?.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType === "mouse") decrypt(el);
    });
  }
}
