import { chooseMove } from "#/src/computer.ts";
import { createGame, playMove, type Game, type Mark } from "#/src/game.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ALWAYS_FIRST = () => 0;
const JUST_BELOW_ONE = 0.999;
const ALWAYS_LAST = () => JUST_BELOW_ONE;

/** Each digit is the index of the cell played next. */
function play(moves: string, first: Mark = "X"): Game {
  return Array.from(moves, Number).reduce(playMove, createGame(first));
}

function hasLost(game: Game, computer: Mark): boolean {
  return game.outcome.status === "won" && game.outcome.winner !== computer;
}

function computerNeverLoses(game: Game, computer: Mark): boolean {
  if (game.outcome.status !== "in-progress") {
    return !hasLost(game, computer);
  }
  if (game.nextMark === computer) {
    const move = chooseMove(game, "hard");
    return (
      move !== undefined && computerNeverLoses(playMove(game, move), computer)
    );
  }
  return game.board.every(
    (cell, index) =>
      cell !== undefined || computerNeverLoses(playMove(game, index), computer),
  );
}

const FIRST_LEGAL_CELL = 1;
const LAST_LEGAL_CELL = 8;
const RANDOM_ATTEMPTS = 100;
const WIN_AT_TOP_RIGHT = 2;
const WIN_AT_RIGHT_MIDDLE = 5;

describe("computer", () => {
  it("easy plays a random legal move", () => {
    const game = play("04");
    assert.equal(chooseMove(game, "easy", ALWAYS_FIRST), FIRST_LEGAL_CELL);
    assert.equal(chooseMove(game, "easy", ALWAYS_LAST), LAST_LEGAL_CELL);
    for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
      const move = chooseMove(game, "easy");
      assert.ok(move !== undefined && game.board[move] === undefined);
    }
  });

  it("returns no move on a finished board", () => {
    assert.equal(chooseMove(play("03142"), "hard"), undefined);
    assert.equal(chooseMove(play("03142"), "easy"), undefined);
  });

  it("hard takes an immediate win", () => {
    assert.equal(chooseMove(play("0314"), "hard"), WIN_AT_TOP_RIGHT);
  });

  it("hard takes its own win instead of blocking", () => {
    assert.equal(chooseMove(play("03148"), "hard"), WIN_AT_RIGHT_MIDDLE);
  });

  it("hard blocks an immediate loss", () => {
    assert.equal(chooseMove(play("041"), "hard"), WIN_AT_TOP_RIGHT);
  });

  it("hard never loses as O against every human move sequence", () => {
    assert.ok(computerNeverLoses(createGame("X"), "O"));
  });

  it("hard never loses as X against every human move sequence", () => {
    assert.ok(computerNeverLoses(createGame("X"), "X"));
  });
});
