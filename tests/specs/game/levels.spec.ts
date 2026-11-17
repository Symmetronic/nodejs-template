import { type Level } from "#/src/level.ts";
import { LEVELS } from "#/src/levels/index.ts";
import { createRail } from "#/src/rail.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const MINIMUM_SECONDS = 60;
const MAXIMUM_SECONDS = 90;
const STARTING_AMMO = 12;
const CRATE_AMMO = 6;
const BODY_HITS = 2;
const SMALL = 3;
const MEDIUM = 5;
const LARGE = 7;
const MARGIN = 1.2;
const LEVEL_COUNT = 2;

function zombieCount(level: Level): number {
  return level.encounters.reduce(
    (total, encounter) => total + encounter.zombies.length,
    0,
  );
}

function spareAmmo(level: Level): number {
  const ammo = STARTING_AMMO + level.crates.length * (CRATE_AMMO - 1);
  return ammo / (zombieCount(level) * BODY_HITS);
}

function secondLevel(): Level {
  const second = LEVELS[1];
  assert.ok(second);
  return second;
}

describe("level list", () => {
  it("has a first level with a rail, geometry, lights and a speed", () => {
    const [first] = LEVELS;
    assert.ok(createRail(first.rail).length > 0);
    assert.ok(first.boxes.length > 0);
    assert.ok(first.lights.length > 0);
    assert.ok(first.speed > 0);
  });

  it("has two levels", () => {
    assert.equal(LEVELS.length, LEVEL_COUNT);
  });

  it("places encounters in order along every rail with delayed zombies", () => {
    for (const level of LEVELS) {
      const { length } = createRail(level.rail);
      const stops = level.encounters.map((encounter) => encounter.stopDistance);
      assert.deepEqual(
        stops,
        [...stops].sort((a, b) => a - b),
      );
      assert.ok(stops.every((stop) => stop > 0 && stop < length));
      assert.ok(level.encounters.every((e) => e.zombies.length > 0));
      assert.ok(
        level.encounters.every(
          (e) => (e.startDistance ?? e.stopDistance) <= e.stopDistance,
        ),
      );
    }
  });

  it("has encounters of about 3, 5 and 7 zombies", () => {
    const [first] = LEVELS;
    assert.deepEqual(
      first.encounters.map((encounter) => encounter.zombies.length),
      [SMALL, MEDIUM, LARGE],
    );
  });

  it("takes about a minute to play each level", () => {
    for (const level of LEVELS) {
      const { length } = createRail(level.rail);
      const waiting = level.encounters.reduce(
        (total, encounter) =>
          total + Math.max(...encounter.zombies.map((spawn) => spawn.delay)),
        0,
      );
      const seconds = length / level.speed + waiting;
      assert.ok(seconds >= MINIMUM_SECONDS && seconds <= MAXIMUM_SECONDS);
    }
  });

  it("has enough ammo crates to kill every zombie with body hits", () => {
    for (const level of LEVELS) {
      assert.ok(spareAmmo(level) >= 1);
    }
  });

  it("gives the first level spare ammo for misses", () => {
    const [first] = LEVELS;
    assert.ok(
      STARTING_AMMO + first.crates.length * CRATE_AMMO >=
        zombieCount(first) * BODY_HITS * MARGIN,
    );
  });

  it("rations ammo tighter in the second level than in the first", () => {
    const [first] = LEVELS;
    assert.ok(spareAmmo(secondLevel()) < spareAmmo(first));
  });

  it("starts an encounter of the second level before the camera stops", () => {
    assert.ok(
      secondLevel().encounters.some(
        (e) =>
          e.startDistance !== undefined && e.startDistance < e.stopDistance,
      ),
    );
  });
});
