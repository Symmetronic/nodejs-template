import { type createDisplay } from "#/src/display.ts";
import { drawGameOver, drawHud } from "#/src/hud.ts";
import { LEVELS } from "#/src/levels/index.ts";
import { createSession } from "#/src/session.ts";
import { drawTitleScreen } from "#/src/title-screen.ts";
import { createWorld } from "#/src/world.ts";

const MILLISECONDS_PER_SECOND = 1000;
const MAXIMUM_DELTA_SECONDS = 0.1;

export function startGame(
  root: HTMLElement,
  display: ReturnType<typeof createDisplay>,
): void {
  const { dataset } = root;

  function showTitle(): void {
    dataset["screen"] = "title";
    drawTitleScreen(display.frame);
    display.presentFrame();
    root.addEventListener("pointerdown", play, { once: true });
  }

  function play(): void {
    const [level] = LEVELS;
    const session = createSession(level);
    const world = createWorld(level);
    let previous: number | undefined;
    dataset["screen"] = "playing";

    function render(elapsedSeconds: number, deltaSeconds: number): void {
      world.update(
        session.cameraPosition,
        session.cameraDirection,
        deltaSeconds,
        elapsedSeconds,
        session.zombies,
      );
      display.clearFrame();
      drawHud(
        display.frame,
        session.hearts,
        session.maximumHearts,
        session.hurtFlash,
      );
      dataset["hearts"] = String(session.hearts);
      if (session.status === "gameover") {
        drawGameOver(display.frame);
      }
      display.presentWorld(world.scene, world.camera);
    }

    function frame(now: number): void {
      const deltaSeconds = Math.min(
        MAXIMUM_DELTA_SECONDS,
        (now - (previous ?? now)) / MILLISECONDS_PER_SECOND,
      );
      previous = now;
      session.update(deltaSeconds);
      render(now / MILLISECONDS_PER_SECOND, deltaSeconds);
      if (session.status === "gameover") {
        dataset["screen"] = "gameover";
        root.addEventListener("pointerdown", play, { once: true });
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  showTitle();
}
