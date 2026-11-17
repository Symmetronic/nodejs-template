import { type createDisplay } from "#/src/display.ts";
import { LEVELS } from "#/src/levels/index.ts";
import { createRail } from "#/src/rail.ts";
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
    const rail = createRail(level.rail);
    const world = createWorld(level);
    let distance = 0;
    let previous: number | undefined;
    dataset["screen"] = "playing";

    function frame(now: number): void {
      const deltaSeconds = Math.min(
        MAXIMUM_DELTA_SECONDS,
        (now - (previous ?? now)) / MILLISECONDS_PER_SECOND,
      );
      previous = now;
      distance = rail.advance(distance, level.speed * deltaSeconds);
      const { position, direction } = rail.sampleAt(distance);
      world.update(
        position,
        direction,
        deltaSeconds,
        now / MILLISECONDS_PER_SECOND,
      );
      display.presentWorld(world.scene, world.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  showTitle();
}
