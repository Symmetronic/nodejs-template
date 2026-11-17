import { type Level } from "#/src/level.ts";
import { level1 } from "#/src/levels/level-1.ts";
import { level2 } from "#/src/levels/level-2.ts";

export const LEVELS: readonly [Level, ...Level[]] = [level1, level2];
