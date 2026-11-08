#!/bin/sh
# Stop hook: refuse to end a turn on a tree that fails `npm run check`.
# Exit code 2 blocks the stop and feeds stderr back to the agent.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 2
npm run check >&2 || exit 2
