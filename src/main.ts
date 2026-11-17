import { type Difficulty } from "#/src/computer.ts";
import { isPlayable, type Game } from "#/src/game.ts";
import {
  createSession,
  isComputerTurn,
  playComputerMove,
  playSessionMove,
  selectDifficulty,
  selectMode,
  startNextRound,
  type Mode,
  type Session,
} from "#/src/session.ts";

const BOARD_SIZE = 3;

const COMPUTER_MOVE_DELAY_IN_MILLISECONDS = 500;

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

function requireSelect(id: string): HTMLSelectElement {
  const element = requireElement(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Element #${id} must be a select`);
  }
  return element;
}

function parseMode(value: string): Mode {
  return value === "computer" ? "computer" : "two-player";
}

function parseDifficulty(value: string): Difficulty {
  return value === "hard" ? "hard" : "easy";
}

const boardElement = requireElement("board");
const statusElement = requireElement("status");
const restartElement = requireElement("restart");
const modeElement = requireSelect("mode");
const difficultyElement = requireSelect("difficulty");
const scoreElements = {
  X: requireElement("score-x"),
  O: requireElement("score-o"),
  draws: requireElement("score-draws"),
};

let session = createSession();
let computerMoveTimer: ReturnType<typeof setTimeout> | undefined;

function update(next: Session): void {
  clearTimeout(computerMoveTimer);
  session = next;
  render();
  if (isComputerTurn(session)) {
    computerMoveTimer = setTimeout(() => {
      update(playComputerMove(session));
    }, COMPUTER_MOVE_DELAY_IN_MILLISECONDS);
  }
}

function describeCell(index: number): string {
  const row = Math.floor(index / BOARD_SIZE) + 1;
  const column = (index % BOARD_SIZE) + 1;
  const mark = session.game.board[index] ?? "empty";
  return `Row ${String(row)}, column ${String(column)}, ${mark}`;
}

function moveFocus(index: number, key: string): void {
  const row = Math.floor(index / BOARD_SIZE);
  const column = index % BOARD_SIZE;
  const target = {
    ArrowUp: [row - 1, column],
    ArrowDown: [row + 1, column],
    ArrowLeft: [row, column - 1],
    ArrowRight: [row, column + 1],
  }[key];
  const [targetRow, targetColumn] = target ?? [];
  if (
    targetRow === undefined ||
    targetColumn === undefined ||
    targetRow < 0 ||
    targetRow >= BOARD_SIZE ||
    targetColumn < 0 ||
    targetColumn >= BOARD_SIZE
  ) {
    return;
  }
  cellElements[targetRow * BOARD_SIZE + targetColumn]?.focus();
}

const cellElements = session.game.board.map((_, index) => {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "cell";
  cell.dataset["index"] = String(index);
  cell.addEventListener("click", () => {
    update(playSessionMove(session, index));
  });
  cell.addEventListener("keydown", (event) => {
    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      moveFocus(index, event.key);
    }
  });
  boardElement.append(cell);
  return cell;
});

restartElement.addEventListener("click", () => {
  update(startNextRound(session));
});

modeElement.addEventListener("change", () => {
  update(selectMode(session, parseMode(modeElement.value)));
});

difficultyElement.addEventListener("change", () => {
  update(selectDifficulty(session, parseDifficulty(difficultyElement.value)));
});

function describeStatus(game: Game): string {
  switch (game.outcome.status) {
    case "won":
      return `${game.outcome.winner} wins!`;
    case "draw":
      return "It's a draw!";
    case "in-progress":
      return `${game.nextMark} to move`;
  }
}

function render(): void {
  const { game, scores } = session;
  for (const [index, cell] of cellElements.entries()) {
    cell.textContent = game.board[index] ?? "";
    cell.ariaLabel = describeCell(index);
    cell.ariaDisabled = String(!isPlayable(game, index));
  }
  statusElement.textContent = describeStatus(game);
  modeElement.value = session.mode;
  difficultyElement.value = session.difficulty;
  difficultyElement.disabled = session.mode !== "computer";
  scoreElements.X.textContent = String(scores.X);
  scoreElements.O.textContent = String(scores.O);
  scoreElements.draws.textContent = String(scores.draws);
}

render();
