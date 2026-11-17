import { type Level } from "#/src/level.ts";
import { type Point } from "#/src/rail.ts";
import { createSession } from "#/src/session.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const EYE = 1.5;
const LEVEL: Level = {
  speed: 2,
  rail: [
    { x: 0, y: EYE, z: 0 },
    { x: 0, y: EYE, z: -20 },
  ],
  boxes: [],
  lights: [],
  crates: [
    { x: 1, y: 0, z: -5 },
    { x: -1, y: 0, z: -6 },
    { x: 0, y: 0, z: -7 },
  ],
  encounters: [
    {
      stopDistance: 10,
      zombies: [
        { position: { x: 0, y: 0, z: -14 }, delay: 1 },
        { position: { x: 0, y: 0, z: -15 }, delay: 3 },
      ],
    },
  ],
};
const TICK = 0.1;
const LEVEL_ZOMBIES = 2;
const EARLY = 2;
const LONG = 20;
const STOP_Z = -10;
const EPSILON = 1e-9;
const BEFORE_FIRST_SPAWN = 4.5;
const AFTER_FIRST_SPAWN = 2;
const AFTER_SECOND_SPAWN = 2;
const FIGHT_STEPS = 400;
const FIGHT_SECONDS = 60;
const IDLE = 5;
const STARTING_AMMO = 12;
const MAXIMUM_AMMO = 24;
const CRATE_AMMO = 6;
const BODY_HEIGHT = 0.9;
const HEAD_HEIGHT = 1.6;
const SPAWN_WAIT = 5;
const FADE_SECONDS = 3;
const LOOP_STEPS = 2000;
const RAIL_LENGTH = 20;
const ONWARD = 0.5;
const MISS_TARGET: Point = { x: 5, y: 1, z: -10 };

function aim(
  session: ReturnType<typeof createSession>,
  target: Point,
): { origin: Point; direction: Point } {
  const origin = session.cameraPosition;
  return {
    origin,
    direction: {
      x: target.x - origin.x,
      y: target.y - origin.y,
      z: target.z - origin.z,
    },
  };
}

function aimAtZombie(
  session: ReturnType<typeof createSession>,
  index: number,
  height: number,
): ReturnType<typeof aim> {
  const { position } = session.zombies[index] ?? { position: MISS_TARGET };
  return aim(session, { ...position, y: position.y + height });
}

function waitForSpawn(session: ReturnType<typeof createSession>): void {
  run(session, EARLY + SPAWN_WAIT);
}

function run(session: ReturnType<typeof createSession>, seconds: number): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += TICK) {
    session.update(TICK);
  }
}

describe("session", () => {
  it("starts playing with full hearts and no zombies", () => {
    const session = createSession(LEVEL);
    assert.equal(session.status, "playing");
    assert.equal(session.hearts, session.maximumHearts);
    assert.equal(session.zombies.length, 0);
  });

  it("moves the camera along the rail until the encounter stop", () => {
    const session = createSession(LEVEL);
    run(session, EARLY);
    assert.ok(session.cameraPosition.z < 0);
    run(session, LONG);
    assert.ok(Math.abs(session.cameraPosition.z - STOP_Z) < EPSILON);
  });

  it("spawns zombies after their delays once the camera has stopped", () => {
    const session = createSession(LEVEL);
    run(session, BEFORE_FIRST_SPAWN);
    assert.equal(session.zombies.length, 0);
    run(session, AFTER_FIRST_SPAWN);
    assert.equal(session.zombies.length, 1);
    run(session, AFTER_SECOND_SPAWN);
    assert.equal(session.zombies.length, LEVEL_ZOMBIES);
  });

  it("costs hearts and flashes red when zombies attack", () => {
    const session = createSession(LEVEL);
    for (
      let step = 0;
      step < FIGHT_STEPS && session.hearts === session.maximumHearts;
      step += 1
    ) {
      session.update(TICK);
    }
    assert.equal(session.hearts, session.maximumHearts - 1);
    assert.ok(session.hurtFlash > 0);
  });

  it("ends the game at zero hearts and then stops updating", () => {
    const session = createSession(LEVEL);
    run(session, FIGHT_SECONDS);
    assert.equal(session.status, "gameover");
    assert.equal(session.hearts, 0);
    const { z } = session.zombies[0]?.position ?? { z: 0 };
    run(session, IDLE);
    assert.equal(session.zombies[0]?.position.z, z);
    assert.equal(session.hearts, 0);
  });

  it("starts with 12 ammo", () => {
    const session = createSession(LEVEL);
    assert.equal(session.ammo, STARTING_AMMO);
    assert.equal(session.maximumAmmo, MAXIMUM_AMMO);
  });

  it("spends one ammo per shot, also on a miss", () => {
    const session = createSession(LEVEL);
    assert.equal(session.shoot(aim(session, MISS_TARGET)), "miss");
    assert.equal(session.ammo, STARTING_AMMO - 1);
  });

  it("only clicks dry at zero ammo", () => {
    const session = createSession(LEVEL);
    for (let shot = 0; shot < STARTING_AMMO; shot += 1) {
      session.shoot(aim(session, MISS_TARGET));
    }
    assert.equal(session.ammo, 0);
    assert.equal(session.shoot(aim(session, MISS_TARGET)), "dry");
    assert.equal(session.ammo, 0);
  });

  it("collects an ammo crate that is shot", () => {
    const session = createSession(LEVEL);
    const crate = { x: 1, y: 0, z: -5 };
    assert.equal(session.shoot(aim(session, { ...crate, y: 0.3 })), "crate");
    assert.equal(session.ammo, STARTING_AMMO - 1 + CRATE_AMMO);
    assert.equal(session.crates[0]?.collected, true);
    assert.equal(session.shoot(aim(session, { ...crate, y: 0.3 })), "miss");
  });

  it("caps ammo at the maximum", () => {
    const session = createSession(LEVEL);
    session.shoot(aim(session, { x: 1, y: 0.3, z: -5 }));
    session.shoot(aim(session, { x: -1, y: 0.3, z: -6 }));
    session.shoot(aim(session, { x: 0, y: 0.3, z: -7 }));
    assert.equal(session.ammo, MAXIMUM_AMMO);
  });

  it("kills a zombie with two body hits", () => {
    const session = createSession(LEVEL);
    waitForSpawn(session);
    const first = session.zombies[0];
    assert.ok(first);
    assert.equal(session.shoot(aimAtZombie(session, 0, BODY_HEIGHT)), "body");
    assert.equal(first.alive, true);
    assert.equal(first.state, "flinching");
    assert.equal(session.shoot(aimAtZombie(session, 0, BODY_HEIGHT)), "body");
    assert.equal(first.alive, false);
  });

  it("kills a zombie with one headshot", () => {
    const session = createSession(LEVEL);
    waitForSpawn(session);
    assert.equal(session.shoot(aimAtZombie(session, 0, HEAD_HEIGHT)), "head");
    assert.equal(session.zombies[0]?.alive, false);
  });

  it("sends the camera onwards once the encounter is cleared", () => {
    const session = createSession(LEVEL);
    for (let step = 0; step < LOOP_STEPS; step += 1) {
      for (const [index, zombie] of session.zombies.entries()) {
        if (zombie.alive) {
          session.shoot(aimAtZombie(session, index, HEAD_HEIGHT));
        }
      }
      session.update(TICK);
      if (session.cameraPosition.z < STOP_Z - ONWARD) {
        break;
      }
    }
    assert.equal(session.status, "playing");
    assert.ok(session.cameraPosition.z < STOP_Z - ONWARD);
  });

  it("holds the camera while a zombie of the encounter is still to come", () => {
    const session = createSession(LEVEL);
    waitForSpawn(session);
    session.shoot(aimAtZombie(session, 0, HEAD_HEIGHT));
    run(session, 1);
    assert.ok(Math.abs(session.cameraPosition.z - STOP_Z) < EPSILON);
  });

  it("removes dead zombies once they have faded", () => {
    const session = createSession(LEVEL);
    waitForSpawn(session);
    const first = session.zombies[0];
    assert.ok(first);
    session.shoot(aimAtZombie(session, 0, HEAD_HEIGHT));
    run(session, 1);
    assert.ok(session.zombies.includes(first));
    run(session, FADE_SECONDS);
    assert.ok(!session.zombies.includes(first));
  });

  it("clears the level at the end of the rail after the last encounter", () => {
    const session = createSession(LEVEL);
    for (let step = 0; step < LOOP_STEPS; step += 1) {
      for (const [index, zombie] of session.zombies.entries()) {
        if (zombie.alive) {
          session.shoot(aimAtZombie(session, index, HEAD_HEIGHT));
        }
      }
      session.update(TICK);
      if (session.status !== "playing") {
        break;
      }
    }
    assert.equal(session.status, "cleared");
    assert.ok(Math.abs(session.cameraPosition.z + RAIL_LENGTH) < EPSILON);
    assert.equal(session.shoot(aim(session, MISS_TARGET)), "none");
  });
});
