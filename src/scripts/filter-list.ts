import { scrollToY } from "./lib";

/**
 * Search, filter chips, sorting and pages for a list page (articles, resources, glossary).
 *
 * Markup inside the root element:
 *   input[data-q]                               search box, matched against each item's data-text
 *   [data-filter="key"] > button[data-value]    a group of chips; data-value="" means "all"
 *   select[data-sort]                           optional; values are keys of SORTS below
 *   [data-item]                                 one per entry, with data-text and data-<key> for each filter
 *                                               (several values allowed, separated by |, e.g. data-role="Author|Maintainer")
 *   [data-group]                                optional wrapper, hidden when none of its items match
 *   [data-count], [data-empty]                  optional result count and "no results" message
 *   nav[data-pager]                             optional; with data-per-page="12" on the root, splits
 *                                               the results into pages and draws the page buttons here
 *
 * The current search, filters, sort and page are kept in the address bar (?q=…&category=…&page=2),
 * so a filtered view can be shared or linked to.
 */
const SORTS: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
  newest: (a, b) => b.dataset.date!.localeCompare(a.dataset.date!),
  oldest: (a, b) => a.dataset.date!.localeCompare(b.dataset.date!),
  az: (a, b) => a.dataset.title!.localeCompare(b.dataset.title!, "en", { sensitivity: "base" }),
};

const ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
const pad = (n: number) => String(n).padStart(2, "0");

export function filterList(root: HTMLElement, onUpdate?: (shown: number) => void) {
  const input = root.querySelector<HTMLInputElement>("[data-q]");
  const sort = root.querySelector<HTMLSelectElement>("[data-sort]");
  const groups = Array.from(root.querySelectorAll<HTMLElement>("[data-filter]"));
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-item]"));
  const wrappers = Array.from(root.querySelectorAll<HTMLElement>("[data-group]"));
  const count = root.querySelector<HTMLElement>("[data-count]");
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const pager = root.querySelector<HTMLElement>("[data-pager]");
  const perPage = Number(root.dataset.perPage) || Infinity;
  const chosen: Record<string, string> = {};
  let page = 1;

  const press = (group: HTMLElement, value: string) => {
    chosen[group.dataset.filter!] = value;
    group.querySelectorAll<HTMLButtonElement>("button[data-value]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === value)));
  };

  const update = () => {
    if (sort && SORTS[sort.value]) {
      const parents = new Set(items.map((i) => i.parentElement!));
      for (const p of parents) p.append(...items.filter((i) => i.parentElement === p).sort(SORTS[sort.value]));
    }
    const words = (input?.value ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const matches = Array.from(root.querySelectorAll<HTMLElement>("[data-item]")).filter((item) => {
      const text = item.dataset.text ?? "";
      return words.every((w) => text.includes(w)) && Object.entries(chosen).every(([key, value]) => !value || (item.dataset[key] ?? "").split("|").includes(value));
    });
    const pages = Math.max(1, Math.ceil(matches.length / perPage));
    page = Math.min(Math.max(1, page), pages);
    const onPage = new Set(matches.slice((page - 1) * perPage, page * perPage));
    for (const item of items) item.hidden = !onPage.has(item);
    for (const w of wrappers) w.hidden = !w.querySelector("[data-item]:not([hidden])");
    if (count) count.textContent = String(matches.length);
    if (empty) empty.hidden = matches.length > 0;

    if (pager) {
      // ponytail: one button per page; switch to a windowed "1 … 4 5 6 … 20" list past ~10 pages.
      pager.hidden = pages < 2;
      pager.innerHTML =
        `<button type="button" class="round-btn pager-step pager-prev" data-page="${page - 1}" aria-label="Previous page"${page === 1 ? " disabled" : ""}>${ARROW}</button>` +
        `<span class="pager-nums">${Array.from({ length: pages }, (_, i) => `<button type="button" class="pager-num" data-page="${i + 1}"${i + 1 === page ? ' aria-current="page"' : ""} aria-label="Page ${i + 1}">${pad(i + 1)}</button>`).join("")}</span>` +
        `<span class="caption muted pager-of">of ${pad(pages)}</span>` +
        `<button type="button" class="round-btn pager-step" data-page="${page + 1}" aria-label="Next page"${page === pages ? " disabled" : ""}>${ARROW}</button>`;
    }

    const url = new URL(location.href);
    const set = (k: string, v: string) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set("q", input?.value.trim() ?? "");
    for (const [k, v] of Object.entries(chosen)) set(k, v);
    if (sort) set("sort", sort.selectedIndex > 0 ? sort.value : "");
    set("page", page > 1 ? String(page) : "");
    history.replaceState(null, "", url);
    // Items moved, so let the scroll reveals (scripts/reveal.ts) re-measure them.
    window.dispatchEvent(new Event("scroll"));
    onUpdate?.(matches.length);
  };
  // Any change to the search, filters or sort starts again from page 1.
  const refilter = () => {
    page = 1;
    update();
  };

  // Start from whatever the address bar asks for.
  const params = new URLSearchParams(location.search);
  if (input) input.value = params.get("q") ?? "";
  if (sort && params.get("sort") && SORTS[params.get("sort")!]) sort.value = params.get("sort")!;
  page = Number(params.get("page")) || 1;
  for (const g of groups) {
    const wanted = params.get(g.dataset.filter!) ?? "";
    const exists = g.querySelector(`button[data-value="${CSS.escape(wanted)}"]`);
    press(g, exists ? wanted : "");
    g.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-value]");
      if (!b) return;
      press(g, b.dataset.value!);
      refilter();
    });
  }
  input?.addEventListener("input", refilter);
  sort?.addEventListener("change", refilter);
  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (input) input.value = "";
    groups.forEach((g) => press(g, ""));
    refilter();
  });
  pager?.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-page]");
    if (!b || b.disabled) return;
    page = Number(b.dataset.page);
    update();
    scrollToY(root.getBoundingClientRect().top + window.scrollY - 40);
  });
  update();
}
