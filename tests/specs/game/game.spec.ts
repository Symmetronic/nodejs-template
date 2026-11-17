import {
  createGame,
  evaluateBoard,
  isPlayable,
  playMove,
  type Cell,
  type Game,
} from "#/src/game.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const WINNING_LINES = [
  "012",
  "345",
  "678",
  "036",
  "147",
  "258",
  "048",
  "246",
] as const;

/** Board notation: "X", "O", or "." for an empty cell, row by row. */
function parseBoard(notation: string): Cell[] {
  return Array.from(notation, (symbol) =>
    symbol === "X" || symbol === "O" ? symbol : undefined,
  );
}

/** Each digit is the index of the cell played next. */
function play(moves: string): Game {
  return Array.from(moves, Number).reduce(playMove, createGame());
}

const CENTER = 4;
const CORNER = 8;
const BEYOND_LAST_CELL = 9;

describe("game", () => {
  for (const line of WINNING_LINES) {
    it(`evaluateBoard reports X as the winner of line ${line}`, () => {
      const board = parseBoard(
        Array.from(".........", (_, index) =>
          line.includes(String(index)) ? "X" : ".",
        ).join(""),
      );
      assert.deepEqual(evaluateBoard(board), {
        status: "won",
        winner: "X",
        line: Array.from(line, Number),
      });
    });
  }

  it("evaluateBoard reports O as a winner too", () => {
    assert.deepEqual(evaluateBoard(parseBoard("XX.OOOX..")), {
      status: "won",
      winner: "O",
      line: Array.from("345", Number),
    });
  });

  it("evaluateBoard reports a draw on a full board without a winner", () => {
    assert.deepEqual(evaluateBoard(parseBoard("XOXXOOOXX")), {
      status: "draw",
    });
  });

  it("evaluateBoard reports an unfinished board as in progress", () => {
    assert.deepEqual(evaluateBoard(createGame().board), {
      status: "in-progress",
    });
    assert.deepEqual(play("048").outcome, { status: "in-progress" });
  });

  it("playMove alternates X and O starting with X", () => {
    const game = play("40");
    assert.deepEqual(game.board, parseBoard("O...X...."));
    assert.equal(game.nextMark, "X");
  });

  it("playMove ends the game with a win and a draw", () => {
    assert.equal(play("03142").outcome.status, "won");
    assert.deepEqual(play("012435768").outcome, { status: "draw" });
  });

  it("playMove ignores occupied cells", () => {
    const game = play("4");
    assert.equal(isPlayable(game, CENTER), false);
    assert.deepEqual(playMove(game, CENTER), game);
  });

  it("playMove ignores moves on a finished board", () => {
    const game = play("03142");
    assert.equal(isPlayable(game, CORNER), false);
    assert.deepEqual(playMove(game, CORNER), game);
  });

  it("playMove ignores cells outside the board", () => {
    const game = createGame();
    assert.deepEqual(playMove(game, BEYOND_LAST_CELL), game);
    assert.deepEqual(playMove(game, -1), game);
  });
});
