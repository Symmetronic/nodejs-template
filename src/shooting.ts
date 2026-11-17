import { type Point } from "#/src/rail.ts";
import { ZOMBIE_HEIGHT, type Zone } from "#/src/zombie.ts";

const BODY_HALF_WIDTH = 0.45;
const HEAD_HALF_WIDTH = 0.3;
const HEAD_BOTTOM = 0.72;
const CRATE_RADIUS = 0.45;
const CRATE_CENTER_HEIGHT = 0.35;

export interface Ray {
  readonly origin: Point;
  readonly direction: Point;
}

interface ZombieHit {
  readonly distance: number;
  readonly zone: Zone;
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

/*
 * A zombie is a billboard: a vertical rectangle standing on its feet and
 * facing the camera, i.e. perpendicular to the horizontal viewing direction.
 */
export function intersectZombie(
  ray: Ray,
  viewing: Point,
  feet: Point,
): ZombieHit | undefined {
  const normal = normalize({ x: viewing.x, y: 0, z: viewing.z });
  const direction = normalize(ray.direction);
  const approach = dot(direction, normal);
  if (approach <= 0) {
    return undefined;
  }
  const distance =
    dot(
      {
        x: feet.x - ray.origin.x,
        y: 0,
        z: feet.z - ray.origin.z,
      },
      normal,
    ) / approach;
  if (distance < 0) {
    return undefined;
  }
  const hit = {
    x: ray.origin.x + direction.x * distance - feet.x,
    y: ray.origin.y + direction.y * distance - feet.y,
    z: ray.origin.z + direction.z * distance - feet.z,
  };
  const sideways = Math.abs(hit.x * normal.z - hit.z * normal.x);
  if (hit.y < 0 || hit.y > ZOMBIE_HEIGHT) {
    return undefined;
  }
  if (hit.y >= ZOMBIE_HEIGHT * HEAD_BOTTOM && sideways <= HEAD_HALF_WIDTH) {
    return { distance, zone: "head" };
  }
  return sideways <= BODY_HALF_WIDTH ? { distance, zone: "body" } : undefined;
}

export function intersectCrate(ray: Ray, position: Point): number | undefined {
  const direction = normalize(ray.direction);
  const toCenter = {
    x: position.x - ray.origin.x,
    y: position.y + CRATE_CENTER_HEIGHT - ray.origin.y,
    z: position.z - ray.origin.z,
  };
  const distance = dot(toCenter, direction);
  if (distance < 0) {
    return undefined;
  }
  const missSquared = dot(toCenter, toCenter) - distance * distance;
  return missSquared <= CRATE_RADIUS * CRATE_RADIUS ? distance : undefined;
}
