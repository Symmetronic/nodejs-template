import { type Level } from "#/src/level.ts";
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
});
