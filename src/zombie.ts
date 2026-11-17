import { type Point } from "#/src/rail.ts";

const SPEED = 0.8;
const MELEE_RANGE = 1.2;
const ATTACK_INTERVAL = 1.5;
const FIRST_ATTACK_DELAY = 0.5;
const FRAME_SECONDS = 0.35;
const DAMAGE = 1;
const FRAME_COUNT = 2;

type ZombieState = "walking" | "attacking";

export interface Zombie {
  readonly position: Point;
  readonly state: ZombieState;
  readonly frame: 0 | 1;
  readonly update: (deltaSeconds: number, target: Point) => number;
}

export function createZombie(spawn: Point): Zombie {
  let position = spawn;
  let state: ZombieState = "walking";
  let attackCountdown = FIRST_ATTACK_DELAY;
  let animationSeconds = 0;

  return {
    get position() {
      return position;
    },
    get state() {
      return state;
    },
    get frame() {
      return Math.floor(animationSeconds / FRAME_SECONDS) % FRAME_COUNT === 0
        ? 0
        : 1;
    },
    update: (deltaSeconds, target) => {
      animationSeconds += deltaSeconds;
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > MELEE_RANGE) {
        state = "walking";
        const step = Math.min(SPEED * deltaSeconds, distance - MELEE_RANGE);
        position = {
          x: position.x + (dx / distance) * step,
          y: position.y,
          z: position.z + (dz / distance) * step,
        };
        return 0;
      }
      state = "attacking";
      attackCountdown -= deltaSeconds;
      if (attackCountdown > 0) {
        return 0;
      }
      attackCountdown += ATTACK_INTERVAL;
      return DAMAGE;
    },
  };
}
