import { createDisplay } from "#/src/display.ts";
import { drawTitleScreen } from "#/src/title-screen.ts";

const root = document.querySelector<HTMLElement>("#game");
if (root === null) {
  throw new Error("The page must contain the #game root element");
}

const display = createDisplay(root);
root.dataset["screen"] = "title";
drawTitleScreen(display.frame);
display.present();
