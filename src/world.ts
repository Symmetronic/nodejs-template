import { FRAME_HEIGHT, FRAME_WIDTH } from "#/src/display.ts";
import { type Level } from "#/src/level.ts";
import { type Point } from "#/src/rail.ts";
import { type Crate } from "#/src/session.ts";
import { type Ray } from "#/src/shooting.ts";
import { createCrateTexture, createTextures } from "#/src/textures.ts";
import { createZombieFrames, ZOMBIE_ASPECT } from "#/src/zombie-sprites.ts";
import { ZOMBIE_HEIGHT, type Zombie } from "#/src/zombie.ts";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  Fog,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  Sprite,
  SpriteMaterial,
  Vector2,
  type Texture,
} from "three";

const FIELD_OF_VIEW = 75;
const ASPECT = FRAME_WIDTH / FRAME_HEIGHT;
const NEAR = 0.1;
const FAR = 60;
const FOG_COLOR = 0x08080c;
const FOG_NEAR = 2;
const FOG_FAR = 20;
const AMBIENT_COLOR = 0x303040;
const AMBIENT_INTENSITY = 1.2;
const LIGHT_COLOR = 0xffc890;
const TEXTURE_TILE = 2;
const VERTICES_PER_FACE = 4;
const HALF_TURN = Math.PI;
const FULL_TURN = HALF_TURN + HALF_TURN;
const TURN_RESPONSE = 3;
const FLICKER_RATE_SLOW = 17.3;
const FLICKER_RATE_FAST = 31;
const FLICKER_THRESHOLD = 0.55;
const FLICKER_DIMMED = 0.2;
const FLICKER_LIGHT_OFFSET = 7;
const CRATE_SIZE = 0.6;
const HALF = 0.5;
const NDC_RANGE = 2;

interface World {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly update: (
    position: Point,
    direction: Point,
    deltaSeconds: number,
    elapsedSeconds: number,
    zombies: readonly Zombie[],
    crates: readonly Crate[],
  ) => void;
  readonly rayThrough: (frameX: number, frameY: number) => Ray;
}

// Face order of BoxGeometry: +x, -x, +y, -y, +z, -z
function faceTiles(size: Point): [number, number][] {
  const depthByHeight: [number, number] = [size.z, size.y];
  const widthByDepth: [number, number] = [size.x, size.z];
  const widthByHeight: [number, number] = [size.x, size.y];
  return [
    depthByHeight,
    depthByHeight,
    widthByDepth,
    widthByDepth,
    widthByHeight,
    widthByHeight,
  ];
}

function createTiledBox(size: Point): BoxGeometry {
  const geometry = new BoxGeometry(size.x, size.y, size.z);
  const uv = geometry.getAttribute("uv");
  faceTiles(size).forEach(([width, height], face) => {
    for (let vertex = 0; vertex < VERTICES_PER_FACE; vertex += 1) {
      const index = face * VERTICES_PER_FACE + vertex;
      uv.setXY(
        index,
        (uv.getX(index) * width) / TEXTURE_TILE,
        (uv.getY(index) * height) / TEXTURE_TILE,
      );
    }
  });
  return geometry;
}

function shortestTurn(from: number, to: number): number {
  const difference = (to - from) % FULL_TURN;
  if (difference > HALF_TURN) {
    return difference - FULL_TURN;
  }
  if (difference < -HALF_TURN) {
    return difference + FULL_TURN;
  }
  return difference;
}

function flickerFactor(seconds: number): number {
  const wave =
    Math.sin(seconds * FLICKER_RATE_SLOW) *
    Math.sin(seconds * FLICKER_RATE_FAST);
  return wave > FLICKER_THRESHOLD ? FLICKER_DIMMED : 1;
}

export function createWorld(level: Level): World {
  const scene = new Scene();
  scene.background = new Color(FOG_COLOR);
  scene.fog = new Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
  scene.add(new AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY));

  const textures = createTextures();
  const materials = {
    brick: new MeshLambertMaterial({ map: textures.brick }),
    concrete: new MeshLambertMaterial({ map: textures.concrete }),
    floor: new MeshLambertMaterial({ map: textures.floor }),
  };
  for (const box of level.boxes) {
    const mesh = new Mesh(createTiledBox(box.size), materials[box.texture]);
    mesh.position.set(box.center.x, box.center.y, box.center.z);
    scene.add(mesh);
  }

  const lights = level.lights.map((definition, index) => {
    const light = new PointLight(LIGHT_COLOR, definition.intensity);
    light.position.set(
      definition.position.x,
      definition.position.y,
      definition.position.z,
    );
    scene.add(light);
    return { light, definition, offset: index * FLICKER_LIGHT_OFFSET };
  });

  const zombieFrames = createZombieFrames();
  function frameOf(zombie: Zombie): Texture {
    if (zombie.state === "dying") {
      return zombieFrames.fallen;
    }
    if (zombie.state === "flinching") {
      return zombieFrames.flinch;
    }
    return zombieFrames.walk[zombie.frame];
  }
  const sprites = new Map<Zombie, Sprite>();
  function syncZombies(zombies: readonly Zombie[]): void {
    for (const [zombie, sprite] of sprites) {
      if (!zombies.includes(zombie)) {
        scene.remove(sprite);
        sprite.material.dispose();
        sprites.delete(zombie);
      }
    }
    for (const zombie of zombies) {
      let sprite = sprites.get(zombie);
      if (sprite === undefined) {
        sprite = new Sprite(new SpriteMaterial({ transparent: true }));
        sprite.scale.set(ZOMBIE_HEIGHT * ZOMBIE_ASPECT, ZOMBIE_HEIGHT, 1);
        sprites.set(zombie, sprite);
        scene.add(sprite);
      }
      const { position } = zombie;
      sprite.position.set(
        position.x,
        position.y + ZOMBIE_HEIGHT * HALF,
        position.z,
      );
      sprite.material.map = frameOf(zombie);
      sprite.material.opacity = zombie.opacity;
    }
  }

  const crateMaterial = new MeshLambertMaterial({ map: createCrateTexture() });
  const crateGeometry = new BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE);
  const crateMeshes = level.crates.map((position) => {
    const mesh = new Mesh(crateGeometry, crateMaterial);
    mesh.position.set(position.x, position.y + CRATE_SIZE * HALF, position.z);
    scene.add(mesh);
    return mesh;
  });

  const camera = new PerspectiveCamera(FIELD_OF_VIEW, ASPECT, NEAR, FAR);
  let yaw: number | undefined;
  const raycaster = new Raycaster();

  return {
    scene,
    camera,
    rayThrough: (frameX, frameY) => {
      camera.updateMatrixWorld();
      raycaster.setFromCamera(
        new Vector2(
          (frameX / FRAME_WIDTH) * NDC_RANGE - 1,
          1 - (frameY / FRAME_HEIGHT) * NDC_RANGE,
        ),
        camera,
      );
      const { origin, direction } = raycaster.ray;
      return {
        origin: { x: origin.x, y: origin.y, z: origin.z },
        direction: { x: direction.x, y: direction.y, z: direction.z },
      };
    },
    update: (
      position,
      direction,
      deltaSeconds,
      elapsedSeconds,
      zombies,
      crates,
    ) => {
      syncZombies(zombies);
      crates.forEach((crate, index) => {
        const mesh = crateMeshes[index];
        if (mesh !== undefined) {
          mesh.visible = !crate.collected;
        }
      });
      const targetYaw = Math.atan2(-direction.x, -direction.z);
      const currentYaw = yaw ?? targetYaw;
      yaw =
        currentYaw +
        shortestTurn(currentYaw, targetYaw) *
          (1 - Math.exp(-TURN_RESPONSE * deltaSeconds));
      camera.position.set(position.x, position.y, position.z);
      camera.rotation.set(0, yaw, 0);
      for (const { light, definition, offset } of lights) {
        light.intensity = definition.flickers
          ? definition.intensity * flickerFactor(elapsedSeconds + offset)
          : definition.intensity;
      }
    },
  };
}
