import { intersectCrate, intersectZombie } from "#/src/shooting.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const EYE = { x: 0, y: 1.5, z: 0 } as const;
const FORWARD = { x: 0, y: 0, z: -1 } as const;
const FEET = { x: 0, y: 0, z: -10 } as const;
const AHEAD = { x: 0, y: 0, z: -1 } as const;
const DISTANCE = 10;
const HEAD_Y = 1.6;
const BODY_Y = 0.8;
const ABOVE_Y = 2.3;
const SIDE = 2;
const NEAR_SIDE = 0.35;
const CRATE_Y = 0.3;
const TOLERANCE = 0.1;

function rayTo(
  x: number,
  y: number,
  z: number,
): {
  origin: typeof EYE;
  direction: { x: number; y: number; z: number };
} {
  return {
    origin: EYE,
    direction: { x: x - EYE.x, y: y - EYE.y, z: z - EYE.z },
  };
}

describe("shooting at a zombie", () => {
  it("hits the head near the top", () => {
    const hit = intersectZombie(rayTo(0, HEAD_Y, FEET.z), FORWARD, FEET);
    assert.ok(hit);
    assert.equal(hit.zone, "head");
    assert.ok(hit.distance >= DISTANCE && hit.distance < DISTANCE + TOLERANCE);
  });

  it("hits the body below the head", () => {
    assert.equal(
      intersectZombie(rayTo(0, BODY_Y, FEET.z), FORWARD, FEET)?.zone,
      "body",
    );
  });

  it("hits the body beside the head at head height", () => {
    assert.equal(
      intersectZombie(rayTo(NEAR_SIDE, HEAD_Y, FEET.z), FORWARD, FEET)?.zone,
      "body",
    );
  });

  it("misses above, beside and behind", () => {
    assert.equal(
      intersectZombie(rayTo(0, ABOVE_Y, FEET.z), FORWARD, FEET),
      undefined,
    );
    assert.equal(
      intersectZombie(rayTo(SIDE, BODY_Y, FEET.z), FORWARD, FEET),
      undefined,
    );
    assert.equal(
      intersectZombie(rayTo(0, BODY_Y, -FEET.z), FORWARD, FEET),
      undefined,
    );
  });
});

describe("shooting at a crate", () => {
  it("hits a crate along the ray", () => {
    const hit = intersectCrate(rayTo(0, CRATE_Y, AHEAD.z * DISTANCE), {
      x: 0,
      y: 0,
      z: -DISTANCE,
    });
    assert.ok(hit !== undefined && hit > 0);
  });

  it("misses a crate to the side or behind", () => {
    const crate = { x: 0, y: 0, z: -DISTANCE };
    assert.equal(
      intersectCrate(rayTo(SIDE, CRATE_Y, -DISTANCE), crate),
      undefined,
    );
    assert.equal(intersectCrate(rayTo(0, CRATE_Y, DISTANCE), crate), undefined);
  });
});
