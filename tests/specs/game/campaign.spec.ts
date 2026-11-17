import { nextLevel } from "#/src/campaign.ts";
import { type Level } from "#/src/level.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function level(speed: number): Level {
  return {
    speed,
    rail: [],
    boxes: [],
    lights: [],
    crates: [],
    encounters: [],
  };
}

const FASTER = 2;
const FIRST = level(1);
const SECOND = level(FASTER);
const LEVELS = [FIRST, SECOND];

describe("campaign", () => {
  it("advances to the next level in the list", () => {
    assert.equal(nextLevel(LEVELS, FIRST), SECOND);
  });

  it("has no next level after the last one", () => {
    assert.equal(nextLevel(LEVELS, SECOND), undefined);
  });
});
