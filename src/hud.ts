import {
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

function drawCentered(
  frame: Frame,
  text: string,
  y: number,
  color: string,
): void {
  drawText(
    frame,
    text,
    Math.floor((frame.width - measureText(text)) * HALF),
    y,
    color,
  );
}

export function drawHud(
  frame: Frame,
  hearts: number,
  maximumHearts: number,
  hurtFlash: number,
): void {
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
}

export function drawGameOver(frame: Frame): void {
  frame.fillRect(SHADE, 0, 0, frame.width, frame.height);
  drawCentered(frame, "GAME OVER", GAME_OVER_TOP, TITLE_COLOR);
  drawCentered(frame, "TAP TO RESTART", PROMPT_TOP + FONT_HEIGHT, PROMPT_COLOR);
}
