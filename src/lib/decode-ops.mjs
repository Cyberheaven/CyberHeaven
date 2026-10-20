// Encoding layers for "Decode the layers" (/play/decode). Every operation works on bytes (Uint8Array),
// so layers stack like they do in real malware and CyberChef. The page encodes each challenge's
// plain message at build time with `encode`; learners peel the layers off in the browser with `decode`.
// Check: `node scripts/check-labs.mjs`.

const enc = new TextEncoder();
const ascii = (s) => enc.encode(s);
const str = (b) => String.fromCharCode(...b);
const hexOf = (n) => n.toString(16).padStart(2, "0");

const rot13 = (b) => b.map((c) => (c >= 65 && c <= 90 ? ((c - 52) % 26) + 65 : c >= 97 && c <= 122 ? ((c - 84) % 26) + 97 : c));
const xor = (b, key) => b.map((c) => c ^ key);

export const OPS = {
  base64: {
    label: "From Base64",
    about: "Letters, digits, + and /, often ending in = or ==.",
    encode: (b) => ascii(btoa(str(b))),
    decode: (b) => {
      const s = str(b).replace(/\s+/g, "");
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) throw new Error("This isn’t valid Base64.");
      return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    },
  },
  hex: {
    label: "From Hex",
    about: "Pairs of 0–9 and a–f. Two characters per byte.",
    encode: (b) => ascii(Array.from(b, hexOf).join("")),
    decode: (b) => {
      const s = str(b).replace(/\s+/g, "");
      if (!/^([0-9a-fA-F]{2})*$/.test(s)) throw new Error("This isn’t valid hex: it needs pairs of 0–9 and a–f.");
      return Uint8Array.from(s.match(/../g) ?? [], (h) => parseInt(h, 16));
    },
  },
  url: {
    label: "URL decode",
    about: "Percent signs followed by two hex digits, like %2F.",
    encode: (b) => ascii(Array.from(b, (c) => (/[A-Za-z0-9\-_.~]/.test(String.fromCharCode(c)) ? String.fromCharCode(c) : "%" + hexOf(c).toUpperCase())).join("")),
    decode: (b) => {
      const out = [];
      for (let i = 0; i < b.length; i++) {
        const h = str(b.slice(i + 1, i + 3));
        if (b[i] === 37 && /^[0-9a-fA-F]{2}$/.test(h)) {
          out.push(parseInt(h, 16));
          i += 2;
        } else out.push(b[i] === 43 ? 32 : b[i]);
      }
      return Uint8Array.from(out);
    },
  },
  rot13: { label: "ROT13", about: "Every letter shifted 13 places. Doing it twice gets you back.", encode: rot13, decode: rot13 },
  reverse: { label: "Reverse", about: "The same characters, back to front.", encode: (b) => b.slice().reverse(), decode: (b) => b.slice().reverse() },
  xor: {
    label: "XOR with key",
    about: "Every byte XORed with one secret byte. Needs the key (0–255).",
    keyed: true,
    encode: xor,
    decode: xor,
  },
};

/** Apply layers to a plain message, in order. A layer is "base64" or, for XOR, "xor:66". */
export function encode(text, layers) {
  return str(layers.reduce((b, l) => {
    const [op, key] = l.split(":");
    return OPS[op].encode(b, Number(key));
  }, ascii(text)));
}

/** Run decode steps on a string. Returns one result per step: { bytes } or { error }. */
export function decode(input, steps) {
  let b = ascii(input);
  return steps.map(({ op, key }) => {
    if (!b) return { error: "Fix the step above first." };
    try {
      b = OPS[op].decode(b, Number(key) & 255);
      return { bytes: b };
    } catch (e) {
      b = null;
      return { error: e.message };
    }
  });
}

/** Bytes as readable text: printable ASCII as is, anything else as a dot. */
export const show = (b) => Array.from(b, (c) => (c === 10 || (c >= 32 && c < 127) ? String.fromCharCode(c) : "·")).join("");
