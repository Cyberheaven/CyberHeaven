// A small YARA-style rule engine for "Write the rule" (/play/rules). It understands the core of real YARA:
//
//   strings:
//     $a = "text"            exact text (add nocase to ignore upper/lower case)
//     $b = /regex/i          a regular expression
//   condition:
//     any of them | all of them | 2 of them | $a and ($b or not $c)
//
// No hex strings, counts (#a) or offsets (@a): enough to learn the idea, small enough to read.
// Check: `node scripts/check-labs.mjs`.

/** Parse rule text into { strings: Map(name -> RegExp), condition } or throw an Error with a friendly message. */
export function parseRule(src) {
  const lines = src.split("\n").map((l) => l.replace(/(^|\s)\/\/.*$/, "").trim());
  const strings = new Map();
  let section = "";
  const cond = [];
  for (const line of lines) {
    if (!line || /^rule\b|^[{}]$/.test(line) || line === "meta:") continue;
    if (line === "strings:" || line === "condition:") {
      section = line;
      continue;
    }
    if (section === "condition:") {
      cond.push(line.replace(/}$/, ""));
      continue;
    }
    if (section !== "strings:") throw new Error(`Put “${line}” under strings: or condition:.`);
    const m = line.match(/^(\$\w+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"\s*(nocase)?|\/(.+)\/([is]*))$/);
    if (!m) throw new Error(`Can’t read “${line}”. Try $name = "text" or $name = /regex/.`);
    const [, name, text, nocase, re, flags] = m;
    if (strings.has(name)) throw new Error(`${name} is defined twice.`);
    try {
      strings.set(name, text !== undefined ? new RegExp(text.replace(/\\(.)/g, "$1").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), nocase ? "i" : "") : new RegExp(re, flags));
    } catch {
      throw new Error(`${name}: that regular expression isn’t valid.`);
    }
  }
  if (!strings.size) throw new Error("Add at least one string under strings:.");
  const condition = cond.join(" ").trim();
  if (!condition) throw new Error("Add a condition, for example: any of them");
  evaluate(condition, new Set()); // throws on a bad condition before any sample is scanned
  for (const used of condition.match(/\$\w+/g) ?? []) if (!strings.has(used)) throw new Error(`The condition uses ${used}, but there’s no string called that.`);
  return { strings, condition };
}

/** Does the rule match this text? Returns { hit, found: [names of strings that matched] }. */
export function scan(rule, text) {
  const found = new Set([...rule.strings].filter(([, re]) => re.test(text)).map(([n]) => n));
  return { hit: evaluate(rule.condition, found, rule.strings.size), found: [...found] };
}

// Tiny recursive-descent parser for: or > and > not > ( ) | $name | any/all/N of them
function evaluate(src, found, total = 0) {
  const tokens = src.match(/\(|\)|\$\w+|\w+/g) ?? [];
  if (tokens.join("").length !== src.replace(/\s+/g, "").length) throw new Error("The condition has a character it can’t read.");
  let i = 0;
  const peek = () => tokens[i];
  const take = (t) => {
    if (t && tokens[i] !== t) throw new Error(`Condition: expected “${t}”${tokens[i] ? ` before “${tokens[i]}”` : " at the end"}.`);
    return tokens[i++];
  };
  const or = () => {
    let v = and();
    while (peek() === "or") (take(), (v = and() || v));
    return v;
  };
  const and = () => {
    let v = not();
    while (peek() === "and") (take(), (v = not() && v));
    return v;
  };
  const not = () => (peek() === "not" ? (take(), !not()) : atom());
  const atom = () => {
    const t = take();
    if (t === "(") return ((t2) => (take(")"), t2))(or());
    if (t?.startsWith("$")) return found.has(t);
    if (t === "any" || t === "all" || /^\d+$/.test(t ?? "")) {
      take("of");
      take("them");
      const need = t === "any" ? 1 : t === "all" ? total : Number(t);
      return found.size >= need;
    }
    throw new Error(t ? `Condition: didn’t expect “${t}”.` : "The condition ends too early.");
  };
  const v = or();
  if (i < tokens.length) throw new Error(`Condition: didn’t expect “${tokens[i]}”.`);
  return v;
}
