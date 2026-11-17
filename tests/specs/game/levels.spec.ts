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
});
