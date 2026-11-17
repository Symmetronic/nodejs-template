import { createAudio } from "#/src/audio.ts";
import { type Difficulty } from "#/src/computer.ts";
import { clearMark, createEffects, drawMark } from "#/src/effects.ts";
import { isPlayable, type Game } from "#/src/game.ts";
import {
  createSession,
  hasComputerWon,
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
const muteElement = requireElement("mute");
const modeElement = requireSelect("mode");
const difficultyElement = requireSelect("difficulty");
const scoreElements = {
  X: requireElement("score-x"),
  O: requireElement("score-o"),
  draws: requireElement("score-draws"),
};

const audio = createAudio();
let session = createSession();
let renderedGame: Game | undefined;
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
  cell.addEventListener("mouseenter", () => {
    if (isPlayable(session.game, index) && !isComputerTurn(session)) {
      audio.play("hover");
    }
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

const effects = createEffects(boardElement, cellElements);

restartElement.addEventListener("click", () => {
  audio.play("restart");
  update(startNextRound(session));
});

muteElement.addEventListener("click", () => {
  audio.setMuted(!audio.isMuted());
  renderMuteButton();
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

function renderMarks(game: Game): void {
  for (const [index, cell] of cellElements.entries()) {
    const mark = game.board[index];
    if (mark === renderedGame?.board[index]) {
      continue;
    }
    if (mark === undefined) {
      clearMark(cell);
    } else {
      drawMark(cell, mark);
      audio.play(`place-${mark}`);
    }
  }
}

function renderMuteButton(): void {
  muteElement.textContent = audio.isMuted() ? "Unmute" : "Mute";
  muteElement.ariaPressed = String(audio.isMuted());
}

function renderEffects(game: Game): void {
  if (game.outcome.status === "in-progress") {
    effects.clear();
  } else if (renderedGame?.outcome.status === "in-progress") {
    if (game.outcome.status === "won") {
      effects.showWin(game.outcome.line, game.outcome.winner);
      audio.play(hasComputerWon(session) ? "womp" : "win");
    } else {
      effects.showDraw();
      audio.play("womp");
    }
  }
}

function render(): void {
  const { game, scores } = session;
  renderMarks(game);
  renderEffects(game);
  renderedGame = game;
  const humanCanMove =
    game.outcome.status === "in-progress" && !isComputerTurn(session);
  if (humanCanMove) {
    boardElement.dataset["next"] = game.nextMark;
  } else {
    delete boardElement.dataset["next"];
  }
  for (const [index, cell] of cellElements.entries()) {
    cell.dataset["preview"] = game.nextMark;
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

renderMuteButton();
render();
