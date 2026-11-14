# Coding Standards

These standards apply to everyone who changes this repository — humans and LLM agents alike.

The concrete rules live in the tool configuration files and scripts in this repository. This document does not repeat them; it only covers what tooling cannot express.

## Principles

**Conventional tools, uncompromising configuration.** Mainstream tools, every strictness knob at maximum. Warnings are errors, type-safety bypasses forbidden, broken builds don't emit, escape hatches closed.

**Enforced by tooling, not discipline.** Every rule checked by a machine — in the editor, on save, on commit, in the build. Unenforced conventions are hopes.

**One environment, end to end.** A pinned, self-provisioning environment is the source of truth: toolchain locked, editor settings versioned, external resources reachable only from inside.

## Code design

- **Deep modules.** Split code into modules, one per domain. Each hides a lot of logic behind a small, easy-to-understand interface that covers every caller's needs. Everything behind it is private.
- **Test the interface.** Tests use only a module's public interface and treat the implementation as a black box.
- **Ubiquitous language.** One concept, one term, used everywhere: code, tests, docs. No synonyms.
- **Code over comments.** Comments drift from the code; only the code is the truth. Make intent explicit with well-named functions and constants instead. Comment only what code cannot express, e.g. links to external sources or the reason behind a surprising decision.

## Working rules

- Work inside the Dev Container.
- A change is done only when `npm run verify` passes.
- Fix the code, not the checks. Never weaken, disable or work around a check, hook or CI step to get a green result.
- New conventions belong in tooling. If a rule matters, enforce it with a tool rather than documenting it here.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) with a capitalized summary, e.g. `chore: Add license check`.
- Keep each commit focused on one change.
- Changes reach `main` through pull requests.
