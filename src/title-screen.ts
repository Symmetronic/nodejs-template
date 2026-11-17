import {
  drawText,
  FONT_HEIGHT,
  measureText,
  type Frame,
} from "#/src/pixel-font.ts";

const HALF = 0.5;
const BACKGROUND = "#0b0b10";
const TITLE_COLOR = "#b3261e";
const PROMPT_COLOR = "#d9d4c7";
const TITLE_LINES = ["ZOMBIE", "RAIL", "SHOOTER"];
const LINE_GAP = 3;
const TITLE_TOP = 80;
const PROMPT_TOP = 180;

function drawCentered(
  frame: Frame,
  text: string,
  y: number,
  color: string,
): void {
  const x = Math.floor((frame.width - measureText(text)) * HALF);
  drawText(frame, text, x, y, color);
}

export function drawTitleScreen(frame: Frame): void {
  frame.fillRect(BACKGROUND, 0, 0, frame.width, frame.height);
  TITLE_LINES.forEach((line, index) => {
    drawCentered(
      frame,
      line,
      TITLE_TOP + index * (FONT_HEIGHT + LINE_GAP),
      TITLE_COLOR,
    );
  });
  drawCentered(frame, "TAP TO START", PROMPT_TOP, PROMPT_COLOR);
}
