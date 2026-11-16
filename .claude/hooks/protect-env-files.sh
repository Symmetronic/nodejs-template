#!/bin/sh

readonly EXIT_CODE_THAT_ALLOWS_TOOL_USE=0
readonly EXIT_CODE_THAT_BLOCKS_TOOL_USE=2
readonly ENV_FILE_REFERENCE='(^|[^[:alnum:]_.-])\.env($|[^[:alnum:]_.-])'

bash_command() {
  node --input-type=module --eval '
    import { text } from "node:stream/consumers";
    const hookInput = JSON.parse((await text(process.stdin)) || "{}");
    process.stdout.write(String(hookInput.tool_input?.command ?? ""));
  '
}

if bash_command | grep -Eq "$ENV_FILE_REFERENCE"; then
  echo "Blocked: this command references a .env file. .env files hold secrets that must stay out of the model context. Use .env.example or ask the user for the values you need." >&2
  exit "$EXIT_CODE_THAT_BLOCKS_TOOL_USE"
fi

exit "$EXIT_CODE_THAT_ALLOWS_TOOL_USE"
