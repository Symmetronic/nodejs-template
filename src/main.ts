import { createDisplay } from "#/src/display.ts";
import { startGame } from "#/src/game.ts";

const root = document.querySelector<HTMLElement>("#game");
if (root === null) {
  throw new Error("The page must contain the #game root element");
}

startGame(root, createDisplay(root));
