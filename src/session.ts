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

interface EncounterProgress {
  readonly encounter: Level["encounters"][number];
  seconds: number | undefined;
  readonly zombies: Zombie[];
  finished: boolean;
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
  const encounters: EncounterProgress[] = level.encounters.map((encounter) => ({
    encounter,
    seconds: undefined,
    zombies: [],
    finished: false,
  }));

  function currentEncounter(): EncounterProgress | undefined {
    return encounters.find((progress) => !progress.finished);
  }

  function moveAlongRail(deltaSeconds: number): void {
    const stop = currentEncounter()?.encounter.stopDistance ?? rail.length;
    distance = Math.min(
      stop,
      rail.advance(distance, level.speed * deltaSeconds),
    );
  }

  function spawnDueZombies(progress: EncounterProgress): void {
    const spawns = progress.encounter.zombies;
    for (const spawn of spawns.slice(progress.zombies.length)) {
      if (spawn.delay > (progress.seconds ?? 0)) {
        break;
      }
      const zombie = createZombie(spawn.position);
      zombies.push(zombie);
      progress.zombies.push(zombie);
    }
  }

  function runEncounterClocks(deltaSeconds: number): void {
    for (const progress of encounters) {
      const { startDistance, stopDistance } = progress.encounter;
      if (progress.finished || distance < (startDistance ?? stopDistance)) {
        continue;
      }
      progress.seconds = (progress.seconds ?? 0) + deltaSeconds;
      spawnDueZombies(progress);
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

  function finishEncounters(): void {
    for (const progress of encounters) {
      progress.finished ||=
        progress.seconds !== undefined &&
        progress.zombies.length >= progress.encounter.zombies.length &&
        progress.zombies.every((zombie) => !zombie.alive);
    }
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
      runEncounterClocks(deltaSeconds);
      fightZombies(deltaSeconds);
      if (hearts === 0) {
        return;
      }
      finishEncounters();
      if (currentEncounter() === undefined && rail.hasEnded(distance)) {
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
