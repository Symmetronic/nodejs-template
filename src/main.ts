import { createGame, isPlayable, playMove, type Game } from "#/src/game.ts";

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

const boardElement = requireElement("board");
const statusElement = requireElement("status");

let game: Game = createGame();

const cellElements = game.board.map((_, index) => {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "cell";
  cell.dataset["index"] = String(index);
  cell.addEventListener("click", () => {
    game = playMove(game, index);
    render();
  });
  boardElement.append(cell);
  return cell;
});

function describeStatus(current: Game): string {
  switch (current.outcome.status) {
    case "won":
      return `${current.outcome.winner} wins!`;
    case "draw":
      return "It's a draw!";
    case "in-progress":
      return `${current.nextMark} to move`;
  }
}

function render(): void {
  for (const [index, cell] of cellElements.entries()) {
    cell.textContent = game.board[index] ?? "";
    cell.disabled = !isPlayable(game, index);
  }
  statusElement.textContent = describeStatus(game);
}

render();
