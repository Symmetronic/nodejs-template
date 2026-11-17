import { type TextureName } from "#/src/level.ts";
import {
  CanvasTexture,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

const SIZE = 32;
const LCG_MULTIPLIER = 1_664_525;
const LCG_INCREMENT = 1_013_904_223;
const LCG_MODULUS = 4_294_967_296;

type Paint = (
  fillRect: (color: string, x: number, y: number, w: number, h: number) => void,
  random: () => number,
) => void;

const BRICK_MORTAR = "#2a2420";
const BRICK_COLORS = ["#6b3a2e", "#5c3226", "#7a4535", "#4f2c22"] as const;
const BRICK_HEIGHT = 8;
const BRICK_WIDTH = 16;
const MORTAR = 1;
const ROW_PATTERN = 2;
const SPECKLES = 40;
const CONCRETE_COLORS = ["#6e6e6a", "#63635f", "#777772", "#585854"] as const;
const FLOOR_COLORS = ["#4a4a47", "#42423f", "#51514d"] as const;
const FLOOR_GRID = 16;
const FLOOR_GROUT = "#2b2b29";
const STAIN_COLOR = "#3b3a36";
const STAINS = 14;

function pick<T>(items: readonly [T, ...T[]], random: () => number): T {
  const chosen = items[Math.floor(random() * items.length)];
  return chosen ?? items[0];
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
    return state / LCG_MODULUS;
  };
}

function scatter(
  fillRect: Parameters<Paint>[0],
  random: () => number,
  color: string,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    fillRect(
      color,
      Math.floor(random() * SIZE),
      Math.floor(random() * SIZE),
      1,
      1,
    );
  }
}

const paintBrick: Paint = (fillRect, random) => {
  fillRect(BRICK_MORTAR, 0, 0, SIZE, SIZE);
  for (let row = 0; row < SIZE / BRICK_HEIGHT; row += 1) {
    const offset = row % ROW_PATTERN === 0 ? 0 : BRICK_WIDTH / ROW_PATTERN;
    for (let column = -1; column < SIZE / BRICK_WIDTH; column += 1) {
      fillRect(
        pick(BRICK_COLORS, random),
        column * BRICK_WIDTH + offset + MORTAR,
        row * BRICK_HEIGHT + MORTAR,
        BRICK_WIDTH - MORTAR,
        BRICK_HEIGHT - MORTAR,
      );
    }
  }
  scatter(fillRect, random, BRICK_MORTAR, SPECKLES);
};

const paintConcrete: Paint = (fillRect, random) => {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      fillRect(pick(CONCRETE_COLORS, random), x, y, 1, 1);
    }
  }
  scatter(fillRect, random, STAIN_COLOR, STAINS);
};

const paintFloor: Paint = (fillRect, random) => {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      fillRect(pick(FLOOR_COLORS, random), x, y, 1, 1);
    }
  }
  for (let line = 0; line < SIZE; line += FLOOR_GRID) {
    fillRect(FLOOR_GROUT, line, 0, 1, SIZE);
    fillRect(FLOOR_GROUT, 0, line, SIZE, 1);
  }
  scatter(fillRect, random, STAIN_COLOR, STAINS);
};

const PAINTERS: Readonly<Record<TextureName, { paint: Paint; seed: number }>> =
  {
    brick: { paint: paintBrick, seed: 11 },
    concrete: { paint: paintConcrete, seed: 23 },
    floor: { paint: paintFloor, seed: 37 },
  };

function createTexture(name: TextureName): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("A 2D canvas context is required");
  }
  const { paint, seed } = PAINTERS[name];
  paint((color, x, y, width, height) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }, createRandom(seed));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

export function createTextures(): Readonly<Record<TextureName, Texture>> {
  return {
    brick: createTexture("brick"),
    concrete: createTexture("concrete"),
    floor: createTexture("floor"),
  };
}
