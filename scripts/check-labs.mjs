// Sanity check for the hands-on labs: run with `node scripts/check-labs.mjs`.
// Every rule solution must solve its round (and the starter must not), every decode challenge must
// decode back to its flag, every permissions answer must be octal, and every log-hunt answer and
// evidence string must really be in its log.
import { readFileSync } from "node:fs";
import { parseRule, scan } from "../src/lib/yara-lite.mjs";
import { encode, decode, show, OPS } from "../src/lib/decode-ops.mjs";
import { fill } from "../src/lib/random.mjs";
import { makeWorld, run } from "../src/lib/shell.mjs";
import { makeRound } from "../src/lib/links.mjs";

const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url)));
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

// Rule engine basics
const r = parseRule('rule t {\n strings:\n  $a = "Evil" nocase\n  $b = /c2=\\d+/\n  $c = "q\\"x" // comment\n condition:\n  ($a or $b) and not $c\n}');
assert(scan(r, "EVIL c2=1").hit && !scan(r, 'evil q"x').hit && !scan(r, "nothing").hit, "yara-lite: and/or/not");
assert(scan(parseRule("strings:\n$a=\"x\"\n$b=\"y\"\ncondition:\n2 of them"), "x y").hit, "yara-lite: N of them");
assert(scan(parseRule('strings:\n$u = /http:\\/\\//\ncondition:\nany of them'), "http://a").hit, "yara-lite: // inside a regex");
for (const bad of ["condition:\nany of them", 'strings:\n$a = "x"\ncondition:\n$b', 'strings:\n$a = "x"\ncondition:\n$a and', 'strings:\n$a = /(/\ncondition:\n$a'])
  assert((() => { try { parseRule(bad); } catch { return true; } })(), `yara-lite should reject: ${bad}`);

// Samples use random placeholders, so try each round with many different fillings.
const solved = (rule, samples) => samples.every((s) => scan(rule, s.text).hit === s.malicious);
for (const round of load("rules.json").rounds)
  for (let n = 0; n < 200; n++) {
    const shared = {};
    const samples = round.samples.map((s) => ({ ...s, text: fill(s.text, shared) }));
    assert(solved(parseRule(round.solution), samples), `rules.json: the solution doesn't solve “${round.title}”`);
    assert(!solved(parseRule(round.starter), samples), `rules.json: the starter already solves “${round.title}”`);
  }

// Decode: each op must undo itself, and every challenge must decode back to its message
for (const op of Object.keys(OPS)) {
  const [out] = decode(encode("Hi + there/%~", [`${op}:7`]), [{ op, key: 7 }]);
  assert(show(out.bytes) === "Hi + there/%~", `decode-ops: ${op} doesn't round-trip`);
}
for (const c of load("decode.json").challenges) {
  assert(/CH\{[^}]+\}/.test(c.message), `decode.json: “${c.title}” needs a CH{...} flag in its message`);
  const steps = c.layers.slice().reverse().map((l) => ({ op: l.split(":")[0], key: l.split(":")[1] }));
  const out = decode(encode(c.message, c.layers), steps).at(-1);
  assert(out.bytes && show(out.bytes) === c.message, `decode.json: “${c.title}” doesn't decode back (end with base64, hex or url after xor)`);
}

// Permissions
for (const c of load("permissions.json").challenges) assert(/^[0-7]{3}$/.test(c.answer), `permissions.json: ${c.file} answer must be three digits 0-7`);

// Log hunt
for (const k of load("loghunt.json").cases) {
  const log = k.lines.join("\n").toLowerCase();
  for (const q of k.questions) {
    assert(q.answers.length, `loghunt.json: “${q.question}” has no answers`);
    if (q.evidence) assert(log.includes(q.evidence.toLowerCase()), `loghunt.json: evidence “${q.evidence}” isn't in the ${k.title} log`);
  }
}

// Shell quest: every objective's flag can be found with the commands its hint suggests
for (let n = 0; n < 50; n++) {
  const w = makeWorld();
  const sh = (line, cwd = w.home) => run(w, cwd, line).out;
  const [readme, notes, backup, log, cron] = w.objectives.map((o) => o.flag);
  assert(sh("cat README.txt").includes(readme), "shell: README flag");
  assert(!sh("ls").includes(".notes") && sh("ls -a").includes(".notes") && sh("cat .notes").includes(notes), "shell: hidden notes flag");
  const bak = sh('find /var/www -name "*.bak"').split("\n")[0];
  assert(bak.endsWith(".bak") && sh(`cat ${bak}`).includes(backup), "shell: backup flag");
  assert(sh("grep ERROR /var/log/app.log").includes(log), "shell: log flag");
  const job = sh("ls /etc/cron.d").split(/\s+/).find((f) => sh(`cat /etc/cron.d/${f}`).includes(cron));
  assert(job, "shell: cron flag");
  assert(run(w, w.home, "cd ../..").cwd === "/" && run(w, "/", "cd ~").cwd === w.home, "shell: cd");
  assert(run(w, w.home, `submit ${readme}`).submit === readme, "shell: submit");
}

// Real or fake link: the browser's own URL parser must agree with every answer
for (let n = 0; n < 300; n++) {
  const { base, links } = makeRound();
  assert(links.length === 10 && links.filter((l) => l.real).length === 5, "links: 5 real and 5 fake");
  for (const l of links) {
    const host = new URL(l.url).hostname;
    const ours = host === base || host.endsWith("." + base);
    assert(ours === l.real, `links: ${l.url} is marked ${l.real ? "real" : "fake"}`);
    assert(host === l.owner || host.endsWith("." + l.owner), `links: owner ${l.owner} doesn't match ${l.url}`);
  }
}

// Fix the query: one approved fix per round, and a result for every test
for (const r of load("query.json").rounds) {
  assert(r.options.filter((o) => o.correct).length === 1, `query.json: “${r.title}” needs exactly one correct option`);
  for (const o of r.options) assert(o.tests.length === r.tests.length, `query.json: “${r.title}” has an option with the wrong number of test results`);
}

console.log("labs OK: every lab checks out");
