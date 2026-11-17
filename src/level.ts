import { type Point } from "#/src/rail.ts";

export type TextureName = "brick" | "concrete" | "floor";

interface Box {
  readonly center: Point;
  readonly size: Point;
  readonly texture: TextureName;
}

interface Light {
  readonly position: Point;
  readonly intensity: number;
  readonly flickers: boolean;
}

interface Spawn {
  readonly position: Point;
  readonly delay: number;
}

interface Encounter {
  readonly stopDistance: number;
  readonly zombies: readonly Spawn[];
}

export interface Level {
  readonly speed: number;
  readonly rail: readonly Point[];
  readonly boxes: readonly Box[];
  readonly lights: readonly Light[];
  readonly crates: readonly Point[];
  readonly encounters: readonly Encounter[];
}
