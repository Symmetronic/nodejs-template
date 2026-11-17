import {
  createGame,
  playMove,
  type Game,
  type Mark,
  type Outcome,
} from "#/src/game.ts";

interface Scores {
  readonly X: number;
  readonly O: number;
  readonly draws: number;
}

export interface Session {
  readonly game: Game;
  readonly scores: Scores;
  readonly round: number;
}

const FIRST_ROUND = 1;

const STARTER_ALTERNATION = 2;

function startingMark(round: number): Mark {
  return (round - FIRST_ROUND) % STARTER_ALTERNATION === 0 ? "X" : "O";
}

function addResult(scores: Scores, outcome: Outcome): Scores {
  switch (outcome.status) {
    case "won":
      return { ...scores, [outcome.winner]: scores[outcome.winner] + 1 };
    case "draw":
      return { ...scores, draws: scores.draws + 1 };
    case "in-progress":
      return scores;
  }
}

export function createSession(): Session {
  return {
    game: createGame(startingMark(FIRST_ROUND)),
    scores: { X: 0, O: 0, draws: 0 },
    round: FIRST_ROUND,
  };
}

export function playSessionMove(session: Session, index: number): Session {
  const game = playMove(session.game, index);
  if (game === session.game) {
    return session;
  }
  return { ...session, game, scores: addResult(session.scores, game.outcome) };
}

export function startNextRound(session: Session): Session {
  const round = session.round + 1;
  return { ...session, game: createGame(startingMark(round)), round };
}
