import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";

const WIDTH = 16;
const HEIGHT = 28;
const SKIN = "#7d9a5e";
const SKIN_SHADOW = "#587046";
const EYES = "#e8d34a";
const MOUTH = "#2a1010";
const SHIRT = "#5a4a3a";
const SHIRT_SHADOW = "#3e3226";
const TROUSERS = "#2e3548";
const BLOOD = "#8a1c16";
const LOW_LEG_TOP = 17;
const HIGH_LEG_TOP = 16;
const LEG_LENGTH = 11;
const FOOT = 2;
const RAISED_ARM_TOP = 5;
const LOWERED_ARM_TOP = 8;

interface Rect {
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const BODY: readonly Rect[] = [
  // Head
  { color: SKIN, x: 5, y: 1, width: 6, height: 6 },
  { color: SKIN_SHADOW, x: 5, y: 6, width: 6, height: 1 },
  { color: EYES, x: 6, y: 3, width: 1, height: 1 },
  { color: EYES, x: 9, y: 3, width: 1, height: 1 },
  { color: MOUTH, x: 7, y: 5, width: 2, height: 1 },
  // Torso
  { color: SHIRT, x: 4, y: 7, width: 8, height: 9 },
  { color: SHIRT_SHADOW, x: 4, y: 14, width: 8, height: 2 },
  { color: BLOOD, x: 6, y: 9, width: 2, height: 3 },
  { color: BLOOD, x: 9, y: 12, width: 1, height: 2 },
];

function arms(top: number): Rect[] {
  return [
    { color: SKIN, x: 2, y: top, width: 2, height: 7 },
    { color: SKIN, x: 12, y: top, width: 2, height: 7 },
    { color: SKIN_SHADOW, x: 2, y: top, width: 2, height: 1 },
    { color: SKIN_SHADOW, x: 12, y: top, width: 2, height: 1 },
  ];
}

function legs(leftTop: number, rightTop: number): Rect[] {
  return [
    { color: TROUSERS, x: 4, y: leftTop, width: 3, height: LEG_LENGTH },
    { color: TROUSERS, x: 9, y: rightTop, width: 3, height: LEG_LENGTH },
    { color: SKIN_SHADOW, x: 4, y: HEIGHT - FOOT, width: 3, height: FOOT },
    { color: SKIN_SHADOW, x: 9, y: HEIGHT - FOOT, width: 3, height: FOOT },
  ];
}

function shifted(rects: readonly Rect[], dx: number, dy: number): Rect[] {
  return rects.map((rect) => ({ ...rect, x: rect.x + dx, y: rect.y + dy }));
}

const FLINCH_SHIFT = 1;
const FLINCH_DROP = 1;
const FLINCH_ARMS = 3;
const FALLEN_TOP = 22;
const FALLEN_LENGTH = 15;
const FALLEN_LEGS_LEFT = 10;
const FALLEN_THICKNESS = 4;

const WALK_FRAMES: readonly [readonly Rect[], readonly Rect[]] = [
  [...BODY, ...arms(LOWERED_ARM_TOP), ...legs(HIGH_LEG_TOP, LOW_LEG_TOP)],
  [...BODY, ...arms(RAISED_ARM_TOP), ...legs(LOW_LEG_TOP, HIGH_LEG_TOP)],
];

const FLINCH_FRAME: readonly Rect[] = [
  ...shifted([...BODY, ...arms(FLINCH_ARMS)], FLINCH_SHIFT, FLINCH_DROP),
  ...legs(LOW_LEG_TOP, LOW_LEG_TOP),
];

const FALLEN_FRAME: readonly Rect[] = [
  { color: SKIN, x: 0, y: FALLEN_TOP, width: 4, height: FALLEN_THICKNESS },
  { color: EYES, x: 1, y: FALLEN_TOP + 1, width: 1, height: 1 },
  {
    color: SHIRT,
    x: 4,
    y: FALLEN_TOP,
    width: 6,
    height: FALLEN_THICKNESS + 1,
  },
  { color: BLOOD, x: 5, y: FALLEN_TOP + 1, width: 2, height: 2 },
  {
    color: TROUSERS,
    x: FALLEN_LEGS_LEFT,
    y: FALLEN_TOP,
    width: WIDTH - FALLEN_LEGS_LEFT,
    height: FALLEN_THICKNESS,
  },
  {
    color: SKIN_SHADOW,
    x: 0,
    y: FALLEN_TOP + FALLEN_THICKNESS,
    width: FALLEN_LENGTH,
    height: 1,
  },
];

function createFrameTexture(rects: readonly Rect[]): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("A 2D canvas context is required");
  }
  for (const { color, x, y, width, height } of rects) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

export const ZOMBIE_ASPECT = WIDTH / HEIGHT;

interface ZombieFrames {
  readonly walk: readonly [CanvasTexture, CanvasTexture];
  readonly flinch: CanvasTexture;
  readonly fallen: CanvasTexture;
}

export function createZombieFrames(): ZombieFrames {
  const [first, second] = WALK_FRAMES;
  return {
    walk: [createFrameTexture(first), createFrameTexture(second)],
    flinch: createFrameTexture(FLINCH_FRAME),
    fallen: createFrameTexture(FALLEN_FRAME),
  };
}
