import { build, context, type BuildOptions } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";

const DEFAULT_OUTPUT_DIRECTORY = "dist";
const DEV_SERVER_PORT = 8080;

const {
  positionals: [mode = "build", outputDirectory = DEFAULT_OUTPUT_DIRECTORY],
} = parseArgs({ allowPositionals: true });

const options: BuildOptions = {
  entryPoints: ["src/main.ts"],
  outfile: `${outputDirectory}/game.js`,
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: false,
  logLevel: "info",
};

await mkdir(outputDirectory, { recursive: true });
await copyFile("src/index.html", `${outputDirectory}/index.html`);

if (mode === "dev") {
  const devContext = await context({ ...options, minify: false });
  await devContext.watch();
  await devContext.serve({ servedir: outputDirectory, port: DEV_SERVER_PORT });
} else {
  await build(options);
}
