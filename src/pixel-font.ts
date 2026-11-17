const GLYPH_WIDTH = 3;
const GLYPH_HEIGHT = 5;
const HALF = 0.5;
const LETTER_SPACING = 1;

const GLYPHS: Readonly<Record<string, string>> = {
  " ": "000000000000000",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001010100111",
  "3": "110001010001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100111101111",
  "7": "111001010010010",
  "8": "111101111101111",
  "9": "111101111001110",
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "111101101101111",
  P: "110101110100100",
  Q: "111101101111001",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
};

function glyphOf(character: string): string {
  const glyph = GLYPHS[character];
  if (glyph === undefined) {
    throw new Error(`The pixel font has no glyph for "${character}"`);
  }
  return glyph;
}

export function measureText(text: string): number {
  return Math.max(
    0,
    text.length * (GLYPH_WIDTH + LETTER_SPACING) - LETTER_SPACING,
  );
}

export interface Frame {
  readonly width: number;
  readonly height: number;
  readonly fillRect: (
    color: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
}

export function drawText(
  frame: Frame,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  Array.from(text).forEach((character, index) => {
    const left = x + index * (GLYPH_WIDTH + LETTER_SPACING);
    Array.from(glyphOf(character)).forEach((pixel, position) => {
      if (pixel === "1") {
        frame.fillRect(
          color,
          left + (position % GLYPH_WIDTH),
          y + Math.floor(position / GLYPH_WIDTH),
          1,
          1,
        );
      }
    });
  });
}

export function drawCenteredText(
  frame: Frame,
  text: string,
  y: number,
  color: string,
): void {
  const x = Math.floor((frame.width - measureText(text)) * HALF);
  drawText(frame, text, x, y, color);
}

export const FONT_HEIGHT = GLYPH_HEIGHT;
