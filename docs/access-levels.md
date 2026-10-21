# Who can do what in the CMS

Anyone can suggest a change through the CMS, but a change only goes live once someone allowed to publish it does.
The rules are enforced by GitHub, not by the CMS: the CMS just follows them. How the CMS itself is built:
[cms.md](cms.md).

> **Status (21 Oct 2026):** live on `Cyberheaven/cyberheaven.github.io` (ruleset *Review before publishing*, id 25525380).
> Maintainers: PurpleShonen, medhansh5, timo123421. Editors and Writers: nobody yet.

## The four levels

| Level | Who | Can | Can't |
| --- | --- | --- | --- |
| **Contributor** | Anyone with a GitHub account | Edit anything in the CMS. Their changes are saved in their own copy of the repo (a fork) and sent for review. | Publish. |
| **Writer** | The `Writers` team | Edit anything; save drafts; mark them In Review or Ready. | Publish until an editor or maintainer has approved the change. |
| **Editor** | The `Editors` team | Everything a writer can, and approve changes to **articles, team profiles and their images**. | Approve pages, settings, labs or code. |
| **Maintainer** | The `Maintainers` team | Publish anything straight from the CMS, no approval needed; approve anything. | — |

Which files editors may approve is set in [`.github/CODEOWNERS`](../.github/CODEOWNERS). Team roles shown on the
site's `/team` page (Founder, Author…) are only for display; they aren't linked to these GitHub teams.

The repo is public, so there's no separate read-only level: anyone can already read everything.

## How it works

- **Every save is a draft.** In the CMS (`publish_mode: editorial_workflow` in `public/admin/config.yml`), saving
  an entry creates a branch `cms/<collection>/<entry>` and a draft pull request on GitHub. Nothing on `main` (the
  live site) changes yet.
- **Statuses.** An entry moves Draft → In Review → Ready with the *Status* menu in the editor's top bar. These are
  only labels on the pull request (`sveltia-cms/draft`, `…/pending_review`, `…/pending_publish`), not approvals.
  The *Workflow* page in the top bar shows every entry by status.
- **Publish** appears once an entry is Ready. It merges the pull request into `main`, and the site rebuilds.
- **GitHub decides whether the merge is allowed.** A ruleset on `main` (*Review before publishing*,
  [`.github/rulesets/review-before-publishing.json`](../.github/rulesets/review-before-publishing.json)) requires a
  pull request with one approval from a code owner of the changed files. The `Maintainers` team (and repo admins)
  may skip that. When someone may not publish yet, the CMS says *"Couldn't publish the entry. Please try again."*:
  it means the change needs an approval first.
- **Contributors** (no write access) work through open authoring (`open_authoring: true` in `config.yml`): on their
  first sign-in the CMS offers to fork the repo; their saves go to their fork; *In Review* opens a pull request.
  They never see Publish.
- **Code owners are asked automatically.** When a pull request is opened, GitHub requests a review from the teams
  in `CODEOWNERS` for those files, so they get a notification.

## Day to day

**Writing (any level).** Save as often as you like: it stays a draft. When it's ready, set *Status → In Review*.
Contributors: that's the moment your change is sent.

**Approving (editors and maintainers).** Open the pull request on GitHub (from the notification, or the repo's
*Pull requests* tab). Look at *Files changed*, then *Review changes → Approve*. After that, the writer or you can
press *Publish* in the CMS, or *Merge* on GitHub. GitHub never lets you approve your own pull request: an editor's
own article needs another editor or a maintainer.

**Contributors' changes** come from a fork, so the CMS can't publish them: approve and merge them on GitHub.
Maintainers can also tick *"Merge without waiting for requirements to be met (bypass rules)"* on GitHub, but
approving first leaves a record of who reviewed it.

**Maintainers** can simply set *Ready* and press *Publish*.

## Adding and removing people

Teams are at <https://github.com/orgs/Cyberheaven/teams>. Adding someone to a team invites them to the
organisation if they aren't in it yet; they must accept the email invitation. With the GitHub CLI (an org owner,
token with the `admin:org` scope):

```sh
gh api -X PUT orgs/Cyberheaven/teams/writers/memberships/<username>      # or editors / maintainers
gh api -X DELETE orgs/Cyberheaven/teams/writers/memberships/<username>   # remove
```

Contributors need nothing. To make someone a contributor again, remove them from the teams. People who are repo
admins (Settings → Collaborators and teams) can also skip the review rule; keep that list short.

## Setting it up on a repo

How it was done on `Cyberheaven/cyberheaven.github.io` (and first on a sandbox copy). Repeat it for a new or moved repo.

1. **The CMS:** `public/admin/config.yml` has `publish_mode: editorial_workflow`, and under `backend:`
   `open_authoring: true` and `auth_scope: public_repo` (a public repo needs no wider access).
2. **Teams** (once per organisation, already done): `Maintainers` (id 20225791), `Editors` (20225792), `Writers`
   (20225793). Creating them makes you a member; remove yourself from the ones you don't belong in.
3. **Team access to the repo:**
   ```sh
   R=Cyberheaven/cyberheaven.github.io
   gh api -X PUT orgs/Cyberheaven/teams/maintainers/repos/$R -f permission=maintain
   gh api -X PUT orgs/Cyberheaven/teams/editors/repos/$R -f permission=push
   gh api -X PUT orgs/Cyberheaven/teams/writers/repos/$R -f permission=push
   ```
   Teams in `CODEOWNERS` must have write access, or GitHub ignores the line. Check:
   `gh api repos/$R/codeowners/errors` should list no errors.
4. **Repo settings:** `gh api -X PATCH repos/$R -F allow_auto_merge=true -F delete_branch_on_merge=true`
   (the CMS uses auto-merge when checks are still running; merged CMS branches are deleted).
5. **The rule on `main`:** `gh api -X POST repos/$R/rulesets --input .github/rulesets/review-before-publishing.json`.
   The JSON names the Maintainers team by id; if the team is ever recreated, put the new id in
   (`gh api orgs/Cyberheaven/teams/maintainers --jq .id`). To change the rule later, edit it on GitHub
   (Settings → Rules → Rulesets) and copy it back into the JSON
   (`gh api repos/$R/rulesets/<id>` shows it).

## Turning it off

To go back to "Save goes straight to the live site": remove `publish_mode` and the two `backend` lines from
`config.yml`, and disable or delete the ruleset (Settings → Rules → Rulesets). Open CMS pull requests can be merged
or closed on GitHub. `CODEOWNERS` can stay; without the rule it only requests reviews.

## Testing changes safely

Test changes to this setup on a throwaway copy of the repo, never on the live one. The copy used on 21 Oct 2026
(`Cyberheaven/cms-sandbox`) was deleted afterwards; to make a new one:

1. `gh repo create Cyberheaven/cms-sandbox --public`, then push `main` to it, with `repo:` in
   `public/admin/config.yml` changed to `Cyberheaven/cms-sandbox` (one extra commit on a local branch).
2. Give it the same settings as the real repo (steps 3–5 of [Setting it up on a repo](#setting-it-up-on-a-repo)).
3. Run the CMS against it locally: `node scripts/cms-preview/setup.mjs /tmp/sb --github Cyberheaven/cms-sandbox`
   ([cms.md](cms.md#testing-the-cms-locally)), and sign in with a token (`gh auth token`).
4. To test a lower level, use a second GitHub account: add it to the sandbox as a collaborator with write access
   (a writer), or with no access at all (a contributor).
5. Afterwards delete the sandbox, and any forks the test accounts made of it (deleting a repo doesn't delete its
   forks).

Tested on 21 Oct 2026, in Chrome and Firefox:

| Level | Result |
| --- | --- |
| Maintainer | Save → draft pull request; Ready → Publish merged it with no approval. |
| Writer | Publish refused (*"Couldn't publish the entry"*) until a maintainer approved; then the writer could publish. |
| Editor | Not tested with a real editor account. Checked that GitHub asks editors and maintainers to review article changes, and only maintainers for settings. |
| Contributor | First sign-in offered a fork; saving went to the fork; *In Review* opened a pull request; no Publish button. A maintainer approved and merged it on GitHub. |

## Signing in

Everyone signs in at <https://cyberheaven.github.io/admin/> with *Sign In with GitHub* (working since 21 Oct 2026).
How that works and how to fix it: [cms-login.md](cms-login.md). The level someone gets depends only on their GitHub
teams, never on how they signed in.
