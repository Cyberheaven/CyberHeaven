// Sanity check for src/data/career.json: run with `node scripts/check-career.mjs`.
// Every answer must score real paths, and every path must be winnable by some set of answers.
import { readFileSync } from "node:fs";

const { paths, questions } = JSON.parse(readFileSync(new URL("../src/data/career.json", import.meta.url)));
const ids = paths.map((p) => p.id);

for (const q of questions)
  for (const o of q.options)
    for (const id of Object.keys(o.score)) if (!ids.includes(id)) throw new Error(`Unknown path "${id}" in: ${q.q}`);

// Same scoring as src/pages/career.astro: points earned / most points possible for that path.
const max = Object.fromEntries(ids.map((id) => [id, questions.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score[id] ?? 0)), 0)]));
for (const id of ids) {
  const picks = questions.map((q) => q.options.reduce((a, b) => ((b.score[id] ?? 0) > (a.score[id] ?? 0) ? b : a)));
  const pct = Object.fromEntries(ids.map((p) => [p, picks.reduce((s, o) => s + (o.score[p] ?? 0), 0) / max[p]]));
  const best = ids.reduce((a, b) => (pct[b] > pct[a] ? b : a));
  if (best !== id) throw new Error(`Path "${id}" can't win: its best answers still pick "${best}"`);
}
console.log(`career.json OK: ${questions.length} questions, ${ids.length} paths, every path winnable`);
