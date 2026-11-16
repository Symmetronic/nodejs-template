import settings from "#/.claude/settings.json" with { type: "json" };
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROJECT_DIRECTORY = fileURLToPath(new URL("../../", import.meta.url));
const EXIT_CODE_THAT_BLOCKS_TOOL_USE = 2;

function matches(matcher: string, toolName: string): boolean {
  return new RegExp(`^(?:${matcher})$`, "u").test(toolName);
}

export function preToolUseHooksBlock(
  toolName: string,
  toolInput: Readonly<Record<string, unknown>>,
): boolean {
  const commands = settings.hooks.PreToolUse.filter(({ matcher }) =>
    matches(matcher, toolName),
  ).flatMap(({ hooks }) => hooks.map(({ command }) => command));

  return commands.some(
    (command) =>
      spawnSync("sh", ["-c", command], {
        input: JSON.stringify({
          hook_event_name: "PreToolUse",
          tool_name: toolName,
          tool_input: toolInput,
        }),
        env: { ...process.env, CLAUDE_PROJECT_DIR: PROJECT_DIRECTORY },
      }).status === EXIT_CODE_THAT_BLOCKS_TOOL_USE,
  );
}
