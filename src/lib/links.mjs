// Link generator for "Real or fake link?" (/play/links). Every organisation is made up and every
// domain uses the reserved .example and .test endings, so no link points at a real site.
// Each link is { url, real, owner, why }: owner is the domain that really controls the link.
// Check: `node scripts/check-labs.mjs`.
import { int, pick, shuffle } from "./random.mjs";

export const ORGS = [
  { name: "Northwind Bank", id: "northwindbank" },
  { name: "Contoso Mail", id: "contoso" },
  { name: "Fabrikam Shop", id: "fabrikam" },
  { name: "Woodgrove Health", id: "woodgrove" },
  { name: "Tailspin Air", id: "tailspin" },
  { name: "Litware Cloud", id: "litware" },
];

// Small, believable misspellings of a name
const typo = (id) => {
  const swaps = [
    [/o/, "0"], [/l/, "1"], [/i/, "l"], [/m/, "rn"], [/w/, "vv"], [/e/, "3"],
  ].filter(([re]) => re.test(id));
  const tricks = [
    ...swaps.map(([re, to]) => () => id.replace(re, to)),
    () => { const k = int(1, id.length - 2); return id.slice(0, k) + id[k] + id.slice(k); }, // doubled letter
    () => { const k = int(1, id.length - 2); return id.slice(0, k) + id.slice(k + 1); }, // dropped letter
  ];
  let out = id;
  while (out === id) out = pick(tricks)();
  return out;
};

export function makeRound(org = pick(ORGS), size = 10) {
  const base = `${org.id}.example`;
  const reals = [
    () => ({ url: `https://www.${base}/${pick(["account", "help", "offers", "contact"])}`, why: `The domain right before the first single slash is ${base}, ${org.name}'s real domain.` }),
    () => ({ url: `https://login.${base}/`, why: `login.${base} is a subdomain of ${base}, so ${org.name} controls it.` }),
    () => ({ url: `https://${base}/help/reset-password`, why: `Plain ${base} with a normal path. The path can say anything; the domain is what counts.` }),
    () => ({ url: `https://mail.${base}/inbox?from=${org.id}-security.test`, why: `Everything after ? is just data. The domain is still ${base}, even though the text mentions another site.` }),
    () => ({ url: `https://support.${base}/articles/${int(100, 999)}`, why: `support.${base} belongs to ${base}. Subdomains to the left of the real domain are fine.` }),
  ];
  const fakes = [
    () => { const owner = `${pick(["account-check", "secure-login", "verify-now"])}.test`; return { url: `https://${base}.${owner}/login`, owner, why: `Read the domain from the right: it ends in ${owner}. "${base}" is just a subdomain the attacker made up.` }; },
    () => { const owner = `${pick(["login-help", "id-verify", "secure-portal"])}.test`; return { url: `https://${owner}/${base}/sign-in`, owner, why: `The real name only appears in the path, after the slash. The site is ${owner}.` }; },
    () => { const owner = `${typo(org.id)}.example`; return { url: `https://www.${owner}/login`, owner, why: `Look closely: ${owner} is a lookalike spelling of ${base}.` }; },
    () => { const owner = `${org.id}-${pick(["support", "security", "refunds", "alerts"])}.example`; return { url: `https://${owner}/`, owner, why: `Adding a word with a hyphen makes a completely different domain: ${owner}.` }; },
    () => { const owner = `${org.id}.test`; return { url: `https://${owner}/login`, owner, why: `Same name, different ending. ${owner} is not ${base}; anyone can register a lookalike on another ending.` }; },
    () => { const owner = `203.0.113.${int(2, 254)}`; return { url: `https://${base}@${owner}/login`, owner, why: `Everything before @ is ignored as a username. This link really goes to the address ${owner}.` }; },
  ];
  const half = Math.floor(size / 2);
  const links = [
    ...shuffle(reals).concat(shuffle(reals)).slice(0, size - half).map((f) => ({ ...f(), real: true, owner: base })),
    ...shuffle(fakes).concat(shuffle(fakes)).slice(0, half).map((f) => ({ ...f(), real: false })),
  ];
  return { org, base, links: shuffle(links) };
}
