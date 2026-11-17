import { type Level } from "#/src/level.ts";

export function nextLevel(
  levels: readonly Level[],
  current: Level,
): Level | undefined {
  return levels[levels.indexOf(current) + 1];
}
