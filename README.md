# Node.js App Template

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

A simple template for Node.js applications.

See [CODING_STANDARDS.md](CODING_STANDARDS.md) for the principles and coding standards that apply to this repository.

## Delegate runs

`/delegate <idea>` in Claude Code turns an idea into a pull request:

1. Claude (Opus) grills you about the idea and plans it as a tasks file (`TASKS.md`) of one-commit vertical slices, which you approve.
2. A one-shot container, built from the same Dockerfile as the Dev Container, then works unattended on a new branch:
   1. **Implement step:** Claude (Sonnet) implements each task in its own fresh session, one commit per task.
   2. **Review step:** Claude (Opus) reviews the changes against the tasks and [CODING_STANDARDS.md](CODING_STANDARDS.md) and commits improvements.
   3. The tasks file is removed and Claude (Opus) opens a pull request.

Every commit is checked with `npm run verify` and the branch is pushed after every task and step, so on failure the remote branch keeps the work done so far. The container is removed either way. The log is in `.claude/skills/delegate/runs/<branch>/run.log`.

### Setup

1. Rebuild the Dev Container once, so it has Docker-in-Docker and the GitHub CLI.
2. Create a Claude token with `claude setup-token`.
3. Create a [fine-grained GitHub personal access token](https://github.com/settings/personal-access-tokens/new) for this repository only, with read and write access to **Contents** and **Pull requests**.
4. Copy `.env.example` to `.env` in the repository root and fill in both tokens. Use plain `KEY=value` lines without quotes.
5. Make sure `git config user.name` and `git config user.email` are set: delegate runs commit as you.

### Secrets

The GitHub token is only used by the container's script to clone, push and create the pull request; Claude sessions never receive it. The Claude token is visible to the commands, hooks and MCP servers Claude runs in the container. It can't be hidden from them: `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` needs unprivileged user namespaces, which Docker blocks by default, and it forces the permission mode back to default. Even with the scrub, the `claude` process itself holds the token, readable from `/proc/<pid>/environ`. Revoke it if you suspect a leak.

## Credits

The soundtrack [`src/assets/infected-sector.m4a`](src/assets/infected-sector.m4a) ("Infected Sector") was generated with [Suno](https://suno.com) v6.
