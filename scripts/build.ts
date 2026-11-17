import { build, context, type BuildOptions } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PROJECT_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_OUTPUT_DIRECTORY = `${PROJECT_DIRECTORY}dist`;
const FIRST_ARGUMENT = 2;
const DEV_SERVER_PORT = 8080;

function bundleOptions(outputDirectory: string): BuildOptions {
  return {
    entryPoints: [`${PROJECT_DIRECTORY}src/main.ts`],
    outdir: outputDirectory,
    bundle: true,
    format: "iife",
    target: "es2022",
    logLevel: "info",
  };
}

const STATIC_FILES = ["index.html", "assets/infected-sector.m4a"];

async function copyStaticFiles(outputDirectory: string): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(
    STATIC_FILES.map(async (file) =>
      copyFile(
        `${PROJECT_DIRECTORY}src/${file}`,
        `${outputDirectory}/${file.slice(file.lastIndexOf("/") + 1)}`,
      ),
    ),
  );
}

async function buildGame(
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
): Promise<void> {
  await copyStaticFiles(outputDirectory);
  await build({ ...bundleOptions(outputDirectory), minify: true });
}

async function serveGame(
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
): Promise<void> {
  await copyStaticFiles(outputDirectory);
  const watching = await context({
    ...bundleOptions(outputDirectory),
    sourcemap: "inline",
  });
  await watching.watch();
  await watching.serve({
    host: "0.0.0.0",
    port: DEV_SERVER_PORT,
    servedir: outputDirectory,
  });
}

const [mode, outputDirectory] = process.argv.slice(FIRST_ARGUMENT);

if (mode === "build") {
  await buildGame(outputDirectory);
} else if (mode === "serve") {
  await serveGame(outputDirectory);
} else {
  throw new Error(`Unknown mode "${String(mode)}", use "build" or "serve"`);
}
