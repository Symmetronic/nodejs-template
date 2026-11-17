import { nextLevel } from "#/src/campaign.ts";
import { type createDisplay } from "#/src/display.ts";
import {
  drawGameOver,
  drawHitSpark,
  drawHud,
  drawLevelClear,
  drawMuzzleFlash,
} from "#/src/hud.ts";
import { type Level } from "#/src/level.ts";
import { LEVELS } from "#/src/levels/index.ts";
import { createSession, type Session } from "#/src/session.ts";
import { drawTitleScreen } from "#/src/title-screen.ts";
import { createWorld } from "#/src/world.ts";

const MILLISECONDS_PER_SECOND = 1000;
const MAXIMUM_DELTA_SECONDS = 0.1;
const MUZZLE_FLASH_SECONDS = 0.08;
const SPARK_SECONDS = 0.12;
const RESTART_LOCK_MILLISECONDS = 600;

interface Spark {
  readonly x: number;
  readonly y: number;
  seconds: number;
}

export function startGame(
  root: HTMLElement,
  display: ReturnType<typeof createDisplay>,
): void {
  const { dataset } = root;
  let onTap: (event: PointerEvent) => void = () => undefined;
  root.addEventListener("pointerdown", (event) => {
    onTap(event);
  });

  function showTitle(): void {
    dataset["screen"] = "title";
    drawTitleScreen(display.frame);
    display.presentFrame();
    onTap = () => {
      play(LEVELS[0]);
    };
  }

  function play(level: Level): void {
    const session = createSession(level);
    const world = createWorld(level);
    let previous: number | undefined;
    let muzzleSeconds = 0;
    let spark: Spark | undefined;
    dataset["screen"] = "playing";
    syncDataset(session);
    onTap = (event) => {
      const point = display.toFramePoint(event.clientX, event.clientY);
      const result = session.shoot(world.rayThrough(point.x, point.y));
      syncDataset(session);
      if (result === "none") {
        return;
      }
      if (result !== "dry") {
        muzzleSeconds = MUZZLE_FLASH_SECONDS;
      }
      if (result === "body" || result === "head" || result === "crate") {
        spark = { x: point.x, y: point.y, seconds: SPARK_SECONDS };
      }
    };

    function syncDataset(current: Session): void {
      dataset["hearts"] = String(current.hearts);
      dataset["ammo"] = String(current.ammo);
    }

    function render(elapsedSeconds: number, deltaSeconds: number): void {
      world.update(
        session.cameraPosition,
        session.cameraDirection,
        deltaSeconds,
        elapsedSeconds,
        session.zombies,
        session.crates,
      );
      display.clearFrame();
      drawHud(display.frame, session);
      drawMuzzleFlash(display.frame, muzzleSeconds);
      if (spark !== undefined) {
        drawHitSpark(display.frame, spark.x, spark.y, spark.seconds);
        spark.seconds -= deltaSeconds;
        if (spark.seconds <= 0) {
          spark = undefined;
        }
      }
      muzzleSeconds = Math.max(0, muzzleSeconds - deltaSeconds);
      syncDataset(session);
      if (session.status === "gameover") {
        drawGameOver(display.frame);
      }
      if (
        session.status === "cleared" &&
        nextLevel(LEVELS, level) === undefined
      ) {
        drawLevelClear(display.frame);
      }
      display.presentWorld(world.scene, world.camera);
    }

    function finish(restart: () => void, screen: "gameover" | "clear"): void {
      dataset["screen"] = screen;
      const lockedUntil = performance.now() + RESTART_LOCK_MILLISECONDS;
      onTap = () => {
        if (performance.now() >= lockedUntil) {
          restart();
        }
      };
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
        finish(() => {
          play(level);
        }, "gameover");
        return;
      }
      if (session.status === "cleared") {
        const following = nextLevel(LEVELS, level);
        if (following === undefined) {
          finish(() => {
            play(LEVELS[0]);
          }, "clear");
        } else {
          play(following);
        }
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  showTitle();
}
