import { type Frame } from "#/src/pixel-font.ts";
import {
  type Camera,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  type Texture,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";

const HALF = 0.5;

export const FRAME_WIDTH = 160;
export const FRAME_HEIGHT = 284;

interface FramePoint {
  readonly x: number;
  readonly y: number;
}

interface Display {
  readonly frame: Frame;
  readonly clearFrame: () => void;
  readonly toFramePoint: (clientX: number, clientY: number) => FramePoint;
  readonly presentFrame: () => void;
  readonly presentWorld: (scene: Scene, camera: Camera) => void;
}

function createFullScreenScene(texture: Texture): Scene {
  const scene = new Scene();
  scene.add(
    new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: texture, transparent: true }),
    ),
  );
  return scene;
}

export function createDisplay(root: HTMLElement): Display {
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = FRAME_WIDTH;
  frameCanvas.height = FRAME_HEIGHT;
  const context = frameCanvas.getContext("2d");
  if (context === null) {
    throw new Error("A 2D canvas context is required");
  }
  const frame: Frame = {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    fillRect: (color, x, y, width, height) => {
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
    },
  };
  const frameTexture = new CanvasTexture(frameCanvas);
  frameTexture.minFilter = NearestFilter;
  frameTexture.magFilter = NearestFilter;

  const lowResolutionTarget = new WebGLRenderTarget(FRAME_WIDTH, FRAME_HEIGHT, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
  });

  const renderer = new WebGLRenderer({ antialias: false });
  root.append(renderer.domElement);

  const camera = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0, 1);
  const frameScene = createFullScreenScene(frameTexture);
  const screenScene = createFullScreenScene(lowResolutionTarget.texture);

  function fitToRoot(): void {
    const scale = Math.min(
      root.clientWidth / FRAME_WIDTH,
      root.clientHeight / FRAME_HEIGHT,
    );
    const width = Math.floor(FRAME_WIDTH * scale);
    const height = Math.floor(FRAME_HEIGHT * scale);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
  }
  new ResizeObserver(fitToRoot).observe(root);
  fitToRoot();

  function renderIntoTarget(scene: Scene, sceneCamera: Camera): void {
    renderer.setRenderTarget(lowResolutionTarget);
    renderer.render(scene, sceneCamera);
    renderer.setRenderTarget(null);
  }

  return {
    frame,
    clearFrame: () => {
      context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    },
    toFramePoint: (clientX, clientY) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - bounds.left) / bounds.width) * FRAME_WIDTH;
      const y = ((clientY - bounds.top) / bounds.height) * FRAME_HEIGHT;
      return {
        x: Math.min(FRAME_WIDTH, Math.max(0, x)),
        y: Math.min(FRAME_HEIGHT, Math.max(0, y)),
      };
    },
    presentFrame: () => {
      frameTexture.needsUpdate = true;
      renderIntoTarget(frameScene, camera);
      renderer.render(screenScene, camera);
    },
    presentWorld: (scene, worldCamera) => {
      renderIntoTarget(scene, worldCamera);
      frameTexture.needsUpdate = true;
      renderer.setRenderTarget(lowResolutionTarget);
      renderer.autoClear = false;
      renderer.render(frameScene, camera);
      renderer.autoClear = true;
      renderer.setRenderTarget(null);
      renderer.render(screenScene, camera);
    },
  };
}
