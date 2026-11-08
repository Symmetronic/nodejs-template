#!/bin/sh
# Stop hook: refuse to end a turn on a tree that fails `npm run check`.
#
# Exit code 2 is a blocking error: the output on stderr is fed back to the
# agent, which then has to fix the failures instead of reporting success.
set -eu

cd "${CLAUDE_PROJECT_DIR:-.}"

# .npmrc resolves the registry from $NPM_REGISTRY, which the Dev Container sets
# but an outside shell does not. Without it every npm call, even `npm run`,
# aborts with ERR_INVALID_URL. Default it so the check stays runnable anywhere.
: "${NPM_REGISTRY:=https://registry.npmjs.org/}"
export NPM_REGISTRY

if output=$(npm run check 2>&1); then
  exit 0
fi

printf '%s\n' "$output" >&2
printf '\n`npm run check` failed. Fix every error above before ending the turn.\n' >&2
exit 2
