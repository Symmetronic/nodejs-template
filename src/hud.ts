import {
  drawCenteredText,
  drawText,
  FONT_HEIGHT,
  measureText,
  type Frame,
} from "#/src/pixel-font.ts";
const HEART_SIZE = 7;
const HEART_GAP = 2;
const MARGIN = 4;
const HEART_COLOR = "#d12a24";
const HEART_EMPTY = "#3a1514";
const HEART_SHAPE = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];
const HURT_COLOR = "rgba(200, 20, 20, ";
const HURT_STRENGTH = 0.5;
const SHADE = "rgba(0, 0, 0, 0.7)";
const HALF = 0.5;
const TITLE_COLOR = "#b3261e";
const PROMPT_COLOR = "#d9d4c7";
const AMMO_COLOR = "#e0b84a";
const AMMO_EMPTY = "#7a2a24";
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 5;
const BULLET_GAP = 2;
const FLASH_COLOR = "#fff3a8";
const FLASH_CORE = "#ffffff";
const FLASH_WIDTH = 24;
const FLASH_HEIGHT = 18;
const FLASH_CORE_WIDTH = 10;
const FLASH_CORE_HEIGHT = 9;
const SPARK_COLOR = "#ffd24a";
const SPARK_CORE = "#ffffff";
const SPARK_ARM = 4;
const SPARK_LENGTH = 9;
const SPARK_CORE_SIZE = 3;
const CLEAR_COLOR = "#4aa35a";
const GAME_OVER_TOP = 110;
const PROMPT_TOP = 150;

function drawHeart(frame: Frame, x: number, y: number, color: string): void {
  HEART_SHAPE.forEach((row, rowIndex) => {
    Array.from(row).forEach((pixel, column) => {
      if (pixel === "1") {
        frame.fillRect(color, x + column, y + rowIndex, 1, 1);
      }
    });
  });
}

interface HudState {
  readonly hearts: number;
  readonly maximumHearts: number;
  readonly ammo: number;
  readonly hurtFlash: number;
}

function drawAmmo(frame: Frame, ammo: number): void {
  const text = String(ammo);
  const textLeft = frame.width - MARGIN - measureText(text);
  const color = ammo === 0 ? AMMO_EMPTY : AMMO_COLOR;
  frame.fillRect(
    color,
    textLeft - BULLET_GAP - BULLET_WIDTH,
    MARGIN,
    BULLET_WIDTH,
    BULLET_HEIGHT,
  );
  drawText(frame, text, textLeft, MARGIN, color);
}

export function drawMuzzleFlash(frame: Frame, strength: number): void {
  if (strength <= 0) {
    return;
  }
  const left = Math.floor((frame.width - FLASH_WIDTH) * HALF);
  const top = frame.height - FLASH_HEIGHT;
  frame.fillRect(FLASH_COLOR, left, top, FLASH_WIDTH, FLASH_HEIGHT);
  frame.fillRect(
    FLASH_CORE,
    Math.floor((frame.width - FLASH_CORE_WIDTH) * HALF),
    frame.height - FLASH_CORE_HEIGHT,
    FLASH_CORE_WIDTH,
    FLASH_CORE_HEIGHT,
  );
}

export function drawHitSpark(
  frame: Frame,
  x: number,
  y: number,
  strength: number,
): void {
  if (strength <= 0) {
    return;
  }
  const cx = Math.round(x);
  const cy = Math.round(y);
  frame.fillRect(SPARK_COLOR, cx - SPARK_ARM, cy, SPARK_LENGTH, 1);
  frame.fillRect(SPARK_COLOR, cx, cy - SPARK_ARM, 1, SPARK_LENGTH);
  frame.fillRect(SPARK_CORE, cx - 1, cy - 1, SPARK_CORE_SIZE, SPARK_CORE_SIZE);
}

export function drawHud(frame: Frame, state: HudState): void {
  const { hearts, maximumHearts, ammo, hurtFlash } = state;
  if (hurtFlash > 0) {
    frame.fillRect(
      `${HURT_COLOR}${String(hurtFlash * HURT_STRENGTH)})`,
      0,
      0,
      frame.width,
      frame.height,
    );
  }
  for (let index = 0; index < maximumHearts; index += 1) {
    drawHeart(
      frame,
      MARGIN + index * (HEART_SIZE + HEART_GAP),
      MARGIN,
      index < hearts ? HEART_COLOR : HEART_EMPTY,
    );
  }
  drawAmmo(frame, ammo);
}

export function drawGameOver(frame: Frame): void {
  frame.fillRect(SHADE, 0, 0, frame.width, frame.height);
  drawCenteredText(frame, "GAME OVER", GAME_OVER_TOP, TITLE_COLOR);
  drawCenteredText(
    frame,
    "TAP TO RESTART",
    PROMPT_TOP + FONT_HEIGHT,
    PROMPT_COLOR,
  );
}

export function drawLevelClear(frame: Frame): void {
  frame.fillRect(SHADE, 0, 0, frame.width, frame.height);
  drawCenteredText(frame, "LEVEL CLEAR", GAME_OVER_TOP, CLEAR_COLOR);
  drawCenteredText(
    frame,
    "TAP TO RESTART",
    PROMPT_TOP + FONT_HEIGHT,
    PROMPT_COLOR,
  );
}
