import { createZombie } from "#/src/zombie.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ORIGIN = { x: 0, y: 0, z: 0 } as const;
const FAR = { x: 0, y: 0, z: -10 } as const;
const STEP = 0.1;
const MANY_STEPS = 400;
const ATTACK_SECONDS = 1.5;
const SHORT_WAIT = 1;
const FRAME_WAIT = 0.4;
const NEAR = { x: 0, y: 0, z: -1 } as const;
const TICKS = 30;
const ATTACKS = 3;
const TICKS_PER_ATTACK = 10;
const MELEE_LIMIT = 2;
const WALK_SECONDS = 1;

function arrive(): ReturnType<typeof createZombie> {
  const zombie = createZombie(FAR);
  for (let step = 0; step < MANY_STEPS; step += 1) {
    zombie.update(STEP, ORIGIN);
  }
  return zombie;
}

describe("zombie", () => {
  it("shambles straight towards the target", () => {
    const zombie = createZombie(FAR);
    zombie.update(WALK_SECONDS, ORIGIN);
    assert.equal(zombie.state, "walking");
    assert.equal(zombie.position.x, 0);
    assert.ok(zombie.position.z > FAR.z);
    assert.ok(zombie.position.z < 0);
  });

  it("stops at melee range and attacks", () => {
    const zombie = arrive();
    assert.equal(zombie.state, "attacking");
    assert.ok(Math.abs(zombie.position.z) > 0);
    assert.ok(Math.abs(zombie.position.z) < MELEE_LIMIT);
  });

  it("deals one damage per attack interval", () => {
    const zombie = createZombie(NEAR);
    let total = 0;
    for (let step = 0; step < TICKS; step += 1) {
      total += zombie.update(ATTACK_SECONDS / TICKS_PER_ATTACK, ORIGIN);
    }
    assert.equal(total, ATTACKS);
  });

  it("does not attack while still walking", () => {
    const zombie = createZombie(FAR);
    assert.equal(zombie.update(SHORT_WAIT, ORIGIN), 0);
  });

  it("alternates its walk frame", () => {
    const zombie = createZombie(FAR);
    const first = zombie.frame;
    zombie.update(FRAME_WAIT, ORIGIN);
    assert.notEqual(zombie.frame, first);
    zombie.update(FRAME_WAIT, ORIGIN);
    assert.equal(zombie.frame, first);
  });

  it("flinches after a body hit and then keeps walking", () => {
    const zombie = createZombie(FAR);
    zombie.hit("body");
    assert.equal(zombie.alive, true);
    assert.equal(zombie.state, "flinching");
    const { z } = zombie.position;
    zombie.update(STEP, ORIGIN);
    assert.equal(zombie.position.z, z);
    zombie.update(SHORT_WAIT, ORIGIN);
    assert.equal(zombie.state, "walking");
  });

  it("dies from a second body hit", () => {
    const zombie = createZombie(FAR);
    zombie.hit("body");
    zombie.hit("body");
    assert.equal(zombie.alive, false);
    assert.equal(zombie.state, "dying");
  });

  it("dies from one headshot", () => {
    const zombie = createZombie(FAR);
    zombie.hit("head");
    assert.equal(zombie.alive, false);
  });

  it("does not attack once dead", () => {
    const zombie = createZombie(NEAR);
    zombie.hit("head");
    let total = 0;
    for (let step = 0; step < TICKS; step += 1) {
      total += zombie.update(STEP, ORIGIN);
    }
    assert.equal(total, 0);
  });

  it("fades out after falling down", () => {
    const zombie = createZombie(FAR);
    zombie.hit("head");
    const opacity = (): number => zombie.opacity;
    assert.equal(opacity(), 1);
    zombie.update(SHORT_WAIT, ORIGIN);
    assert.ok(opacity() < 1);
    assert.equal(zombie.faded, false);
    zombie.update(SHORT_WAIT, ORIGIN);
    assert.equal(opacity(), 0);
    assert.equal(zombie.faded, true);
  });
});
