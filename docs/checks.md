# Checks before publishing

Every pull request, including each change saved in the CMS, runs the checks in
[`.github/workflows/checks.yml`](../.github/workflows/checks.yml). A change can't be published until they pass:
the ruleset *Checks pass before publishing*
([`.github/rulesets/checks-pass.json`](../.github/rulesets/checks-pass.json)) requires the check called `Checks`.
Unlike the review rule ([access-levels.md](access-levels.md)), maintainers can't skip it; only repo admins can.

## What is checked

| Script | Fails when |
| --- | --- |
| `scripts/check-content.mjs` | Content contains HTML (other than the interactive widget line) or a link that runs code (`javascript:`), or Markdown the CMS editor would break (HTML tables, `<iframe>`, `* * *`). |
| `scripts/check-data.mjs` | A category, glossary topic or team role isn't in `src/data/categories.json`; a glossary term or resource link is listed twice; a content file has a field the CMS form (`public/admin/config.yml`) doesn't. |
| `scripts/check-labs.mjs` | A lab exercise can't be solved, or its answer isn't in its data. |
| `scripts/check-career.mjs` | A career quiz path can't win, or a run asks too many questions. |
| `scripts/check-youtube.mjs` | The YouTube link reader is broken. |
| `npm run build` | The site doesn't build (the build has its own checks, e.g. an article whose author doesn't exist). |
| `scripts/check-links.mjs` | A link or image on the built site points to a page or file of the site that doesn't exist. |

All of them run on every pull request, even after one fails, so one run lists everything to fix. Run them
yourself before pushing:

```sh
node scripts/check-content.mjs && node scripts/check-data.mjs && node scripts/check-labs.mjs \
  && node scripts/check-career.mjs && node scripts/check-youtube.mjs && npm run build && node scripts/check-links.mjs
```

**Why content may not contain HTML.** The site shows HTML written in Markdown as-is, scripts included. The site
and the CMS share one address (`cyberheaven.github.io`), and the CMS keeps everyone's sign-in in the browser there,
so a script slipped into an article could act as any maintainer who opens it. Reviewers can miss a line hidden in
a long article; the check doesn't. The interactive widget line (`<div data-widget="…"></div>`) is the one
exception. Code shown in an article belongs in `backticks` or a code block, where anything goes.

## When a check fails

- **In the CMS:** *Publish* says *"Couldn't publish the entry. Please try again."* (the same message as a missing
  approval). The reason is on the pull request on GitHub: *Checks* tab → the red step → its output names the file
  and line.
- **Publishing while the checks still run:** the CMS turns on GitHub's auto-merge, and the change goes live by
  itself once they pass (repo setting `allow_auto_merge`, see [access-levels.md](access-levels.md)).
- **Contributors' pull requests** (from a fork): GitHub doesn't run workflows for someone's first contribution until
  a maintainer presses *Approve and run* on the pull request (repo setting: Actions → *Require approval for
  first-time contributors*). Until then the check shows as waiting.

## Changing the checks

- Add a check: a script in `scripts/` that prints what's wrong and exits with 1, plus a step in `checks.yml` with
  `if: ${{ !cancelled() }}`. Add it to the table above and the command above.
- Keep the job's `name: Checks`: the ruleset asks for a check with that name from GitHub Actions
  (`integration_id` 15368). Renaming the job without changing the ruleset blocks every pull request.
- Apply the ruleset to a repo: `gh api -X POST repos/<owner>/<repo>/rulesets --input .github/rulesets/checks-pass.json`.
