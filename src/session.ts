import { type Level } from "#/src/level.ts";
import { createRail, type Point } from "#/src/rail.ts";
import { createZombie, type Zombie } from "#/src/zombie.ts";

const STARTING_HEARTS = 3;
const HURT_FLASH_SECONDS = 0.3;

type SessionStatus = "playing" | "gameover";

export interface Session {
  readonly status: SessionStatus;
  readonly hearts: number;
  readonly maximumHearts: number;
  readonly hurtFlash: number;
  readonly zombies: readonly Zombie[];
  readonly cameraPosition: Point;
  readonly cameraDirection: Point;
  readonly update: (deltaSeconds: number) => void;
}

export function createSession(level: Level): Session {
  const rail = createRail(level.rail);
  const zombies: Zombie[] = [];
  let status: SessionStatus = "playing";
  let hearts = STARTING_HEARTS;
  let hurtSeconds = 0;
  let distance = 0;
  const encounterIndex = 0;
  let encounterSeconds: number | undefined;
  let spawned = 0;

  function spawnDueZombies(): void {
    const encounter = level.encounters[encounterIndex];
    const { zombies: spawns = [] } = encounter ?? {};
    for (const spawn of spawns.slice(spawned)) {
      if (spawn.delay > (encounterSeconds ?? 0)) {
        break;
      }
      zombies.push(createZombie(spawn.position));
      spawned += 1;
    }
  }

  function moveAlongRail(deltaSeconds: number): void {
    const encounter = level.encounters[encounterIndex];
    const stop = encounter?.stopDistance ?? rail.length;
    distance = Math.min(
      stop,
      rail.advance(distance, level.speed * deltaSeconds),
    );
    if (encounter !== undefined && distance >= stop) {
      encounterSeconds ??= 0;
    }
  }

  function fightZombies(deltaSeconds: number): void {
    const target = rail.sampleAt(distance).position;
    let damage = 0;
    for (const zombie of zombies) {
      damage += zombie.update(deltaSeconds, target);
    }
    if (damage > 0) {
      hearts = Math.max(0, hearts - damage);
      hurtSeconds = HURT_FLASH_SECONDS;
    }
    if (hearts === 0) {
      status = "gameover";
    }
  }

  return {
    get status() {
      return status;
    },
    maximumHearts: STARTING_HEARTS,
    get hearts() {
      return hearts;
    },
    get hurtFlash() {
      return hurtSeconds / HURT_FLASH_SECONDS;
    },
    get zombies() {
      return zombies;
    },
    get cameraPosition() {
      return rail.sampleAt(distance).position;
    },
    get cameraDirection() {
      return rail.sampleAt(distance).direction;
    },
    update: (deltaSeconds) => {
      if (status === "gameover") {
        return;
      }
      hurtSeconds = Math.max(0, hurtSeconds - deltaSeconds);
      moveAlongRail(deltaSeconds);
      if (encounterSeconds !== undefined) {
        encounterSeconds += deltaSeconds;
        spawnDueZombies();
        fightZombies(deltaSeconds);
      }
    },
  };
}
