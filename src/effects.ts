import { type Mark } from "#/src/game.ts";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const MARK_PATHS: Readonly<Record<Mark, readonly string[]>> = {
  X: ["M22 22L78 78", "M78 22L22 78"],
  O: ["M50 18a32 32 0 1 1 -0.01 0"],
};

const MARK_COLORS: Readonly<Record<Mark, string>> = {
  X: "#00e5ff",
  O: "#ff2fd6",
};

const CONFETTI_COLORS = ["#00e5ff", "#ff2fd6", "#fff700", "#7cff4d", "#ffffff"];
const CONFETTI_COUNT = 140;
const CONFETTI_GRAVITY = 0.18;
const CONFETTI_MAX_SPEED = 11;
const CONFETTI_MIN_SPEED = 3;
const CONFETTI_LIFETIME_IN_FRAMES = 110;
const CONFETTI_SIZE = 7;
const FULL_CIRCLE = Math.PI + Math.PI;
const HALF = 2;
const UPWARD_BIAS = 4;

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  age: number;
  color: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createSvgElement<Name extends keyof SVGElementTagNameMap>(
  name: Name,
): SVGElementTagNameMap[Name] {
  return document.createElementNS(SVG_NAMESPACE, name);
}

function createStroke(d: string, color: string): SVGPathElement {
  const path = createSvgElement("path");
  path.setAttribute("d", d);
  path.setAttribute("pathLength", "1");
  path.setAttribute("class", "stroke");
  path.setAttribute("stroke", color);
  path.style.color = color;
  return path;
}

export function drawMark(cell: HTMLElement, mark: Mark): void {
  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("class", `mark mark-${mark}`);
  svg.setAttribute("aria-hidden", "true");
  svg.append(
    ...MARK_PATHS[mark].map((d) => createStroke(d, MARK_COLORS[mark])),
  );
  cell.replaceChildren(svg);
}

export function clearMark(cell: HTMLElement): void {
  cell.replaceChildren();
}

function centerOf(cell: HTMLElement): readonly [number, number] {
  return [
    cell.offsetLeft + cell.offsetWidth / HALF,
    cell.offsetTop + cell.offsetHeight / HALF,
  ];
}

function createParticle(originX: number, originY: number): Particle {
  const angle = Math.random() * FULL_CIRCLE;
  const speed =
    CONFETTI_MIN_SPEED +
    Math.random() * (CONFETTI_MAX_SPEED - CONFETTI_MIN_SPEED);
  return {
    x: originX,
    y: originY,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed - UPWARD_BIAS,
    age: 0,
    color:
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ??
      "#ffffff",
  };
}

export interface Effects {
  readonly showWin: (line: readonly number[], mark: Mark) => void;
  readonly showDraw: () => void;
  readonly clear: () => void;
}

export function createEffects(
  board: HTMLElement,
  cells: readonly HTMLElement[],
): Effects {
  const overlay = createSvgElement("svg");
  overlay.setAttribute("class", "win-overlay");
  overlay.setAttribute("aria-hidden", "true");
  board.append(overlay);

  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  let animationFrame: number | undefined;

  function stopConfetti(): void {
    if (animationFrame !== undefined) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function startConfetti(): void {
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const bounds = board.getBoundingClientRect();
    const particles = Array.from({ length: CONFETTI_COUNT }, () =>
      createParticle(
        bounds.left + bounds.width / HALF,
        bounds.top + bounds.height / HALF,
      ),
    );

    function step(): void {
      context?.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const particle of particles) {
        particle.age += 1;
        particle.velocityY += CONFETTI_GRAVITY;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        if (context !== null && particle.age < CONFETTI_LIFETIME_IN_FRAMES) {
          alive = true;
          context.globalAlpha = 1 - particle.age / CONFETTI_LIFETIME_IN_FRAMES;
          context.fillStyle = particle.color;
          context.fillRect(
            particle.x,
            particle.y,
            CONFETTI_SIZE,
            CONFETTI_SIZE,
          );
        }
      }
      animationFrame = alive ? requestAnimationFrame(step) : undefined;
    }
    animationFrame = requestAnimationFrame(step);
  }

  function clear(): void {
    stopConfetti();
    overlay.replaceChildren();
    board.classList.remove("shake");
  }

  return {
    showWin(line, mark) {
      const first = cells[line[0] ?? 0];
      const last = cells[line.at(-1) ?? 0];
      if (first === undefined || last === undefined) {
        return;
      }
      const [startX, startY] = centerOf(first);
      const [endX, endY] = centerOf(last);
      overlay.setAttribute(
        "viewBox",
        `0 0 ${String(board.clientWidth)} ${String(board.clientHeight)}`,
      );
      overlay.replaceChildren(
        createStroke(
          `M${String(startX)} ${String(startY)}L${String(endX)} ${String(endY)}`,
          MARK_COLORS[mark],
        ),
      );
      if (!prefersReducedMotion()) {
        startConfetti();
      }
    },
    showDraw() {
      if (!prefersReducedMotion()) {
        board.classList.add("shake");
      }
    },
    clear,
  };
}
