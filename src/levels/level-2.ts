import { type Level } from "#/src/level.ts";

const SPEED = 2.5;
const EYE_HEIGHT = 1.5;
const LIGHT_HEIGHT = 2.7;
const LIGHT_INTENSITY = 22;
const SLAB = 0.2;
const WALL_HEIGHT = 3;
const WALL_CENTER = 1.5;
const FLOOR_CENTER = -0.1;
const CEILING_CENTER = 3.1;
const FEET = 0;
const CRATE_FLOOR = 0;
const DOORWAY = 2.25;

/*
 * Corridor layout (top view, x to the right, z down):
 * A runs from z 0 to the junction at z -36 and dead-ends at z -46.
 * Two doorways open into alcoves: left at z -19, right at z -22.
 * B turns left at the junction to x -30, C turns right to z -66.
 * The zombies of the B encounter start walking while the camera still
 * faces the dead end, so a slow fight lets them close in unseen.
 */
export const level2: Level = {
  speed: SPEED,
  rail: [
    { x: 0, y: EYE_HEIGHT, z: 0 },
    { x: 0, y: EYE_HEIGHT, z: -36 },
    { x: -30, y: EYE_HEIGHT, z: -36 },
    { x: -30, y: EYE_HEIGHT, z: -66 },
  ],
  boxes: [
    // Floors
    {
      center: { x: 0, y: FLOOR_CENTER, z: -23 },
      size: { x: 4, y: SLAB, z: 46 },
      texture: "floor",
    },
    {
      center: { x: -15, y: FLOOR_CENTER, z: -36 },
      size: { x: 26, y: SLAB, z: 4 },
      texture: "floor",
    },
    {
      center: { x: -30, y: FLOOR_CENTER, z: -51 },
      size: { x: 4, y: SLAB, z: 34 },
      texture: "floor",
    },
    {
      center: { x: -2.5, y: FLOOR_CENTER, z: -19 },
      size: { x: 1, y: SLAB, z: 2.4 },
      texture: "floor",
    },
    {
      center: { x: 2.5, y: FLOOR_CENTER, z: -22 },
      size: { x: 1, y: SLAB, z: 2.4 },
      texture: "floor",
    },
    // Ceilings
    {
      center: { x: 0, y: CEILING_CENTER, z: -23 },
      size: { x: 4, y: SLAB, z: 46 },
      texture: "concrete",
    },
    {
      center: { x: -15, y: CEILING_CENTER, z: -36 },
      size: { x: 26, y: SLAB, z: 4 },
      texture: "concrete",
    },
    {
      center: { x: -30, y: CEILING_CENTER, z: -51 },
      size: { x: 4, y: SLAB, z: 34 },
      texture: "concrete",
    },
    {
      center: { x: -2.5, y: CEILING_CENTER, z: -19 },
      size: { x: 1, y: SLAB, z: 2.4 },
      texture: "concrete",
    },
    {
      center: { x: 2.5, y: CEILING_CENTER, z: -22 },
      size: { x: 1, y: SLAB, z: 2.4 },
      texture: "concrete",
    },
    // Corridor A left wall, broken by the left doorway and corridor B
    {
      center: { x: -2, y: WALL_CENTER, z: -8.9 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 17.8 },
      texture: "brick",
    },
    {
      center: { x: -2, y: WALL_CENTER, z: -27.1 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 13.8 },
      texture: "brick",
    },
    {
      center: { x: -2, y: WALL_CENTER, z: -42 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 8 },
      texture: "brick",
    },
    // Corridor A right wall, broken by the right doorway
    {
      center: { x: 2, y: WALL_CENTER, z: -10.4 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 20.8 },
      texture: "brick",
    },
    {
      center: { x: 2, y: WALL_CENTER, z: -34.6 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 22.8 },
      texture: "brick",
    },
    // Dead end
    {
      center: { x: 0, y: WALL_CENTER, z: -46 },
      size: { x: 4, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    // Left alcove
    {
      center: { x: -3, y: WALL_CENTER, z: -19 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 2.6 },
      texture: "concrete",
    },
    {
      center: { x: -2.5, y: WALL_CENTER, z: -17.8 },
      size: { x: 1, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    {
      center: { x: -2.5, y: WALL_CENTER, z: -20.2 },
      size: { x: 1, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    // Right alcove
    {
      center: { x: 3, y: WALL_CENTER, z: -22 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 2.6 },
      texture: "concrete",
    },
    {
      center: { x: 2.5, y: WALL_CENTER, z: -20.8 },
      size: { x: 1, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    {
      center: { x: 2.5, y: WALL_CENTER, z: -23.2 },
      size: { x: 1, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    // Corridor B walls
    {
      center: { x: -17, y: WALL_CENTER, z: -34 },
      size: { x: 30, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    {
      center: { x: -15, y: WALL_CENTER, z: -38 },
      size: { x: 26, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
    // Corridor C walls
    {
      center: { x: -32, y: WALL_CENTER, z: -51 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 34 },
      texture: "brick",
    },
    {
      center: { x: -28, y: WALL_CENTER, z: -53 },
      size: { x: SLAB, y: WALL_HEIGHT, z: 30 },
      texture: "brick",
    },
    {
      center: { x: -30, y: WALL_CENTER, z: -68 },
      size: { x: 4, y: WALL_HEIGHT, z: SLAB },
      texture: "concrete",
    },
  ],
  lights: [
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -6 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -20 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -34 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: 0, y: LIGHT_HEIGHT, z: -43 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
    {
      position: { x: -12, y: LIGHT_HEIGHT, z: -36 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: -24, y: LIGHT_HEIGHT, z: -36 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
    {
      position: { x: -30, y: LIGHT_HEIGHT, z: -48 },
      intensity: LIGHT_INTENSITY,
      flickers: false,
    },
    {
      position: { x: -30, y: LIGHT_HEIGHT, z: -61 },
      intensity: LIGHT_INTENSITY,
      flickers: true,
    },
  ],
  crates: [
    { x: 1.2, y: CRATE_FLOOR, z: -8 },
    { x: -1.2, y: CRATE_FLOOR, z: -29 },
    { x: 1.2, y: CRATE_FLOOR, z: -42 },
    { x: -9, y: CRATE_FLOOR, z: -37.2 },
    { x: -22, y: CRATE_FLOOR, z: -34.8 },
    { x: -28.8, y: CRATE_FLOOR, z: -56 },
  ],
  encounters: [
    {
      stopDistance: 12,
      zombies: [
        { position: { x: 0, y: FEET, z: -26 }, delay: 0.5 },
        { position: { x: -DOORWAY, y: FEET, z: -19 }, delay: 2 },
        { position: { x: DOORWAY, y: FEET, z: -22 }, delay: 4 },
        { position: { x: -DOORWAY, y: FEET, z: -19 }, delay: 6 },
        { position: { x: DOORWAY, y: FEET, z: -22 }, delay: 8 },
      ],
    },
    {
      stopDistance: 35.5,
      zombies: [
        { position: { x: -0.6, y: FEET, z: -45 }, delay: 0.5 },
        { position: { x: 0.6, y: FEET, z: -44.5 }, delay: 1.5 },
        { position: { x: 0, y: FEET, z: -45.5 }, delay: 2.5 },
      ],
    },
    {
      startDistance: 35.5,
      stopDistance: 37.5,
      zombies: [
        { position: { x: -12, y: FEET, z: -35.4 }, delay: 0.5 },
        { position: { x: -13, y: FEET, z: -36.6 }, delay: 1.5 },
        { position: { x: -14, y: FEET, z: -36 }, delay: 2.5 },
        { position: { x: -15, y: FEET, z: -35.6 }, delay: 3.5 },
      ],
    },
    {
      stopDistance: 80,
      zombies: [
        { position: { x: -30.8, y: FEET, z: -60 }, delay: 0.5 },
        { position: { x: -29.2, y: FEET, z: -61 }, delay: 2 },
        { position: { x: -30, y: FEET, z: -62 }, delay: 3.5 },
        { position: { x: -30.6, y: FEET, z: -63 }, delay: 5 },
        { position: { x: -29.4, y: FEET, z: -60.5 }, delay: 6.5 },
        { position: { x: -30, y: FEET, z: -63.5 }, delay: 8 },
        { position: { x: -29.6, y: FEET, z: -61.5 }, delay: 10 },
      ],
    },
  ],
};
