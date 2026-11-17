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

describe("level list", () => {
  it("has a first level with a rail, geometry, lights and a speed", () => {
    const [first] = LEVELS;
    assert.ok(createRail(first.rail).length > 0);
    assert.ok(first.boxes.length > 0);
    assert.ok(first.lights.length > 0);
    assert.ok(first.speed > 0);
  });

  it("places encounters in order along the rail with delayed zombies", () => {
    const [first] = LEVELS;
    const { length } = createRail(first.rail);
    const stops = first.encounters.map((encounter) => encounter.stopDistance);
    assert.deepEqual(
      stops,
      [...stops].sort((a, b) => a - b),
    );
    assert.ok(stops.every((stop) => stop > 0 && stop < length));
    assert.ok(first.encounters.every((e) => e.zombies.length > 0));
  });

  it("has encounters of about 3, 5 and 7 zombies", () => {
    const [first] = LEVELS;
    assert.deepEqual(
      first.encounters.map((encounter) => encounter.zombies.length),
      [SMALL, MEDIUM, LARGE],
    );
  });

  it("takes about a minute to play", () => {
    const [first] = LEVELS;
    const { length } = createRail(first.rail);
    const waiting = first.encounters.reduce(
      (total, encounter) =>
        total + Math.max(...encounter.zombies.map((spawn) => spawn.delay)),
      0,
    );
    const seconds = length / first.speed + waiting;
    assert.ok(seconds >= MINIMUM_SECONDS && seconds <= MAXIMUM_SECONDS);
  });

  it("has enough ammo crates to kill every zombie with body hits", () => {
    const [first] = LEVELS;
    const zombies = first.encounters.reduce(
      (total, encounter) => total + encounter.zombies.length,
      0,
    );
    assert.ok(
      STARTING_AMMO + first.crates.length * CRATE_AMMO >=
        zombies * BODY_HITS * MARGIN,
    );
  });
});
