#!/bin/sh

readonly PROJECT_DIRECTORY="${CLAUDE_PROJECT_DIR:-.}"
readonly EXIT_CODE_THAT_BLOCKS_STOPPING=2

run_verify_with_output_sent_to_agent() {
  cd "$PROJECT_DIRECTORY" && npm run verify >&2
}

run_verify_with_output_sent_to_agent || exit "$EXIT_CODE_THAT_BLOCKS_STOPPING"
