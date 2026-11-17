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

const THROWING_STORAGE = `
  Object.defineProperty(window, "localStorage", {
    get() {
      throw new DOMException("denied", "SecurityError");
    },
  });
`;

type Tool = (
  name: string,
  args: Readonly<Record<string, unknown>>,
) => Promise<string>;

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

async function withGamePage(
  run: (page: Tool, url: string) => Promise<void>,
): Promise<void> {
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
        response.writeHead(HTTP_OK, { "content-type": contentType }).end(body),
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
    const url = `http://127.0.0.1:${String(address.port)}/`;
    const pages = textOf(
      await client.callTool("new_page", { url: "about:blank" }),
    );
    const pageId = Number(/^(\d+):.*\[selected\]$/mu.exec(pages)?.[1]);
    assert.ok(
      Number.isInteger(pageId),
      `new_page must select a page: ${pages}`,
    );
    await run(
      async (name, args) =>
        textOf(await client.callTool(name, { pageId, ...args })),
      url,
    );
  } finally {
    server.close();
    await rm(outputDirectory, { recursive: true, force: true });
  }
}

async function assertNoConsoleProblems(page: Tool): Promise<void> {
  const messages = await page("list_console_messages", {});
  assert.doesNotMatch(messages, /error|warn/iu);
}

async function clickByName(page: Tool, name: string): Promise<void> {
  const snapshot = await page("take_snapshot", {});
  const uid = new RegExp(`uid=(\\S+) button "${name}"`, "u").exec(
    snapshot,
  )?.[1];
  assert.ok(uid !== undefined, `snapshot must contain button "${name}"`);
  await page("click", { uid });
}

describe("browser", () => {
  it("the built page plays a game to a win without console errors", async () => {
    await withGamePage(async (page, url) => {
      await page("navigate_page", { url });
      const text = await page("evaluate_script", {
        function: `() => {
          const cells = [...document.querySelectorAll("#board .cell")];
          for (const index of [0, 3, 1, 4, 2]) cells[index].click();
          return {
            status: document.getElementById("status").textContent,
            marks: cells.map((cell) => cell.querySelector(".mark-X") ? "X" : cell.querySelector(".mark-O") ? "O" : ".").join(""),
            winLines: document.querySelectorAll(".win-overlay path").length,
            scores: document.getElementById("scoreboard").textContent.replace(/\\s+/g, " ").trim(),
            disabled: cells.every((cell) => cell.ariaDisabled === "true"),
          };
        }`,
      });
      assert.match(text, /X wins!/u);
      assert.match(text, /XXXOO\.\.\./u);
      assert.match(text, /"winLines":1/u);
      assert.match(text, /"disabled":true/u);
      assert.match(text, /X wins: 1 O wins: 0 Draws: 0/u);

      const restarted = await page("evaluate_script", {
        function: `() => {
          document.getElementById("restart").click();
          return {
            status: document.getElementById("status").textContent,
            winLines: document.querySelectorAll(".win-overlay path").length,
          };
        }`,
      });
      assert.match(restarted, /O to move/u);
      assert.match(restarted, /"winLines":0/u);
      await assertNoConsoleProblems(page);
    });
  });

  it("the built page plays sounds on real input and remembers the mute toggle across reloads", async () => {
    await withGamePage(async (page, url) => {
      await page("navigate_page", { url });
      await clickByName(page, "Mute");
      await page("navigate_page", { type: "reload" });
      const state = await page("evaluate_script", {
        function: `() => document.getElementById("mute").getAttribute("aria-pressed")`,
      });
      assert.match(state, /true/u);

      await clickByName(page, "Unmute");
      await page("click", {
        uid: /uid=(\S+) button "Row 1, column 1, empty"/u.exec(
          await page("take_snapshot", {}),
        )?.[1],
      });
      await page("navigate_page", { type: "reload" });
      const unmuted = await page("evaluate_script", {
        function: `() => document.getElementById("mute").getAttribute("aria-pressed")`,
      });
      assert.match(unmuted, /false/u);
      await assertNoConsoleProblems(page);
    });
  });

  it("the built page still works when storage access throws", async () => {
    await withGamePage(async (page, url) => {
      await page("navigate_page", { url, initScript: THROWING_STORAGE });
      await clickByName(page, "Mute");
      const state = await page("evaluate_script", {
        function: `() => {
          document.querySelector("#board .cell").click();
          return document.getElementById("mute").getAttribute("aria-pressed") + document.getElementById("status").textContent;
        }`,
      });
      assert.match(state, /trueO to move/u);
      await assertNoConsoleProblems(page);
    });
  });
});
