#!/bin/sh

readonly PROJECT_DIRECTORY="${CLAUDE_PROJECT_DIR:-.}"
readonly EXIT_CODE_THAT_ALLOWS_STOPPING=0
readonly EXIT_CODE_THAT_BLOCKS_STOPPING=2

readonly HOOK_INPUT="$(cat)"

working_tree_has_changes() {
  [ -n "$(git status --porcelain)" ]
}

run_verify_with_output_sent_to_agent() {
  npm run verify >&2
}

stopping_was_already_blocked_once() {
  printf '%s' "$HOOK_INPUT" | node --input-type=module --eval '
    import { text } from "node:stream/consumers";
    const hookInput = JSON.parse((await text(process.stdin)) || "{}");
    process.exit(hookInput.stop_hook_active === true ? 0 : 1);
  '
}

cd "$PROJECT_DIRECTORY" || exit "$EXIT_CODE_THAT_ALLOWS_STOPPING"

working_tree_has_changes || exit "$EXIT_CODE_THAT_ALLOWS_STOPPING"

run_verify_with_output_sent_to_agent && exit "$EXIT_CODE_THAT_ALLOWS_STOPPING"

if stopping_was_already_blocked_once; then
  echo "npm run verify still fails after one fix attempt; allowing stop so the agent cannot loop forever." >&2
  exit "$EXIT_CODE_THAT_ALLOWS_STOPPING"
fi

exit "$EXIT_CODE_THAT_BLOCKS_STOPPING"
