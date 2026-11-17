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

const FRAMES: readonly [readonly Rect[], readonly Rect[]] = [
  [...BODY, ...arms(LOWERED_ARM_TOP), ...legs(HIGH_LEG_TOP, LOW_LEG_TOP)],
  [...BODY, ...arms(RAISED_ARM_TOP), ...legs(LOW_LEG_TOP, HIGH_LEG_TOP)],
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

export function createZombieFrames(): readonly [CanvasTexture, CanvasTexture] {
  const [first, second] = FRAMES;
  return [createFrameTexture(first), createFrameTexture(second)];
}
