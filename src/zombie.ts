import { type Point } from "#/src/rail.ts";

const SPEED = 0.8;
const MELEE_RANGE = 1.2;
const ATTACK_INTERVAL = 1.5;
const FIRST_ATTACK_DELAY = 0.5;
const FRAME_SECONDS = 0.35;
const DAMAGE = 1;
const FRAME_COUNT = 2;
const BODY_HITS_TO_KILL = 2;
const FLINCH_SECONDS = 0.35;
const FALL_SECONDS = 0.5;
const FADE_SECONDS = 0.8;

export const ZOMBIE_HEIGHT = 1.75;

export type Zone = "head" | "body";

type ZombieState = "walking" | "attacking" | "flinching" | "dying";

export interface Zombie {
  readonly position: Point;
  readonly state: ZombieState;
  readonly frame: 0 | 1;
  readonly alive: boolean;
  readonly opacity: number;
  readonly faded: boolean;
  readonly hit: (zone: Zone) => void;
  readonly update: (deltaSeconds: number, target: Point) => number;
}

export function createZombie(spawn: Point): Zombie {
  let position = spawn;
  let stance: "walking" | "attacking" = "walking";
  let attackCountdown = FIRST_ATTACK_DELAY;
  let animationSeconds = 0;
  let bodyHits = 0;
  let alive = true;
  let flinchSeconds = 0;
  let deadSeconds = 0;

  function approach(deltaSeconds: number, target: Point): number {
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > MELEE_RANGE) {
      stance = "walking";
      const step = Math.min(SPEED * deltaSeconds, distance - MELEE_RANGE);
      position = {
        x: position.x + (dx / distance) * step,
        y: position.y,
        z: position.z + (dz / distance) * step,
      };
      return 0;
    }
    stance = "attacking";
    attackCountdown -= deltaSeconds;
    if (attackCountdown > 0) {
      return 0;
    }
    attackCountdown += ATTACK_INTERVAL;
    return DAMAGE;
  }

  return {
    get position() {
      return position;
    },
    get state() {
      if (!alive) {
        return "dying";
      }
      return flinchSeconds > 0 ? "flinching" : stance;
    },
    get frame() {
      return Math.floor(animationSeconds / FRAME_SECONDS) % FRAME_COUNT === 0
        ? 0
        : 1;
    },
    get alive() {
      return alive;
    },
    get opacity() {
      return Math.max(
        0,
        1 - Math.max(0, deadSeconds - FALL_SECONDS) / FADE_SECONDS,
      );
    },
    get faded() {
      return deadSeconds >= FALL_SECONDS + FADE_SECONDS;
    },
    hit: (zone) => {
      if (!alive) {
        return;
      }
      bodyHits += 1;
      if (zone === "head" || bodyHits >= BODY_HITS_TO_KILL) {
        alive = false;
        return;
      }
      flinchSeconds = FLINCH_SECONDS;
    },
    update: (deltaSeconds, target) => {
      if (!alive) {
        deadSeconds += deltaSeconds;
        return 0;
      }
      animationSeconds += deltaSeconds;
      if (flinchSeconds > 0) {
        flinchSeconds = Math.max(0, flinchSeconds - deltaSeconds);
        return 0;
      }
      return approach(deltaSeconds, target);
    },
  };
}
