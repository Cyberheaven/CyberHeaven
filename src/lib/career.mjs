// The adaptive career quiz behind /career. Questions live in src/data/career.json:
//   stage "start"  asked to everyone, in order
//   stage "follow" asked only when an answer points to it with "next" (a follow-up to that answer)
//   stage "pick"   chosen one at a time: whichever best separates the paths that are leading so far
// An answer is { id, option } (the question id and the index of the chosen option).
// Check: `node scripts/check-career.mjs`.

const MAX_PICKS = 4;

const byId = (data, id) => data.questions.find((q) => q.id === id);
const chosen = (data, a) => byId(data, a.id).options[a.option];

/** Every path with its points, the most it could have scored on the questions asked so far, and a 0-100 match. */
export function ranking(data, answers) {
  return data.paths
    .map((p) => {
      let score = 0;
      let max = 0;
      for (const a of answers) {
        score += chosen(data, a).score[p.id] ?? 0;
        max += Math.max(0, ...byId(data, a.id).options.map((o) => o.score[p.id] ?? 0));
      }
      return { id: p.id, score, max, pct: max ? Math.round((score / max) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct || b.score - a.score);
}

/** The next question to ask, or null when the quiz is done. */
export function nextQuestion(data, answers) {
  const asked = new Set(answers.map((a) => a.id));
  const last = answers.at(-1);
  const follow = last && chosen(data, last).next;
  if (follow && !asked.has(follow)) return byId(data, follow);

  const start = data.questions.find((q) => q.stage === "start" && !asked.has(q.id));
  if (start) return start;

  const picks = answers.filter((a) => byId(data, a.id).stage === "pick").length;
  if (picks >= MAX_PICKS) return null;
  const rank = ranking(data, answers);
  // stop early once one path is clearly ahead
  if (picks >= 2 && rank[0].score - rank[1].score >= 5) return null;

  // the unasked question whose answers pull the top three paths furthest apart
  const top = rank.slice(0, 3).map((r) => r.id);
  const spread = (q) => q.options.reduce((s, o) => s + Math.max(...top.map((id) => o.score[id] ?? 0)) - Math.min(...top.map((id) => o.score[id] ?? 0)), 0) / q.options.length;
  let best = null;
  for (const q of data.questions.filter((q) => q.stage === "pick" && !asked.has(q.id)))
    if (spread(q) > 0 && (!best || spread(q) > spread(best))) best = q;
  return best;
}

/** The answer text that pointed most strongly to a path, strongest first (at most three). */
export function reasons(data, answers, pathId) {
  return answers
    .map((a) => ({ text: chosen(data, a).a, points: chosen(data, a).score[pathId] ?? 0 }))
    .filter((r) => r.points >= 2)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((r) => r.text);
}

/** The starting level picked in the first question, if any. */
export const levelOf = (data, answers) => answers.map((a) => chosen(data, a).level).filter(Boolean).at(-1);

/** The answer a follow-up question is following up on, so the page can quote it back. */
export function followsFrom(data, answers, question) {
  if (question.stage !== "follow") return null;
  const a = answers.find((x) => chosen(data, x).next === question.id);
  return a ? chosen(data, a).a : null;
}
