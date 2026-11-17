# Improve the Claude skills

A review of the Claude skills found small inconsistencies in the vendored skills and a reliability gap in the delegate skill. The `pr` skill references a nonexistent `GLOSSARY.md` and duplicates its attribution in frontmatter; `grilling` has a license but no credits; Codex-only `agents/openai.yaml` files are unused. The delegate implement step runs all tasks in one long Claude session, so context degrades on long task lists and failures surface only at the end; it should instead run one fresh session per task and check each task's result before moving on. Branch-name collisions should also surface before the user approves a tasks file, not after the container has built. No timeouts, resumability or extra logging are in scope.

## [x] 1. Make the pr skill a trimmed vendored copy

**Blocked by:** None

**Delivers:** The `pr` skill no longer points at a nonexistent glossary or duplicates its attribution, and its credits state honestly that it is no longer verbatim.

- The sentence "Use the user's domain language from `GLOSSARY.md`." is removed from the pr skill; "Skip all preambles and keep prose brief." stays
- The frontmatter `metadata` block (with `credits`) is removed; `name` and `description` stay
- The pr skill's CREDITS file says it is vendored from Matt Pocock's `pr` skill (same commit link) with two changes: the `GLOSSARY.md` sentence was dropped, and the frontmatter `metadata.credits` block was dropped because that attribution lives in the CREDITS file. The Dex Horthy / `show-me` paragraph stays

## [x] 2. Credit the grilling skill's source

**Blocked by:** None

**Delivers:** The grilling skill names its upstream source like the other vendored skills do.

- A CREDITS file next to the grilling skill, in the same style as the pr skill's, says it is vendored verbatim from [Matt Pocock](https://github.com/mattpocock)'s [`grilling`](https://github.com/mattpocock/skills/tree/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/productivity/grilling) skill (commit `5863806dd4e15c63174bee4e7515a4256792ecfa`), licensed under MIT (see LICENSE)

## [x] 3. Remove the Codex agent metadata

**Blocked by:** None

**Delivers:** The skills contain only files Claude Code uses.

- No `agents/openai.yaml` file (or empty `agents` directory) remains under `.claude/skills`

## [x] 4. Run one implement session per task

**Blocked by:** None

**Delivers:** A delegate run implements each task in its own fresh Claude session and stops at the first task that does not land cleanly, naming it.

- The delegate pipeline reads the numbers of the unticked tasks (`## [ ] N.` headings) from the tasks file and, in that order, starts one fresh session per task with the small model
- Each session is told to read the whole tasks file for context but implement only task N: make the change, run `npm run verify` until it passes, tick task N's heading checkbox, commit everything as exactly one Conventional Commit with a capitalized summary, never push, never change other tasks, finish with a clean working tree
- After each session the pipeline fails the run immediately, naming the task, unless: the working tree is clean, exactly one new commit exists since the session started, and task N is ticked; then `npm run verify` must pass on that commit, and the branch is pushed
- The final "every task is ticked" check after all tasks remains as a safety net
- The review step, pull request steps and secret handling are unchanged
- The README's "Implement step" line says Claude (Sonnet) implements each task in its own fresh session, one commit per task, and the paragraph about pushing reflects that the branch is pushed after every task

## [x] 5. Check the branch name before writing the tasks file

**Blocked by:** None

**Delivers:** A delegate run never gets launched with an invalid or already-taken branch name.

- Step 2 of the delegate skill instructs Claude, after choosing the branch name and before writing the tasks file, to run `git check-ref-format --branch <branch>` and `git ls-remote --exit-code --heads origin <branch>`, and to choose a different name if the name is invalid or the branch already exists on the remote
- The pipeline's own remote-branch check stays as a safety net
