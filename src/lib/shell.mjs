// A pretend Linux shell for "Shell quest" (/play/shell). The filesystem is a plain object built fresh
// for every game by makeWorld(), so file names, places and flags change each time. Nothing here runs
// real commands: run() just looks things up in that object and returns text.
// Check: `node scripts/check-labs.mjs`.
import { int, pick, sample, token } from "./random.mjs";

const flag = () => `CH{${token(8, "abcdef0123456789")}}`;

/** A new server to investigate, plus the objectives (each with the flag that completes it). */
export function makeWorld() {
  const user = pick(["maya", "sam", "priya", "jonas", "lena", "omar"]);
  const site = pick(["shop", "blog", "intranet", "wiki"]);
  const flags = Array.from({ length: 5 }, flag);
  const backup = `${pick(["config", "settings", "db", "site"])}-${int(2019, 2025)}.bak`;
  const deep = `/var/www/${site}/${pick(["assets", "includes", "lib"])}/${pick(["old", "tmp", "archive"])}`;
  const appLog = [];
  for (let n = 0; n < 160; n++) {
    const t = `2026-10-14T${String(8 + Math.floor(n / 20)).padStart(2, "0")}:${String((n * 7) % 60).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}Z`;
    appLog.push(`${t} ${pick(["INFO", "INFO", "INFO", "DEBUG", "WARN"])} ${pick(["request served", "cache refreshed", "user session started", "health check ok", "slow query (412ms)", "image resized"])}`);
  }
  appLog.splice(int(40, 150), 0, `2026-10-14T11:${int(10, 59)}:00Z ERROR audit marker for responders: ${flags[3]}`);

  const files = {
    [`/home/${user}/README.txt`]: `Welcome, responder.\nThis is a copy of a server we need checked after last night's alert.\nWork through the objectives on the right. First flag: ${flags[0]}\n`,
    [`/home/${user}/.notes`]: `Hidden files start with a dot. ls won't show them unless you ask with ls -a.\nFlag: ${flags[1]}\n`,
    [`/home/${user}/todo.txt`]: "- rotate logs\n- check the backups\n- review cron jobs\n",
    [`${deep}/${backup}`]: `# old backup left in the web folder: anyone could download it.\n# report it and remove it.\nflag=${flags[2]}\n`,
    [`/var/www/${site}/index.html`]: `<h1>${site}</h1>\n`,
    [`/var/www/${site}/assets/logo.svg`]: "<svg></svg>\n",
    "/var/log/app.log": appLog.join("\n") + "\n",
    "/var/log/syslog": "Oct 14 08:00:01 server systemd[1]: Started Daily apt upgrade.\nOct 14 08:00:09 server systemd[1]: Finished Daily apt upgrade.\n",
    "/etc/hostname": `${site}-server\n`,
    "/etc/cron.d/logrotate": "0 3 * * * root /usr/sbin/logrotate /etc/logrotate.conf\n",
    [`/etc/cron.d/${pick(["sys-update", "cache-clean", "telemetry"])}`]: `# added last night, not in our change log. Flag it for the incident team.\n# ${flags[4]}\n*/5 * * * * root /tmp/.cache/run.sh\n`,
    "/tmp/.keep": "",
  };
  const objectives = [
    { title: "Find your feet", task: "Run pwd to see where you are, then ls to list what's here. Read the README with cat.", hint: "cat README.txt", flag: flags[0] },
    { title: "Hidden in plain sight", task: "Someone left notes in your home folder, but plain ls won't show them.", hint: "ls -a, then cat the file that starts with a dot.", flag: flags[1] },
    { title: "A forgotten backup", task: `There's a .bak file somewhere under /var/www. Backups in a web folder can leak secrets. Find it.`, hint: 'find /var/www -name "*.bak"', flag: flags[2] },
    { title: "Needle in the log", task: "/var/log/app.log is long. One ERROR line was left for responders. Find it without reading every line.", hint: "grep ERROR /var/log/app.log", flag: flags[3] },
    { title: "An unexpected schedule", task: "Scheduled jobs live in /etc/cron.d. One was added last night and isn't in the change log. Read them.", hint: "ls /etc/cron.d, then cat each file.", flag: flags[4] },
  ];
  return { user, home: `/home/${user}`, files, objectives };
}

// ---------- paths ----------
const norm = (cwd, p = "") => {
  const parts = (p.startsWith("/") ? p : `${cwd}/${p}`).split("/");
  const out = [];
  for (const s of parts) {
    if (!s || s === ".") continue;
    if (s === "..") out.pop();
    else out.push(s);
  }
  return "/" + out.join("/");
};
const isDir = (w, p) => p === "/" || Object.keys(w.files).some((f) => f.startsWith(p + "/"));
const children = (w, dir) => {
  const pre = dir === "/" ? "/" : dir + "/";
  const names = new Set();
  for (const f of Object.keys(w.files)) if (f.startsWith(pre)) names.add(f.slice(pre.length).split("/")[0]);
  return [...names].sort();
};
const glob = (pattern) => new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");

const HELP = `Commands you can use:
  pwd                 show where you are
  ls [-a] [folder]    list files (-a shows hidden ones)
  cd <folder>         move to a folder (cd .. goes up, cd ~ goes home)
  cat <file>          show a file
  head / tail <file>  show the first / last 10 lines
  grep [-i] <text> <file>   show lines containing text
  find <folder> -name "<pattern>"   search for files by name
  wc -l <file>        count lines
  clear               clear the screen
  submit <flag>       hand in a flag you found`;

/** Run one command line. Returns { out, cwd, clear?, submit? }. */
export function run(w, cwd, line) {
  const args = (line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((a) => a.replace(/^["']|["']$/g, ""));
  const [cmd, ...rest] = args;
  const flags = rest.filter((a) => a.startsWith("-") && a !== "-name");
  const plain = rest.filter((a) => !a.startsWith("-"));
  const file = (p) => {
    const path = norm(cwd, p);
    if (w.files[path] !== undefined) return { path, text: w.files[path] };
    throw new Error(isDir(w, path) ? `${p}: Is a directory` : `${p}: No such file or directory`);
  };
  try {
    switch (cmd) {
      case undefined: return { out: "", cwd };
      case "help": return { out: HELP, cwd };
      case "pwd": return { out: cwd, cwd };
      case "clear": return { out: "", cwd, clear: true };
      case "whoami": return { out: w.user, cwd };
      case "ls": {
        const dir = norm(cwd, plain[0] ?? ".");
        if (w.files[dir] !== undefined) return { out: plain[0], cwd };
        if (!isDir(w, dir)) throw new Error(`ls: ${plain[0]}: No such file or directory`);
        const all = flags.some((f) => f.includes("a"));
        return { out: children(w, dir).filter((n) => all || !n.startsWith(".")).map((n) => (isDir(w, norm(dir, n)) ? n + "/" : n)).join("  "), cwd };
      }
      case "cd": {
        const target = !plain[0] || plain[0] === "~" ? w.home : norm(cwd, plain[0].replace(/^~/, w.home));
        if (!isDir(w, target)) throw new Error(`cd: ${plain[0]}: No such directory`);
        return { out: "", cwd: target };
      }
      case "cat": {
        if (!plain.length) throw new Error("cat: which file? Try cat README.txt");
        return { out: plain.map((p) => file(p).text.replace(/\n$/, "")).join("\n"), cwd };
      }
      case "head":
      case "tail": {
        const n = Number(rest[rest.indexOf("-n") + 1]) || 10;
        const lines = file(plain.filter((p) => !/^\d+$/.test(p)).at(-1)).text.replace(/\n$/, "").split("\n");
        return { out: (cmd === "head" ? lines.slice(0, n) : lines.slice(-n)).join("\n"), cwd };
      }
      case "wc": return { out: `${file(plain[0]).text.split("\n").length - 1} ${plain[0]}`, cwd };
      case "grep": {
        const [needle, ...paths] = plain;
        if (!needle || !paths.length) throw new Error("grep: usage: grep <text> <file>");
        const ci = flags.some((f) => f.includes("i"));
        const test = (l) => (ci ? l.toLowerCase().includes(needle.toLowerCase()) : l.includes(needle));
        return { out: paths.flatMap((p) => file(p).text.split("\n").filter((l) => l && test(l)).map((l) => (paths.length > 1 ? `${p}:${l}` : l))).join("\n"), cwd };
      }
      case "find": {
        const start = norm(cwd, plain[0] && plain[0] !== rest[rest.indexOf("-name") + 1] ? plain[0] : ".");
        const ni = rest.indexOf("-name");
        const re = ni >= 0 ? glob(rest[ni + 1] ?? "*") : null;
        const pre = start === "/" ? "/" : start + "/";
        const found = new Set();
        for (const f of Object.keys(w.files).filter((f) => f.startsWith(pre))) {
          const parts = f.slice(pre.length).split("/");
          parts.forEach((_, k) => {
            const path = pre + parts.slice(0, k + 1).join("/");
            if (!re || re.test(parts[k])) found.add(path);
          });
        }
        return { out: [...found].sort().join("\n"), cwd };
      }
      case "submit": return { out: "", cwd, submit: plain[0] ?? "" };
      case "sudo": return { out: "sudo: not needed here. This is a read-only copy for investigation.", cwd };
      case "rm":
      case "mv":
      case "cp":
      case "chmod":
      case "nano":
      case "vim": return { out: `${cmd}: this copy is read-only. Investigate, note what you find, and report it.`, cwd };
      default: return { out: `${cmd}: command not found. Type help to see what's available.`, cwd };
    }
  } catch (e) {
    return { out: e.message, cwd, error: true };
  }
}
