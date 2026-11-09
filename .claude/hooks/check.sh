#!/bin/sh

readonly PROJECT_DIRECTORY="${CLAUDE_PROJECT_DIR:-.}"
readonly EXIT_CODE_THAT_BLOCKS_STOPPING=2

enter_project_directory() {
  cd "$PROJECT_DIRECTORY"
}

run_checks_with_output_sent_to_agent() {
  npm run check >&2
}

block_agent_from_stopping() {
  exit "$EXIT_CODE_THAT_BLOCKS_STOPPING"
}

enter_project_directory && run_checks_with_output_sent_to_agent || block_agent_from_stopping
