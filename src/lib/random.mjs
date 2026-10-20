// Small helpers for labs that are different every time you play them.

export const int = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** `n` different items from `list`, in random order. */
export const sample = (list, n) => shuffle(list).slice(0, n);
/** A random string of `n` characters from `chars`. */
export const token = (n, chars = "abcdefghijklmnopqrstuvwxyz0123456789") => Array.from({ length: n }, () => pick(chars)).join("");

/** IP addresses from the ranges reserved for documentation (RFC 5737), so they never belong to anyone. */
export const docIp = (block = pick(["192.0.2", "198.51.100", "203.0.113"])) => `${block}.${int(2, 254)}`;
export const lanIp = () => `10.0.${int(1, 9)}.${int(10, 250)}`;

/** Fill placeholders in lab text: {n4} is one 4-digit number shared across a round, {r6} is a new 6-character token every time. */
export const fill = (text, shared = {}) =>
  text.replace(/\{(n4|r6)\}/g, (_, k) => (k === "n4" ? (shared.n4 ??= String(int(1000, 9999))) : token(6)));
