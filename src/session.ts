import { type Level } from "#/src/level.ts";
import { createRail, type Point } from "#/src/rail.ts";
import { intersectCrate, intersectZombie, type Ray } from "#/src/shooting.ts";
import { createZombie, type Zombie } from "#/src/zombie.ts";

const STARTING_HEARTS = 3;
const HURT_FLASH_SECONDS = 0.3;
const STARTING_AMMO = 12;
const MAXIMUM_AMMO = 24;
const CRATE_AMMO = 6;

type SessionStatus = "playing" | "gameover" | "cleared";

type ShotResult = "none" | "dry" | "miss" | "body" | "head" | "crate";

export interface Crate {
  readonly position: Point;
  readonly collected: boolean;
}

export interface Session {
  readonly status: SessionStatus;
  readonly hearts: number;
  readonly maximumHearts: number;
  readonly hurtFlash: number;
  readonly ammo: number;
  readonly maximumAmmo: number;
  readonly zombies: readonly Zombie[];
  readonly crates: readonly Crate[];
  readonly cameraPosition: Point;
  readonly cameraDirection: Point;
  readonly update: (deltaSeconds: number) => void;
  readonly shoot: (ray: Ray) => ShotResult;
}

interface Target {
  readonly distance: number;
  readonly result: ShotResult;
  readonly apply: () => void;
}

export function createSession(level: Level): Session {
  const rail = createRail(level.rail);
  const zombies: Zombie[] = [];
  const crates = level.crates.map((position) => ({
    position,
    collected: false,
  }));
  let status: SessionStatus = "playing";
  let hearts = STARTING_HEARTS;
  let ammo = STARTING_AMMO;
  let hurtSeconds = 0;
  let distance = 0;
  let encounterIndex = 0;
  let encounterSeconds: number | undefined;
  let encounterZombies: Zombie[] = [];

  function spawnDueZombies(): void {
    const { zombies: spawns = [] } = level.encounters[encounterIndex] ?? {};
    for (const spawn of spawns.slice(encounterZombies.length)) {
      if (spawn.delay > (encounterSeconds ?? 0)) {
        break;
      }
      const zombie = createZombie(spawn.position);
      zombies.push(zombie);
      encounterZombies.push(zombie);
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
    for (let index = zombies.length - 1; index >= 0; index -= 1) {
      if (zombies[index]?.faded === true) {
        zombies.splice(index, 1);
      }
    }
    if (damage > 0) {
      hearts = Math.max(0, hearts - damage);
      hurtSeconds = HURT_FLASH_SECONDS;
    }
    if (hearts === 0) {
      status = "gameover";
    }
  }

  function finishEncounter(): void {
    const encounter = level.encounters[encounterIndex];
    if (
      encounter === undefined ||
      encounterSeconds === undefined ||
      encounterZombies.length < encounter.zombies.length ||
      encounterZombies.some((zombie) => zombie.alive)
    ) {
      return;
    }
    encounterIndex += 1;
    encounterSeconds = undefined;
    encounterZombies = [];
  }

  function findTarget(ray: Ray): Target | undefined {
    const viewing = rail.sampleAt(distance).direction;
    let nearest: Target | undefined;
    function consider(candidate: Target): void {
      if (nearest === undefined || candidate.distance < nearest.distance) {
        nearest = candidate;
      }
    }
    for (const zombie of zombies) {
      const hit = zombie.alive
        ? intersectZombie(ray, viewing, zombie.position)
        : undefined;
      if (hit !== undefined) {
        consider({
          distance: hit.distance,
          result: hit.zone,
          apply: () => {
            zombie.hit(hit.zone);
          },
        });
      }
    }
    for (const crate of crates) {
      const hit = crate.collected
        ? undefined
        : intersectCrate(ray, crate.position);
      if (hit !== undefined) {
        consider({
          distance: hit,
          result: "crate",
          apply: () => {
            crate.collected = true;
            ammo = Math.min(MAXIMUM_AMMO, ammo + CRATE_AMMO);
          },
        });
      }
    }
    return nearest;
  }

  return {
    get status() {
      return status;
    },
    maximumHearts: STARTING_HEARTS,
    maximumAmmo: MAXIMUM_AMMO,
    get hearts() {
      return hearts;
    },
    get ammo() {
      return ammo;
    },
    get hurtFlash() {
      return hurtSeconds / HURT_FLASH_SECONDS;
    },
    get zombies() {
      return zombies;
    },
    get crates() {
      return crates;
    },
    get cameraPosition() {
      return rail.sampleAt(distance).position;
    },
    get cameraDirection() {
      return rail.sampleAt(distance).direction;
    },
    update: (deltaSeconds) => {
      if (status !== "playing") {
        return;
      }
      hurtSeconds = Math.max(0, hurtSeconds - deltaSeconds);
      moveAlongRail(deltaSeconds);
      if (encounterSeconds !== undefined) {
        encounterSeconds += deltaSeconds;
        spawnDueZombies();
      }
      fightZombies(deltaSeconds);
      if (hearts === 0) {
        return;
      }
      finishEncounter();
      if (
        encounterIndex >= level.encounters.length &&
        rail.hasEnded(distance)
      ) {
        status = "cleared";
      }
    },
    shoot: (ray) => {
      if (status !== "playing") {
        return "none";
      }
      if (ammo === 0) {
        return "dry";
      }
      ammo -= 1;
      const target = findTarget(ray);
      target?.apply();
      return target?.result ?? "miss";
    },
  };
}
