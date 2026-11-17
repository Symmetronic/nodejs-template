import mcp from "#/.mcp.json" with { type: "json" };
import { assertIsObject } from "#/tests/utils/assert.ts";
import { connectMcpServer } from "#/tests/utils/mcp.ts";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  "/": "text/html",
  "/index.html": "text/html",
  "/game.js": "text/javascript",
};

function textOf(result: Readonly<Record<string, unknown>>): string {
  const content = result["content"];
  assert.ok(Array.isArray(content), "tool result must have content");
  return content
    .map((item: unknown) => {
      assertIsObject(item, "content item must be an object");
      return String(item["text"]);
    })
    .join("\n");
}

describe("browser", () => {
  it("the built page plays a game to a win without console errors", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "game-"));
    const server = createServer((request, response) => {
      const path = request.url ?? "/";
      const contentType = CONTENT_TYPES[path];
      const file = path === "/" ? "index.html" : path.slice(1);
      if (contentType === undefined) {
        response.writeHead(HTTP_NOT_FOUND).end();
        return;
      }
      readFile(join(outputDirectory, file)).then(
        (body) =>
          response
            .writeHead(HTTP_OK, { "content-type": contentType })
            .end(body),
        () => response.writeHead(HTTP_SERVER_ERROR).end(),
      );
    });
    await using client = await connectMcpServer(
      mcp.mcpServers["chrome-devtools"],
    );
    try {
      execFileSync("node", ["scripts/build.ts", "build", outputDirectory], {
        stdio: "pipe",
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const address = server.address();
      assert.ok(
        typeof address === "object" && address !== null,
        "server must listen on a port",
      );

      const pages = textOf(
        await client.callTool("new_page", {
          url: `http://127.0.0.1:${String(address.port)}/`,
        }),
      );
      const pageId = Number(/^(\d+):.*\[selected\]$/mu.exec(pages)?.[1]);
      assert.ok(
        Number.isInteger(pageId),
        `new_page must select a page: ${pages}`,
      );
      const result = await client.callTool("evaluate_script", {
        pageId,
        function: `() => {
          const cells = [...document.querySelectorAll("#board .cell")];
          for (const index of [0, 3, 1, 4, 2]) cells[index].click();
          return {
            status: document.getElementById("status").textContent,
            marks: cells.map((cell) => cell.textContent).join(""),
            scores: document.getElementById("scoreboard").textContent.replace(/\\s+/g, " ").trim(),
            disabled: cells.every((cell) => cell.ariaDisabled === "true"),
          };
        }`,
      });
      const text = textOf(result);
      assert.match(text, /X wins!/u);
      assert.match(text, /XXXOO/u);
      assert.match(text, /"disabled":true/u);
      assert.match(text, /X wins: 1 O wins: 0 Draws: 0/u);

      const restarted = textOf(
        await client.callTool("evaluate_script", {
          pageId,
          function: `() => {
            document.getElementById("restart").click();
            return document.getElementById("status").textContent;
          }`,
        }),
      );
      assert.match(restarted, /O to move/u);

      const messages = textOf(
        await client.callTool("list_console_messages", { pageId }),
      );
      assert.doesNotMatch(messages, /error|warn/iu);
    } finally {
      server.close();
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
