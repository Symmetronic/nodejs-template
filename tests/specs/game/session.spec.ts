import { type Game } from "#/src/game.ts";
import {
  createSession,
  playSessionMove,
  startNextRound,
  type Session,
} from "#/src/session.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Each digit is the index of the cell played next. */
function play(session: Session, moves: string): Session {
  return Array.from(moves, Number).reduce(playSessionMove, session);
}

function winnerOf(game: Game): unknown {
  return game.outcome.status === "won" ? game.outcome.winner : undefined;
}

describe("session", () => {
  it("starts with X to move and empty scores", () => {
    const session = createSession();
    assert.equal(session.game.nextMark, "X");
    assert.deepEqual(session.scores, { X: 0, O: 0, draws: 0 });
  });

  it("counts a win for the winner of a finished round", () => {
    const session = play(createSession(), "03142");
    assert.equal(winnerOf(session.game), "X");
    assert.deepEqual(session.scores, { X: 1, O: 0, draws: 0 });
  });

  it("counts a draw", () => {
    const session = play(createSession(), "012435768");
    assert.deepEqual(session.scores, { X: 0, O: 0, draws: 1 });
  });

  it("does not count a finished round twice", () => {
    const finished = play(createSession(), "03142");
    assert.deepEqual(play(finished, "58").scores, finished.scores);
  });

  it("keeps the scores and hands the first move to the other player on every new round", () => {
    const first = play(createSession(), "03142");
    const second = startNextRound(first);
    assert.equal(second.game.nextMark, "O");
    assert.deepEqual(second.scores, first.scores);
    assert.deepEqual(second.game.board, createSession().game.board);
    assert.equal(startNextRound(second).game.nextMark, "X");
  });

  it("hands the first move over when restarting an unfinished round", () => {
    const restarted = startNextRound(play(createSession(), "4"));
    assert.equal(restarted.game.nextMark, "O");
    assert.deepEqual(restarted.scores, { X: 0, O: 0, draws: 0 });
  });

  it("counts a win for O when O starts", () => {
    const session = play(startNextRound(createSession()), "03142");
    assert.equal(winnerOf(session.game), "O");
    assert.deepEqual(session.scores, { X: 0, O: 1, draws: 0 });
  });
});
