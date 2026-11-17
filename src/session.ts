import { chooseMove, type Difficulty } from "#/src/computer.ts";
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

export type Mode = "two-player" | "computer";

export interface Session {
  readonly mode: Mode;
  readonly difficulty: Difficulty;
  readonly game: Game;
  readonly scores: Scores;
  readonly round: number;
}

const FIRST_ROUND = 1;

const COMPUTER_MARK: Mark = "O";

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
    mode: "two-player",
    difficulty: "easy",
    game: createGame(startingMark(FIRST_ROUND)),
    scores: { X: 0, O: 0, draws: 0 },
    round: FIRST_ROUND,
  };
}

export function isComputerTurn(session: Session): boolean {
  return (
    session.mode === "computer" &&
    session.game.nextMark === COMPUTER_MARK &&
    session.game.outcome.status === "in-progress"
  );
}

export function hasComputerWon(session: Session): boolean {
  const { outcome } = session.game;
  return (
    session.mode === "computer" &&
    outcome.status === "won" &&
    outcome.winner === COMPUTER_MARK
  );
}

function applyMove(session: Session, index: number): Session {
  const game = playMove(session.game, index);
  if (game === session.game) {
    return session;
  }
  return { ...session, game, scores: addResult(session.scores, game.outcome) };
}

export function playSessionMove(session: Session, index: number): Session {
  return isComputerTurn(session) ? session : applyMove(session, index);
}

export function playComputerMove(
  session: Session,
  random?: () => number,
): Session {
  if (!isComputerTurn(session)) {
    return session;
  }
  const index = chooseMove(session.game, session.difficulty, random);
  return index === undefined ? session : applyMove(session, index);
}

export function startNextRound(session: Session): Session {
  const round = session.round + 1;
  return { ...session, game: createGame(startingMark(round)), round };
}

function startFirstRound(session: Session): Session {
  return {
    ...session,
    game: createGame(startingMark(FIRST_ROUND)),
    round: FIRST_ROUND,
  };
}

export function selectMode(session: Session, mode: Mode): Session {
  return startFirstRound({ ...session, mode });
}

export function selectDifficulty(
  session: Session,
  difficulty: Difficulty,
): Session {
  return startFirstRound({ ...session, difficulty });
}
