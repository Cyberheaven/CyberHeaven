// Sanity check for the adaptive career quiz: run with `node scripts/check-career.mjs`.
// Checks the data links up, then plays the quiz many ways: every path must be reachable as the winner
// by someone who keeps picking the answers that suit it, and no run may ask too many questions.
import { readFileSync } from "node:fs";
import { ranking, nextQuestion, reasons, levelOf } from "../src/lib/career.mjs";

const data = JSON.parse(readFileSync(new URL("../src/data/career.json", import.meta.url)));
const ids = data.paths.map((p) => p.id);
const qids = data.questions.map((q) => q.id);
const fail = (msg) => {
  throw new Error(msg);
};

for (const q of data.questions)
  for (const o of q.options) {
    for (const id of Object.keys(o.score)) if (!ids.includes(id)) fail(`Unknown path "${id}" in: ${q.q}`);
    if (o.next && !qids.includes(o.next)) fail(`"${o.a}" points to a missing question "${o.next}"`);
    if (o.level && !data.levels.some((l) => l.id === o.level)) fail(`"${o.a}" has an unknown level "${o.level}"`);
  }
for (const q of data.questions.filter((q) => q.stage === "follow"))
  if (!data.questions.some((x) => x.options.some((o) => o.next === q.id))) fail(`Follow-up "${q.id}" is never reached`);

// Play the quiz choosing answers with `choose(question)`; returns the answers given.
const play = (choose) => {
  const answers = [];
  for (let q = nextQuestion(data, answers); q; q = nextQuestion(data, answers)) {
    answers.push({ id: q.id, option: choose(q) });
    if (answers.length > 12) fail("A run asked more than 12 questions");
  }
  return answers;
};

for (const id of ids) {
  const answers = play((q) => q.options.reduce((best, o, i) => ((o.score[id] ?? 0) > (q.options[best].score[id] ?? 0) ? i : best), 0));
  const winner = ranking(data, answers)[0].id;
  if (winner !== id) fail(`Path "${id}" can't win: its best answers still pick "${winner}"`);
  if (!reasons(data, answers, id).length) fail(`Path "${id}" wins without a single reason to show`);
}

let longest = 0;
for (let n = 0; n < 2000; n++) {
  const answers = play((q) => Math.floor(Math.random() * q.options.length));
  longest = Math.max(longest, answers.length);
  if (!levelOf(data, answers)) fail("A run finished without a starting level");
}
console.log(`career.json OK: ${data.questions.length} questions, ${ids.length} paths, every path winnable, at most ${longest} questions per run`);
