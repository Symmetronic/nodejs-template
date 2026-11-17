import { isPlayable, playMove, type Game } from "#/src/game.ts";

export type Difficulty = "easy" | "hard";

function legalMoves(game: Game): number[] {
  return game.board.flatMap((_, index) =>
    isPlayable(game, index) ? [index] : [],
  );
}

function emptyCellCount(game: Game): number {
  return game.board.filter((cell) => cell === undefined).length;
}

/** Positive when `mark` wins, negative when it loses; quicker wins score higher. */
function minimax(game: Game, mark: "X" | "O"): number {
  const { outcome } = game;
  if (outcome.status === "won") {
    const sign = outcome.winner === mark ? 1 : -1;
    return sign * (emptyCellCount(game) + 1);
  }
  if (outcome.status === "draw") {
    return 0;
  }
  const scores = legalMoves(game).map((index) =>
    minimax(playMove(game, index), mark),
  );
  return game.nextMark === mark ? Math.max(...scores) : Math.min(...scores);
}

function chooseBestMove(
  game: Game,
  moves: readonly number[],
): number | undefined {
  let best: { readonly index: number; readonly score: number } | undefined;
  for (const index of moves) {
    const score = minimax(playMove(game, index), game.nextMark);
    if (best === undefined || score > best.score) {
      best = { index, score };
    }
  }
  return best?.index;
}

/** Returns the cell index the player to move should take, or undefined if no move is possible. */
export function chooseMove(
  game: Game,
  difficulty: Difficulty,
  random: () => number = Math.random,
): number | undefined {
  const moves = legalMoves(game);
  return difficulty === "hard"
    ? chooseBestMove(game, moves)
    : moves[Math.floor(random() * moves.length)];
}
