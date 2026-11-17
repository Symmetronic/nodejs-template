import { createRail } from "#/src/rail.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const EAST_TURN = [
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 1, z: -10 },
  { x: 5, y: 1, z: -10 },
] as const;

const LENGTH = 15;
const EARLY = 4;
const AFTER_TURN = 12;
const BEFORE_START = -3;
const BEYOND_END = 99;
const STEP = 7;
const HUGE_STEP = 100;

describe("rail", () => {
  it("measures the total length of its segments", () => {
    assert.equal(createRail(EAST_TURN).length, LENGTH);
  });

  it("samples the position and direction on the first segment", () => {
    const sample = createRail(EAST_TURN).sampleAt(EARLY);
    assert.deepEqual(sample.position, { x: 0, y: 1, z: -4 });
    assert.deepEqual(sample.direction, { x: 0, y: 0, z: -1 });
  });

  it("continues onto the next segment after a waypoint", () => {
    const sample = createRail(EAST_TURN).sampleAt(AFTER_TURN);
    assert.deepEqual(sample.position, { x: 2, y: 1, z: -10 });
    assert.deepEqual(sample.direction, { x: 1, y: 0, z: 0 });
  });

  it("clamps samples beyond both ends", () => {
    const rail = createRail(EAST_TURN);
    assert.deepEqual(rail.sampleAt(BEFORE_START).position, {
      x: 0,
      y: 1,
      z: 0,
    });
    assert.deepEqual(rail.sampleAt(BEYOND_END).position, {
      x: 5,
      y: 1,
      z: -10,
    });
  });

  it("advances up to the end and reports that it has ended", () => {
    const rail = createRail(EAST_TURN);
    const halfway = rail.advance(0, STEP);
    assert.equal(halfway, STEP);
    assert.equal(rail.hasEnded(halfway), false);
    const end = rail.advance(halfway, HUGE_STEP);
    assert.equal(end, rail.length);
    assert.equal(rail.hasEnded(end), true);
  });

  it("rejects rails without a segment", () => {
    assert.throws(() => createRail([{ x: 0, y: 0, z: 0 }]));
    assert.throws(() =>
      createRail([
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ]),
    );
  });
});
