import { type Level } from "#/src/level.ts";

const SPEED = 3;
const EYE_HEIGHT = 1.5;
const LIGHT_HEIGHT = 2.7;
const LIGHT_INTENSITY = 22;
const SLAB = 0.2;
const WALL_HEIGHT = 3;
const WALL_CENTER = 1.5;
const FLOOR_CENTER = -0.1;
const CEILING_CENTER = 3.1;

/*
 * Corridor layout (top view, x to the right, z down):
 * A runs from z 0 to -40, B turns right to x 30, C turns left to z -70.
 * Floors and ceilings partition the plan; walls leave the turns open.
 */
export const level1: Level = {
  speed: SPEED,
  rail: [
    { x: 0, y: EYE_HEIGHT, z: 0 },
    { x: 0, y: EYE_HEIGHT, z: -40 },
    { x: 30, y: EYE_HEIGHT, z: -40 },
    { x: 30, y: EYE_HEIGHT, z: -70 },
  ],
  boxes: [
    // Floors
    {
      center: { x: 0, y: FLOOR_CENTER, z: -19 },
      size: { x: 4, y: SLAB, z: 38 },
      texture: "floor",
    },
    {
      center: { x: 15, y: FLOOR_CENTER, z: -40 },
      size: { x: 34, y: SLAB, z: 4 },
      texture: "floor",
    },
    {
      center: { x: 30, y: FLOOR_CENTER, z: -57 },
      size: { x: 4, y: SLAB, z: 30 },
      texture: "floor",
    },
    // Ceilings
    {
      center: { x: 0, y: CEILING_CENTER, z: -19 },
      size: { x: 4, y: SLAB, z: 38 },
      texture: "concrete",
    },
    {
      center: { x: 15, y: CEILING_CENTER, z: -40 },
      size: { x: 34, y: SLAB, z: 4 },
      texture: "concrete",
    },
    {
      center: { x: 30, y: CEILING_CENTER, z: -57 },
      size: { x: 4, y: SLAB, z: 30 },
      texture: "concrete",
    },
    // Corridor A walls
    {
      center: { x: -2, y: WALL_CENTER, z: -21 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 42 },
      texture: "brick",
    },
    {
      center: { x: 2, y: WALL_CENTER, z: -19 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 38 },
      texture: "brick",
    },
    // Corridor B walls
    {
      center: { x: 13, y: WALL_CENTER, z: -42 },
      size: { x: 30, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    {
      center: { x: 17, y: WALL_CENTER, z: -38 },
      size: { x: 30, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    // Corridor C walls
    {
      center: { x: 28, y: WALL_CENTER, z: -56 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 28 },
      texture: "brick",
    },
    {
      center: { x: 32, y: WALL_CENTER, z: -54 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 32 },
      texture: "brick",
    },
  ],
  lights: [
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -8 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -26 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
    {
      position: { x: 12, y: LIGHT_HEIGHT, z: -40 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: 30, y: LIGHT_HEIGHT, z: -48 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
    {
      position: { x: 30, y: LIGHT_HEIGHT, z: -64 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
  ],
};
