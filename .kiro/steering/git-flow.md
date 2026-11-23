---
inclusion: always
---

# Git Flow

Rules for branching, committing, and tagging in this repository. Follow them for every
git operation. They reflect the history that already exists here: a linear, rebase-based
flow with conventional commits and no merge commits.

## Repository facts

- Remote: `origin` = `https://github.com/gautric/sokoban.git`. Do not add other remotes.
- History is strictly linear: `git log --merges` is empty. Keep it that way.
- Commit subjects follow Conventional Commits with a scope (`feat(rendering): ...`).
- Milestones are marked with lightweight tags.

## Branch model

| Branch           | Role                                                              |
|------------------|-------------------------------------------------------------------|
| `main`           | The game. **Every push deploys to GitHub Pages** (`sokoban.autric.net`) via `.github/workflows/pages.yml`, gated on `make check` + `make lint`. |
| `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…` | Short-lived work branches from `main`. |

Rules:

- Verify the current branch with `git status -sb` before any write operation.
- Never push to `main` directly. Push a work branch (`git push origin <branch>`) and
  open a pull request; it lands on `main` by rebase / fast-forward once reviewed.
- Never `git merge --no-ff`; never create merge commits.

## Commit rules

- Only create a commit when the user explicitly asks. If intent is unclear, ask first.
- Stage named files (`git add path/to/file`). Never `git add -A` or `git add .`.
- One logical change per commit. Split unrelated work.
- Never commit `.venv/`, `static/`, `.DS_Store`, build output, or anything matched by
  `.gitignore`. Flag any file that could hold secrets before staging it.
- Never amend a commit that is not the immediate previous one you just authored, and
  never amend after a pre-commit hook failure: fix, re-stage, make a new commit.
- Keep hooks enabled. Do not pass `--no-verify`.

### Message format

```
<type>(<scope>): <imperative summary, lower case, no trailing period>

<optional body: why the change was made, wrapped at 72 chars>
```

Allowed types, in the order of how often they appear here: `feat`, `refactor`, `fix`,
`docs`, `chore`, `style`, `test`, `perf`, `build`.

Scopes already in use, reuse them before inventing new ones: `rendering`, `ui`, `input`,
`audio`, `config`, `assets`, `i18n`, `typography`, `kiro`, `levels`, `.gitignore`.

Subject line stays under 72 characters. Examples from this repo's history:

```
feat(ui): add controls panel and refactor game panels styling
refactor(rendering): simplify player shadow to use dynamic shadow casting
chore(.gitignore): exclude static directory from version control
```

## Tags

- Tag meaningful milestones on `main` with a short lowercase slug,
  no `v` prefix unless the user asks for a version number.
- Create tags only when the user asks. Never delete or move an existing tag.

## Forbidden without explicit user permission

`push --force`, `push --force-with-lease`, `reset --hard`, `clean -f`, `branch -D`,
`rebase` of already-shared commits, `filter-branch`, `gc --prune=now`, editing
`git config`, and any interactive flag (`-i`) since there is no terminal to drive it.

## Standard sequences

Start a piece of work:

```bash
git status -sb                       # confirm branch is clean and correct
git switch -c feat/<slug>            # only if the change is large or risky
```

Commit finished work:

```bash
git status --short                   # review what changed
git diff -- <files>                  # read before staging
git add <files>
git commit -m "feat(<scope>): <summary>"
```

Ship a work branch (main deploys on push, so it goes through a pull request):

```bash
git fetch origin && git rebase origin/main   # from the work branch
make check && make lint
git push origin feat/<slug>
gh pr create --base main --head feat/<slug>
```

## AI-DLC interaction

This flow sits alongside `core-workflow.md`. Git operations are not an AI-DLC stage and
do not require stage approval, but they do require the explicit user request described
above. Log any commit or tag you create in `aidlc-docs/audit.md` by appending to it.
