import { LEVELS } from "#/src/levels/index.ts";
import { createRail } from "#/src/rail.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
});
