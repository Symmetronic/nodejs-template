import { assertIsObject } from "#/tests/utils/assert.ts";
import { connectMcpServer } from "#/tests/utils/mcp.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const OK = 200;
const NOT_FOUND = 404;
const SUBPATH = "/games/zombies/";
const MCP_SERVER = {
  command: "npx",
  args: [
    "--no-install",
    "chrome-devtools-mcp",
    "--headless",
    "--isolated",
    "--executablePath=/usr/bin/chromium",
    "--chrome-arg=--no-sandbox",
    "--no-usage-statistics",
    "--no-performance-crux",
  ],
};
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html",
  ".js": "text/javascript",
};

function textOf(result: Readonly<Record<string, unknown>>): string {
  const content = result["content"];
  assert.ok(Array.isArray(content), "Tool result must have content");
  return content
    .map((item: unknown) => {
      assertIsObject(item, "Content items must be objects");
      return String(item["text"]);
    })
    .join("\n");
}

function selectedPageId(pages: string): number {
  const match = /^(\d+): .*\[selected\]$/mu.exec(pages);
  assert.ok(match?.[1], `A page must be selected, got ${pages}`);
  return Number(match[1]);
}

async function readAmmo(
  client: Awaited<ReturnType<typeof connectMcpServer>>,
  pageId: number,
): Promise<number> {
  const result = await client.callTool("evaluate_script", {
    pageId,
    function: "() => document.querySelector('#game')?.dataset.ammo",
  });
  const match = /"(\d+)"/u.exec(textOf(result));
  assert.ok(match?.[1], "data-ammo must be set");
  return Number(match[1]);
}

describe("game page", () => {
  it("loads from a subpath, shows the title screen, starts playing, shoots and logs no console errors", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "game-"));
    const build = spawnSync(
      "node",
      ["scripts/build.ts", "build", outputDirectory],
      { encoding: "utf8" },
    );
    assert.equal(build.status, 0, build.stderr);

    const server = createServer((request, response) => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      const file = path.endsWith("/") ? `${path}index.html` : path;
      if (!file.startsWith(SUBPATH)) {
        response.writeHead(NOT_FOUND).end();
        return;
      }
      const relative = file.slice(SUBPATH.length);
      readFile(join(outputDirectory, relative)).then(
        (content) => {
          const extension = relative.slice(relative.lastIndexOf("."));
          response
            .writeHead(OK, {
              "content-type": CONTENT_TYPES[extension] ?? "text/plain",
            })
            .end(content);
        },
        () => response.writeHead(NOT_FOUND).end(),
      );
    });
    server.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address !== null && typeof address === "object");
    const { port } = address;

    try {
      await using client = await connectMcpServer(MCP_SERVER);
      const opened = await client.callTool("new_page", {
        url: `http://127.0.0.1:${String(port)}${SUBPATH}`,
      });
      const pageId = selectedPageId(textOf(opened));
      const screen = await client.callTool("evaluate_script", {
        pageId,
        function: "() => document.querySelector('#game')?.dataset.screen",
      });
      assert.match(textOf(screen), /"title"/u);
      await client.callTool("evaluate_script", {
        pageId,
        function:
          "() => document.querySelector('#game')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))",
      });
      const playing = await client.callTool("evaluate_script", {
        pageId,
        function: "() => document.querySelector('#game')?.dataset.screen",
      });
      assert.match(textOf(playing), /"playing"/u);
      const ammoBefore = await readAmmo(client, pageId);
      await client.callTool("evaluate_script", {
        pageId,
        function:
          "() => document.querySelector('#game')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))",
      });
      assert.equal(await readAmmo(client, pageId), ammoBefore - 1);
      const messages = await client.callTool("list_console_messages", {
        pageId,
      });
      assert.doesNotMatch(textOf(messages), /\[error\]/u);
    } finally {
      server.close();
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
