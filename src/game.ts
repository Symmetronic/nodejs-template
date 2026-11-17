export type Mark = "X" | "O";

export type Cell = Mark | undefined;

type Line = readonly number[];

export type Outcome =
  | { readonly status: "in-progress" }
  | { readonly status: "won"; readonly winner: Mark; readonly line: Line }
  | { readonly status: "draw" };

export interface Game {
  readonly board: readonly Cell[];
  readonly nextMark: Mark;
  readonly outcome: Outcome;
}

const CELL_COUNT = 9;

const WINNING_LINES: readonly Line[] = "012 345 678 036 147 258 048 246"
  .split(" ")
  .map((line) => Array.from(line, Number));

export function createGame(firstMark: Mark = "X"): Game {
  return {
    board: Array.from({ length: CELL_COUNT }, () => undefined),
    nextMark: firstMark,
    outcome: { status: "in-progress" },
  };
}

export function evaluateBoard(board: readonly Cell[]): Outcome {
  for (const line of WINNING_LINES) {
    const [winner] = line.map((index) => board[index]);
    if (
      winner !== undefined &&
      line.every((index) => board[index] === winner)
    ) {
      return { status: "won", winner, line };
    }
  }
  return board.every((cell) => cell !== undefined)
    ? { status: "draw" }
    : { status: "in-progress" };
}

export function isPlayable(game: Game, index: number): boolean {
  return (
    game.outcome.status === "in-progress" &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < CELL_COUNT &&
    game.board[index] === undefined
  );
}

export function playMove(game: Game, index: number): Game {
  if (!isPlayable(game, index)) {
    return game;
  }
  const board = game.board.map((cell, position) =>
    position === index ? game.nextMark : cell,
  );
  return {
    board,
    nextMark: game.nextMark === "X" ? "O" : "X",
    outcome: evaluateBoard(board),
  };
}
