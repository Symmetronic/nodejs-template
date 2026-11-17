---
name: delegate
description: Grill the user about an idea, plan it as a tasks file, then hand it to a one-shot container that implements, reviews and opens a pull request on a new branch.
disable-model-invocation: true
model: opus
argument-hint: <idea>
---

# Delegate

A **delegate run** turns an idea into a pull request. You do the interactive part here; a one-shot container does the rest unattended.

The idea: $ARGUMENTS

## 1. Grilling

Read `.claude/skills/grilling/SKILL.md` and follow it to grill the user about the idea until you reach a shared understanding.

## 2. Tasks file

Read `.claude/skills/to-tasks/SKILL.md` and follow it, including the quiz, until the user approves the tasks.

Choose the branch name as `<type>/<kebab-case-slug>`, where `<type>` is the Conventional Commits type that best fits the whole change (e.g. `feat/add-user-login`). Write the tasks file to `.claude/skills/delegate/runs/<branch>/TASKS.md`.

## 3. Launch

Run this with the Bash tool in the background (`run_in_background: true`):

```sh
sh .claude/skills/delegate/scripts/run.sh <branch>
```

Tell the user the delegate run has started, that it logs to `.claude/skills/delegate/runs/<branch>/run.log`, and that they can keep working meanwhile.

## 4. Report

When the background command finishes, report its outcome from the tail of its output: the pull request URL on success, or the step that failed. On failure, remind the user that everything committed so far is on the remote branch.
